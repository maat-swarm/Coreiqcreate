-- =========================================================================
-- CORE IQ CREATE // LEGAL DOCUMENTS (PAYFAST COMPLIANCE)
-- Migration: 20261105_legal_documents.sql
-- Description: Table, RLS, storage bucket, and seeds for compliance documents
-- =========================================================================

-- 1. Create table public.legal_documents
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('legal', 'compliance', 'policy', 'agreement', 'other')),
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  version int NOT NULL DEFAULT 1,
  storage_path text,
  file_name text,
  file_size_bytes bigint,
  file_mime_type text DEFAULT 'application/pdf',
  file_sha256 text,
  published_at timestamptz,
  archived_at timestamptz,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_legal_docs_status_order ON public.legal_documents (status, sort_order);
CREATE INDEX IF NOT EXISTS idx_legal_docs_category ON public.legal_documents (category);

-- 3. Row Level Security
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'legal_documents' AND policyname = 'Public read published legal documents'
  ) THEN
    CREATE POLICY "Public read published legal documents"
      ON public.legal_documents FOR SELECT
      TO public
      USING (status = 'published');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'legal_documents' AND policyname = 'Auth manage legal documents'
  ) THEN
    CREATE POLICY "Auth manage legal documents"
      ON public.legal_documents FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'legal_documents' AND policyname = 'Service role all legal documents'
  ) THEN
    CREATE POLICY "Service role all legal documents"
      ON public.legal_documents FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 4. Storage Bucket (Private bucket 'legal-documents')
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-documents',
  'legal-documents',
  false,
  4194304, -- 4MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 4194304,
  allowed_mime_types = ARRAY['application/pdf'];

-- Storage bucket access policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Service Role All Legal Documents Bucket'
  ) THEN
    CREATE POLICY "Service Role All Legal Documents Bucket"
      ON storage.objects FOR ALL
      TO service_role
      USING (bucket_id = 'legal-documents')
      WITH CHECK (bucket_id = 'legal-documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Auth Manage Legal Documents Bucket'
  ) THEN
    CREATE POLICY "Auth Manage Legal Documents Bucket"
      ON storage.objects FOR ALL
      TO authenticated
      USING (bucket_id = 'legal-documents')
      WITH CHECK (bucket_id = 'legal-documents');
  END IF;
END $$;

-- 5. Seed rows (12 initial compliance and trust documents)
INSERT INTO public.legal_documents (slug, title, category, description, status, sort_order)
VALUES
  (
    'terms-and-conditions',
    'Terms and Conditions',
    'legal',
    'Core customer terms covering ordering, delivery, refunds, cancellations, and disputes.',
    'draft',
    10
  ),
  (
    'privacy-policy',
    'Privacy Policy',
    'policy',
    'How we collect, process, store, and protect your personal information under POPIA and GDPR.',
    'draft',
    20
  ),
  (
    'terms-of-use',
    'Terms of Use',
    'legal',
    'Rules and acceptable use guidelines for visiting and interacting with CoreIQ Create.',
    'draft',
    30
  ),
  (
    'ai-use-disclosure',
    'AI Use & Disclosure Policy',
    'policy',
    'How artificial intelligence models are deployed, guarded, and audited across our systems.',
    'draft',
    40
  ),
  (
    'data-processing-addendum',
    'Data Processing Addendum',
    'compliance',
    'Contractual data protection commitments for enterprise clients and personal data operators.',
    'draft',
    50
  ),
  (
    'cookie-notice',
    'Cookie Notice',
    'policy',
    'Overview of essential, preference, and analytics cookies used across our platform.',
    'draft',
    60
  ),
  (
    'service-level-agreement',
    'Service Level Agreement',
    'agreement',
    'Uptime, response time, and maintenance guarantees for maintained tier clients.',
    'draft',
    70
  ),
  (
    'security-whitepaper',
    'Security Whitepaper',
    'compliance',
    'Architecture, encryption standards, access controls, and vulnerability disclosure practices.',
    'draft',
    80
  ),
  (
    'refund-cancellation-policy',
    'Refund & Cancellation Policy',
    'policy',
    'Clear refund windows, milestone cancellations, and payment dispute procedures for PayFast.',
    'draft',
    90
  ),
  (
    'delivery-fulfillment-policy',
    'Delivery & Fulfillment Policy',
    'policy',
    'Turnaround timelines, digital artifact delivery, and acceptance criteria for client builds.',
    'draft',
    100
  ),
  (
    'paia-manual',
    'PAIA Manual',
    'compliance',
    'Promotion of Access to Information Act manual and request procedures.',
    'draft',
    110
  ),
  (
    'merchant-compliance-notice',
    'Merchant Compliance Notice',
    'legal',
    'PayFast and South African payment gateway registration, merchant details, and billing policies.',
    'draft',
    120
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;
