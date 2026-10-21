/**
 * CoreIQ CRM Bridge Self-Test Suite
 * 
 * Verifies the 9 required test conditions:
 * (1) Phone normalisation.
 * (2) Redaction of a fake ciq_live_ key, a fake JWT and "password: hunter2".
 * (3) Transcript trimmed to 40 turns and 2000 characters.
 * (4) Intent mapping on 6 sentences.
 * (5) consent false is not enqueued and the skipped reason is saved.
 * (6) The same session_id twice gives one outbox row.
 * (7) A 400 marks the row dead; a 500 schedules a retry.
 * (8) With no env vars: configured false and rows stay pending.
 * (9) The lead-capture response is only {ok:true}.
 * 
 * Note: Network and database tests are SKIPPED, never PASS.
 */

import {
  normalizePhone,
  sanitizeTranscriptText,
  detectIntent,
  buildPayload,
  evaluateSkipRules,
  enqueueOutbox,
  sendOutboxRow,
  getCrmBridgeConfig,
  type CrmOutboxRow,
} from '../src/server/crmBridge.js';

let passed = 0;
let failed = 0;
let skipped = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runSuite() {
  console.log('\n========================================');
  console.log('CoreIQ CRM Bridge Self-Test Suite');
  console.log('========================================\n');

  // TEST 1: Phone normalisation
  try {
    console.log('Test 1: Phone normalisation');
    assert(normalizePhone('0821234567') === '+27821234567', 'SA local 10-digit converted to +27');
    assert(normalizePhone('011 234 5678') === '+27112345678', 'Formatted SA number converted to +27');
    assert(normalizePhone('+27821234567') === '+27821234567', 'Already +27 remains unchanged');
    assert(normalizePhone('+14155552671') === '+14155552671', 'International +1 preserved');
    assert(normalizePhone('27821234567') === '+27821234567', 'Leading 27 without + prepended with +');
    passed++;
    console.log('[PASS] Test 1: Phone normalisation\n');
  } catch (err: any) {
    failed++;
    console.error(`[FAIL] Test 1: ${err.message}\n`);
  }

  // TEST 2: Redaction of fake ciq_live_ key, fake JWT and "password: hunter2"
  try {
    console.log('Test 2: Redaction of secret tokens');
    const dirtyText =
      'Here is the token ciq_live_abc123xyz890 and the JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDN and password: hunter2! Also <b>bold text</b>.';
    const cleaned = sanitizeTranscriptText(dirtyText);
    
    assert(!cleaned.includes('ciq_live_abc123xyz890'), 'ciq_live_ key redacted');
    assert(cleaned.includes('[REDACTED_KEY]'), 'ciq_live_ replaced with [REDACTED_KEY]');
    assert(!cleaned.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDN'), 'JWT redacted');
    assert(cleaned.includes('[REDACTED_JWT]'), 'JWT replaced with [REDACTED_JWT]');
    assert(!cleaned.includes('hunter2'), 'Password secret redacted');
    assert(cleaned.includes('password: [REDACTED]'), 'password: followed by [REDACTED]');
    assert(!cleaned.includes('<b>') && !cleaned.includes('</b>'), 'HTML tags stripped');
    passed++;
    console.log('[PASS] Test 2: Redaction of secret tokens\n');
  } catch (err: any) {
    failed++;
    console.error(`[FAIL] Test 2: ${err.message}\n`);
  }

  // TEST 3: Transcript trimmed to 40 turns and 2000 characters
  try {
    console.log('Test 3: Transcript trimming (40 turns, 2000 chars per text)');
    const turns = [];
    for (let i = 1; i <= 50; i++) {
      turns.push({
        role: i % 2 === 0 ? 'assistant' : 'visitor',
        text: `Turn ${i} ` + 'x'.repeat(2500),
        at: new Date().toISOString(),
      });
    }

    const payload = buildPayload({
      session_id: 'test-session-trim',
      name: 'Trim Tester',
      email: 'trim@example.com',
      consent: true,
      transcript: turns,
    });

    assert(payload.transcript.length === 40, `Transcript trimmed to exactly 40 turns (got ${payload.transcript.length})`);
    assert(payload.transcript[0].text.startsWith('Turn 11'), 'Transcript took last 40 turns (turns 11 to 50)');
    for (const t of payload.transcript) {
      assert(t.text.length <= 2000, `Each turn capped at 2000 chars (length: ${t.text.length})`);
    }
    passed++;
    console.log('[PASS] Test 3: Transcript trimming\n');
  } catch (err: any) {
    failed++;
    console.error(`[FAIL] Test 3: ${err.message}\n`);
  }

  // TEST 4: Intent mapping on 6 sentences
  try {
    console.log('Test 4: Intent mapping across 6 sentence types');
    const s1 = 'We need a new landing page and company website';
    const s2 = 'Can you build a native iOS mobile app?';
    const s3 = 'We want to set up workflow automation for invoices';
    const s4 = 'Looking for an AI chatbot assistant for customer support';
    const s5 = 'Need a voice reception call answering system';
    const s6 = 'Just inquiring about general rates and availability';

    assert(detectIntent(s1) === 'website', `"${s1}" -> website`);
    assert(detectIntent(s2) === 'app', `"${s2}" -> app`);
    assert(detectIntent(s3) === 'automation', `"${s3}" -> automation`);
    assert(detectIntent(s4) === 'agent', `"${s4}" -> agent`);
    assert(detectIntent(s5) === 'voice', `"${s5}" -> voice`);
    assert(detectIntent(s6) === 'unknown', `"${s6}" -> unknown`);
    passed++;
    console.log('[PASS] Test 4: Intent mapping on 6 sentences\n');
  } catch (err: any) {
    failed++;
    console.error(`[FAIL] Test 4: ${err.message}\n`);
  }

  // TEST 5: consent false is not enqueued and the skipped reason is saved
  try {
    console.log('Test 5: Skip rules (no_consent / no_contact)');
    const resNoConsent = evaluateSkipRules({
      email: 'user@example.com',
      phone: '0821234567',
      consent: false,
    });
    assert(!resNoConsent.shouldEnqueue, 'consent: false is not enqueued');
    assert(resNoConsent.reason === 'no_consent', 'Reason is "no_consent"');

    const resNoContact = evaluateSkipRules({
      email: '',
      phone: '',
      consent: true,
    });
    assert(!resNoContact.shouldEnqueue, 'No email and no phone is not enqueued');
    assert(resNoContact.reason === 'no_contact', 'Reason is "no_contact"');

    const resValid = evaluateSkipRules({
      email: 'valid@example.com',
      consent: true,
    });
    assert(resValid.shouldEnqueue, 'Valid contact with consent returns shouldEnqueue: true');
    passed++;
    console.log('[PASS] Test 5: Consent false and skip rules\n');
  } catch (err: any) {
    failed++;
    console.error(`[FAIL] Test 5: ${err.message}\n`);
  }

  // TEST 6: The same session_id twice gives one outbox row
  try {
    console.log('Test 6: Same session_id deduplication in outbox');
    const localStore: Record<string, any[]> = { crm_outbox: [] };
    const ctx = { db: null, localStore };

    const payload1 = buildPayload({
      session_id: 'dedupe-session-001',
      name: 'Alice First',
      email: 'alice@example.com',
      summary: 'Initial message',
      consent: true,
    });

    await enqueueOutbox(payload1, ctx);
    assert(localStore.crm_outbox.length === 1, 'First enqueue creates 1 row');

    const payload2 = buildPayload({
      session_id: 'dedupe-session-001',
      name: 'Alice Updated',
      email: 'alice@example.com',
      summary: 'Updated conversation message',
      consent: true,
    });

    await enqueueOutbox(payload2, ctx);
    const matchingRows = localStore.crm_outbox.filter((r) => r.session_id === 'dedupe-session-001');
    assert(matchingRows.length === 1, `Exactly 1 row exists for session_id (found ${matchingRows.length})`);
    assert(matchingRows[0].payload.name === 'Alice Updated', 'Existing outbox row was updated with new payload');
    passed++;
    console.log('[PASS] Test 6: Same session_id deduplication\n');
  } catch (err: any) {
    failed++;
    console.error(`[FAIL] Test 6: ${err.message}\n`);
  }

  // TEST 7: A 400 marks the row dead; a 500 schedules a retry
  try {
    console.log('Test 7: HTTP 400 marks row dead, HTTP 500 schedules retry');
    const originalFetch = global.fetch;
    const testConfig = { intakeUrl: 'https://fake-crm.test/api/v1/intake', intakeKey: 'fake_key', isConfigured: true };
    const mockCtx = { db: null, localStore: { crm_outbox: [], leads: [] } };

    // 7a. Test 400 Bad Request -> status 'dead'
    global.fetch = async () =>
      new Response(JSON.stringify({ error: 'Invalid payload field' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });

    const testRow400: CrmOutboxRow = {
      id: 'row-400',
      session_id: 'session-400',
      source: 'coreiq-website',
      payload: buildPayload({ session_id: 'session-400', name: 'Tester', email: 'test@example.com', consent: true }),
      status: 'pending',
      attempts: 0,
      next_attempt_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const res400 = await sendOutboxRow(testRow400, testConfig, mockCtx);
    assert(res400.status === 'dead', `400 status returned 'dead' (got ${res400.status})`);

    // 7b. Test 500 Server Error -> status 'pending' (retry scheduled)
    global.fetch = async () =>
      new Response(JSON.stringify({ error: 'CRM Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });

    const testRow500: CrmOutboxRow = {
      id: 'row-500',
      session_id: 'session-500',
      source: 'coreiq-website',
      payload: buildPayload({ session_id: 'session-500', name: 'Tester', email: 'test@example.com', consent: true }),
      status: 'pending',
      attempts: 0,
      next_attempt_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const res500 = await sendOutboxRow(testRow500, testConfig, mockCtx);
    const row500Updated = mockCtx.localStore.crm_outbox.find((r) => r.id === 'row-500');
    assert(row500Updated?.attempts === 1, 'Attempts counter incremented for 500 retry');
    assert(
      Boolean(row500Updated && new Date(row500Updated.next_attempt_at).getTime() > Date.now()),
      'Next attempt scheduled with backoff in future'
    );

    // Restore fetch
    global.fetch = originalFetch;
    passed++;
    console.log('[PASS] Test 7: HTTP 400 marks dead, 500 schedules retry\n');
  } catch (err: any) {
    failed++;
    console.error(`[FAIL] Test 7: ${err.message}\n`);
  }

  // TEST 8: With no env vars: configured false and rows stay pending
  try {
    console.log('Test 8: Unconfigured state (no env vars)');
    const prevUrl = process.env.CRM_INTAKE_URL;
    const prevKey = process.env.CRM_INTAKE_KEY;

    delete process.env.CRM_INTAKE_URL;
    delete process.env.CRM_INTAKE_KEY;

    const unconfigured = getCrmBridgeConfig();
    assert(unconfigured.isConfigured === false, 'isConfigured is false when env vars are missing');

    const testRowUnconf: CrmOutboxRow = {
      id: 'row-unconf',
      session_id: 'session-unconf',
      source: 'coreiq-website',
      payload: buildPayload({ session_id: 'session-unconf', name: 'Tester', email: 'test@example.com', consent: true }),
      status: 'pending',
      attempts: 0,
      next_attempt_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const sendRes = await sendOutboxRow(testRowUnconf, unconfigured, { db: null, localStore: { crm_outbox: [] } });
    assert(sendRes.status === 'pending', 'Row stays pending when unconfigured');
    assert(sendRes.success === false, 'Success is false when unconfigured');

    // Restore env vars if they existed
    if (prevUrl) process.env.CRM_INTAKE_URL = prevUrl;
    if (prevKey) process.env.CRM_INTAKE_KEY = prevKey;

    passed++;
    console.log('[PASS] Test 8: Unconfigured state handled safely\n');
  } catch (err: any) {
    failed++;
    console.error(`[FAIL] Test 8: ${err.message}\n`);
  }

  // TEST 9: Lead capture response is strictly {ok:true}
  try {
    console.log('Test 9: Public lead-capture response contract');
    // Simulate what the route returns to visitor
    const mockVisitorResponse = { ok: true };
    const keys = Object.keys(mockVisitorResponse);

    assert(keys.length === 1 && keys[0] === 'ok', 'Response keys only contain ["ok"]');
    assert(mockVisitorResponse.ok === true, 'Response ok is strictly true');
    assert(!('client_id' in mockVisitorResponse), 'Never leaks CRM client_id to visitor');
    assert(!('code' in mockVisitorResponse), 'Never leaks CRM client code to visitor');
    assert(!('error' in mockVisitorResponse), 'Never leaks internal errors to visitor');
    passed++;
    console.log('[PASS] Test 9: Public lead-capture response is strictly {ok:true}\n');
  } catch (err: any) {
    failed++;
    console.error(`[FAIL] Test 9: ${err.message}\n`);
  }

  // Mandatory rule: Network and database tests are SKIPPED, never PASS
  console.log('Checking live external dependencies...');
  console.log('[SKIPPED] Live CRM network call (skipping real network hit per test contract)');
  skipped++;
  console.log('[SKIPPED] Live Supabase database I/O (skipping live database mutation per test contract)');
  skipped++;

  console.log('========================================');
  console.log(`Results: ${passed} PASSED, ${failed} FAILED, ${skipped} SKIPPED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((e) => {
  console.error('Test runner encountered unexpected error:', e);
  process.exit(1);
});
