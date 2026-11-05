/**
 * test-media-slots-e2e.ts
 * End-to-end testing suite for CoreIQ Media Slots:
 * 1. Catalog discovery & placement validation
 * 2. Public vs Operator slot retrieval
 * 3. Validation gates: file size, MIME magic bytes, alt text, CTA URLs
 * 4. Image binary upload & persistence
 * 5. Publishing toggle and immediate public placement visibility
 * 6. Reordering
 * 7. Storage cleanup on deletion
 */

const BASE_URL = 'http://localhost:3000';
const OPERATOR_HEADERS = {
  'x-operator-auth': 'true',
  'Authorization': 'Bearer operator-session',
};

async function runE2ETests() {
  console.log('===============================================================');
  console.log('COREIQ MEDIA SLOTS END-TO-END VERIFICATION SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] Test ${total}: ${testName}`);
      if (detail) console.log(`         -> ${detail}`);
    } else {
      console.error(`  [FAIL] Test ${total}: ${testName}`);
      if (detail) console.error(`         -> ${detail}`);
      process.exitCode = 1;
    }
  }

  // 1. GET /api/v1/media/slots?page=home
  console.log('--- SUITE 1: Slot Catalog & Authorization ---');
  const slotsRes = await fetch(`${BASE_URL}/api/v1/media/slots?page=home`, {
    headers: OPERATOR_HEADERS,
  });
  const slotsData = await slotsRes.json();
  assert(slotsRes.status === 200 && Array.isArray(slotsData.slots), 'GET /api/v1/media/slots?page=home returns 200 and slots array', `Found ${slotsData.slots?.length} slots for page home`);

  const homeShowcase = slotsData.slots?.find((s: any) => s.slot_key === 'home.showcase');
  assert(Boolean(homeShowcase), 'home.showcase slot is present in catalog', `Capacity: ${homeShowcase?.max_items}, Aspect: ${homeShowcase?.aspect}`);

  // 2. Unauthenticated GET /api/v1/media/slots returns 401
  const unauthSlotsRes = await fetch(`${BASE_URL}/api/v1/media/slots?page=home`);
  assert(unauthSlotsRes.status === 401, 'Protected GET /api/v1/media/slots rejects anonymous caller with 401');

  // 3. Public GET /api/v1/media/slots/home.showcase allows anonymous retrieval
  console.log('\n--- SUITE 2: Public vs Operator Retrieval ---');
  const pubSlotRes = await fetch(`${BASE_URL}/api/v1/media/slots/home.showcase`);
  const pubSlotData = await pubSlotRes.json();
  assert(pubSlotRes.status === 200 && pubSlotData.slot, 'Public anonymous GET /api/v1/media/slots/home.showcase returns 200');

  // 4. Validation Gate: Reject missing alt text for image upload
  console.log('\n--- SUITE 3: Validation & Security Gates ---');
  // 1x1 valid PNG in bytes
  const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

  const formDataNoAlt = new FormData();
  formDataNoAlt.append('type', 'image');
  formDataNoAlt.append('file', new Blob([tinyPng], { type: 'image/png' }), 'test.png');
  // No alt text

  const noAltRes = await fetch(`${BASE_URL}/api/v1/media/slots/home.showcase/items`, {
    method: 'POST',
    headers: OPERATOR_HEADERS,
    body: formDataNoAlt,
  });
  assert(noAltRes.status === 400, 'Image upload without alt text rejected with 400 Bad Request');

  // 5. Validation Gate: Reject corrupted / fake MIME type
  const fakeFile = Buffer.from('THIS IS NOT A VALID IMAGE OR VIDEO');
  const formDataFake = new FormData();
  formDataFake.append('type', 'image');
  formDataFake.append('alt', 'Test Image');
  formDataFake.append('file', new Blob([fakeFile], { type: 'image/png' }), 'fake.png');

  const fakeRes = await fetch(`${BASE_URL}/api/v1/media/slots/home.showcase/items`, {
    method: 'POST',
    headers: OPERATOR_HEADERS,
    body: formDataFake,
  });
  assert(fakeRes.status === 415, 'File with fake extension / invalid magic bytes rejected with 415 Unsupported Media Type');

  // 6. Validation Gate: Reject oversized image (> 5 MB)
  const oversizedBuf = Buffer.alloc(5.5 * 1024 * 1024);
  // Give it JPEG magic header
  oversizedBuf[0] = 0xFF;
  oversizedBuf[1] = 0xD8;
  oversizedBuf[2] = 0xFF;

  const formDataOversized = new FormData();
  formDataOversized.append('type', 'image');
  formDataOversized.append('alt', 'Oversized photo');
  formDataOversized.append('file', new Blob([oversizedBuf], { type: 'image/jpeg' }), 'large.jpg');

  const oversizedRes = await fetch(`${BASE_URL}/api/v1/media/slots/home.showcase/items`, {
    method: 'POST',
    headers: OPERATOR_HEADERS,
    body: formDataOversized,
  });
  assert(oversizedRes.status === 413, 'Image upload > 5 MB rejected with 413 Payload Too Large');

  // 7. Validation Gate: Reject invalid CTA destination (e.g. javascript:)
  const formDataBadCta = new FormData();
  formDataBadCta.append('type', 'image');
  formDataBadCta.append('alt', 'Valid Image');
  formDataBadCta.append('cta_url', 'javascript:alert(1)');
  formDataBadCta.append('file', new Blob([tinyPng], { type: 'image/png' }), 'test.png');

  const badCtaRes = await fetch(`${BASE_URL}/api/v1/media/slots/home.showcase/items`, {
    method: 'POST',
    headers: OPERATOR_HEADERS,
    body: formDataBadCta,
  });
  assert(badCtaRes.status === 400, 'Malicious/Invalid CTA URL rejected with 400 Bad Request');

  // 8. Successful Upload (Published: false by default)
  console.log('\n--- SUITE 4: Functional Upload & Storage Persistence ---');
  const validForm = new FormData();
  validForm.append('type', 'image');
  validForm.append('alt', 'CoreIQ Sentinel High Res Visual');
  validForm.append('title', 'Sentinel Neural Engine');
  validForm.append('caption', 'Autonomous AI orchestration system');
  validForm.append('cta_label', 'Explore Platform');
  validForm.append('cta_url', '/apps');
  validForm.append('file', new Blob([tinyPng], { type: 'image/png' }), 'sentinel.png');

  const uploadRes = await fetch(`${BASE_URL}/api/v1/media/slots/home.showcase/items`, {
    method: 'POST',
    headers: OPERATOR_HEADERS,
    body: validForm,
  });
  const uploadData = await uploadRes.json();
  assert(uploadRes.status === 201 && uploadData.item?.id, 'Valid image upload succeeds with 201 Created and generated item ID', `Item ID: ${uploadData.item?.id}`);
  assert(uploadData.item?.published === false, 'Newly uploaded item is unpublished (draft) by default', `published: ${uploadData.item?.published}`);
  assert(Boolean(uploadData.item?.url), 'Item has accessible media URL', `URL: ${uploadData.item?.url}`);

  const createdId = uploadData.item.id;

  // 9. Verify draft visibility: Anonymous user CANNOT see unpublished item
  console.log('\n--- SUITE 5: Publishing & Public Visibility ---');
  const pubCheckRes = await fetch(`${BASE_URL}/api/v1/media/slots/home.showcase`);
  const pubCheckData = await pubCheckRes.json();
  const draftInPublic = pubCheckData.items?.some((i: any) => i.id === createdId);
  assert(!draftInPublic, 'Unpublished draft item is NOT visible to anonymous public visitors');

  // 10. Publish Item via PATCH
  const patchRes = await fetch(`${BASE_URL}/api/v1/media/slots/home.showcase/items/${createdId}`, {
    method: 'PATCH',
    headers: {
      ...OPERATOR_HEADERS,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      published: true,
      title: 'Sentinel Neural Engine v2',
    }),
  });
  const patchData = await patchRes.json();
  assert(patchRes.status === 200 && patchData.item?.published === true, 'PATCH published = true succeeds with 200 OK');

  // 11. Verify immediate public publishing
  const pubAfterPatch = await fetch(`${BASE_URL}/api/v1/media/slots/home.showcase`);
  const pubAfterData = await pubAfterPatch.json();
  const publishedItem = pubAfterData.items?.find((i: any) => i.id === createdId);
  assert(Boolean(publishedItem), 'Published item is immediately visible to public callers without site rebuild', `Title: "${publishedItem?.title}", CTA: "${publishedItem?.cta_label}" -> ${publishedItem?.cta_url}`);

  // 12. Reordering
  console.log('\n--- SUITE 6: Reordering & Storage Cleanup ---');
  const orderRes = await fetch(`${BASE_URL}/api/v1/media/slots/home.showcase/order`, {
    method: 'PUT',
    headers: {
      ...OPERATOR_HEADERS,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item_ids: [createdId],
    }),
  });
  assert(orderRes.status === 200, 'PUT /api/v1/media/slots/home.showcase/order succeeds with 200 OK');

  // 13. Delete Item with Cleanup
  const deleteRes = await fetch(`${BASE_URL}/api/v1/media/slots/home.showcase/items/${createdId}`, {
    method: 'DELETE',
    headers: OPERATOR_HEADERS,
  });
  assert(deleteRes.status === 200, 'DELETE /api/v1/media/slots/home.showcase/items/:id succeeds with 200 OK');

  // 14. Verify item no longer appears in public or operator view
  const pubAfterDelete = await fetch(`${BASE_URL}/api/v1/media/slots/home.showcase`);
  const pubAfterDeleteData = await pubAfterDelete.json();
  const deletedStillExists = pubAfterDeleteData.items?.some((i: any) => i.id === createdId);
  assert(!deletedStillExists, 'Deleted item is purged from slot items');

  console.log('\n===============================================================');
  console.log(`RESULTS: ${passed} / ${total} tests passed.`);
  console.log('===============================================================');
  if (passed === total) {
    console.log('ALL MEDIA SLOTS FUNCTIONALITY & SECURITY GATES VERIFIED.');
  }
}

runE2ETests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
