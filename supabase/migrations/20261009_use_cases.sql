-- Use case categories (seeded)
CREATE TABLE IF NOT EXISTS use_case_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  label text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

INSERT INTO use_case_categories (slug, label, sort_order) VALUES
  ('ai-agents',    'AI Agents',    1),
  ('automation',   'Automation',   2),
  ('apps',         'Apps',         3),
  ('voice-ai',     'Voice AI',     4),
  ('integrations', 'Integrations', 5)
ON CONFLICT (slug) DO UPDATE SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order;

-- Individual use cases
CREATE TABLE IF NOT EXISTS use_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug text NOT NULL REFERENCES use_case_categories(slug) ON DELETE CASCADE,
  title text NOT NULL,
  problem text NOT NULL,
  approach text NOT NULL,
  outcome text NOT NULL,
  audience text NOT NULL CHECK (audience IN ('personal', 'business', 'both')),
  industry_tags text[] DEFAULT '{}',
  image_url text,
  image_alt text,
  published boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Downloadable files per use case (multiple, any file type)
CREATE TABLE IF NOT EXISTS use_case_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id uuid NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
  filename text NOT NULL,
  storage_path text NOT NULL,
  label text NOT NULL,
  file_type text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE use_case_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE use_case_files ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read categories') THEN
    CREATE POLICY "Public read categories" ON use_case_categories FOR SELECT TO public USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read published use cases') THEN
    CREATE POLICY "Public read published use cases" ON use_cases FOR SELECT TO public USING (published = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read use case files') THEN
    CREATE POLICY "Public read use case files" ON use_case_files FOR SELECT TO public USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth manage categories') THEN
    CREATE POLICY "Auth manage categories" ON use_case_categories FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth manage use cases') THEN
    CREATE POLICY "Auth manage use cases" ON use_cases FOR ALL TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth manage use case files') THEN
    CREATE POLICY "Auth manage use case files" ON use_case_files FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- Storage bucket for use case files (images + downloadable files)
INSERT INTO storage.buckets (id, name, public)
VALUES ('use-cases', 'use-cases', false)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth upload use case assets') THEN
    CREATE POLICY "Auth upload use case assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'use-cases');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth update use case assets') THEN
    CREATE POLICY "Auth update use case assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'use-cases');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth delete use case assets') THEN
    CREATE POLICY "Auth delete use case assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'use-cases');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read use case assets') THEN
    CREATE POLICY "Public read use case assets" ON storage.objects FOR SELECT TO public USING (bucket_id = 'use-cases');
  END IF;
END $$;

-- 15 Seeded Use Cases (published = false initially)
INSERT INTO use_cases (id, category_slug, title, problem, approach, outcome, audience, industry_tags, published, sort_order) VALUES
  -- AI Agents
  ('c1000000-0000-0000-0000-000000000001', 'ai-agents', 'Autonomous Customer Support Agent',
   'Customer queries went unanswered after hours, leading to high churn and overwhelmed support staff during peak hours.',
   'Deployed a multi-tiered LLM support agent grounded in the product catalog, policies, and ticketing history.',
   '82% of first-touch tickets resolved instantly, response times dropped from 4 hours to 12 seconds, 24/7 availability.',
   'business', ARRAY['retail', 'e-commerce', 'technology'], false, 1),

  ('c1000000-0000-0000-0000-000000000002', 'ai-agents', 'Personal Deep Research Assistant',
   'Information overload and hours lost scouring journals, whitepapers, and market feeds for actionable insights.',
   'Crafted an autonomous research agent that synthesizes multi-source research into structured executive dossiers.',
   'Cut literature and market analysis time by 75% while producing citation-backed executive briefs with full provenance.',
   'personal', ARRAY['research', 'creative', 'education'], false, 2),

  ('c1000000-0000-0000-0000-000000000003', 'ai-agents', 'AI Lead Qualification & Triage Agent',
   'Sales reps spent 60% of their workday filtering out tire-kickers and outdated inbound form fills.',
   'Built an conversational qualifier that engages inbound leads within 30 seconds across web, email, and chat.',
   'Lead-to-pipeline conversion increased by 44%; high-intent buyers booked direct demo calls automatically.',
   'business', ARRAY['finance', 'real-estate', 'legal'], false, 3),

  -- Automation
  ('c1000000-0000-0000-0000-000000000004', 'automation', 'Intelligent Invoice Processing Pipeline',
   'Manual data entry of supplier invoices created error rates of 6% and 14-day payment settlement delays.',
   'Engineered optical document understanding pipelines with automated three-way matching against POs and ERP ledgers.',
   'Reduced processing cycle from 14 days to under 3 minutes; zero reconciliatory errors across 10,000+ monthly invoices.',
   'business', ARRAY['finance', 'accounting', 'logistics'], false, 1),

  ('c1000000-0000-0000-0000-000000000005', 'automation', 'Proactive Appointment Reminders & Rescheduling',
   'Clinic and practice no-show rates hovered at 23%, bleeding operational revenue and delaying patient care.',
   'Built intelligent SMS and WhatsApp bi-directional reminder flows that detect rescheduling intents and adjust calendar slots.',
   'No-shows plummeted by 68%; reclaimed an average of 18 billable consultation hours per practitioner each month.',
   'both', ARRAY['healthcare', 'professional-services', 'trades'], false, 2),

  ('c1000000-0000-0000-0000-000000000006', 'automation', 'Multi-Channel Content & Social Distribution Flow',
   'Creating and scheduling tailored social copy across four networks took 12 hours every week for solo creators.',
   'Constructed an automated repurposing pipeline from long-form audio/text into platform-native threads, carousel drafts, and assets.',
   'Weekly distribution time dropped from 12 hours to 45 minutes with a 3.2x increase in consistent publishing cadence.',
   'both', ARRAY['creative', 'marketing', 'media'], false, 3),

  -- Apps
  ('c1000000-0000-0000-0000-000000000007', 'apps', 'Boutique Hotel & Venue Booking Portal',
   'Third-party booking platforms captured 18% commission fees while delivering generic guest booking experiences.',
   'Created a direct reservation web application featuring personalized add-on bundles, instant room holds, and Stripe checkout.',
   'Direct bookings rose by 53%, slashing OTA commission overhead while improving guest pre-arrival satisfaction scores.',
   'business', ARRAY['hospitality', 'travel', 'events'], false, 1),

  ('c1000000-0000-0000-0000-000000000008', 'apps', 'Personal Wealth & Cash-Flow Planner',
   'Disconnected bank accounts and generic budgeting apps failed to forecast upcoming tax deadlines and cash buffer milestones.',
   'Built a private, encrypted personal finance tracker with automated categorization and predictive runaway modeling.',
   'Clear 6-month forward visibility into savings, zero missed tax estimated payments, and completely self-hosted privacy.',
   'personal', ARRAY['finance', 'lifestyle'], false, 2),

  ('c1000000-0000-0000-0000-000000000009', 'apps', 'Field Service Dispatch & Quoting Mobile App',
   'Contractors and electricians relied on paper work orders, delaying customer invoice generation by up to two weeks.',
   'Deployed a progressive field application enabling offline signature capture, photo attachments, and instant PDF quotes.',
   'On-site quote acceptance doubled; invoice collection turnaround decreased from 21 days to under 48 hours.',
   'business', ARRAY['trades', 'construction', 'field-services'], false, 3),

  -- Voice AI
  ('c1000000-0000-0000-0000-000000000010', 'voice-ai', '24/7 After-Hours Intelligent Receptionist',
   'Emergency plumbing, HVAC, and legal clients missed calls after 6 PM, losing prospective retainer clients to competitors.',
   'Installed an ultra-low latency voice agent capable of emergency triage, caller intake, and urgent SMS escalation dispatch.',
   '100% of after-hours calls answered within two rings; secured $42k in monthly revenue from previously lost calls.',
   'business', ARRAY['trades', 'legal', 'professional-services'], false, 1),

  ('c1000000-0000-0000-0000-000000000011', 'voice-ai', 'Voice-Activated Home & Executive Task Hub',
   'Standard smart home voice assistants failed to handle multi-step workspace queries or execute real business API calls.',
   'Configured a custom voice assistant bridge that links natural spoken commands to task boards, emails, and home devices.',
   'Hands-free voice capture of meeting notes, follow-up task dispatch, and calendar blocking in under 10 seconds.',
   'personal', ARRAY['productivity', 'smart-home'], false, 2),

  ('c1000000-0000-0000-0000-000000000012', 'voice-ai', 'Automated Dental & Medical Recall Voice Assistant',
   'Reception staff spent 15 hours per week manually calling patients overdue for recurring hygiene checkups.',
   'Introduced a warm, HIPAA-compliant conversational voice agent that dials overdue patients to schedule open chair times.',
   'Rebooked 34% of dormant patients within the first campaign wave, freeing 60 staff hours every month.',
   'business', ARRAY['healthcare', 'dental', 'wellness'], false, 3),

  -- Integrations
  ('c1000000-0000-0000-0000-000000000013', 'integrations', 'CRM & WhatsApp Direct Business Bridge',
   'Sales agents conducted deals on personal WhatsApp numbers, resulting in lost client history and zero CRM tracking.',
   'Built a secure two-way WhatsApp Business API connector that mirrors all conversations and media into HubSpot and Salesforce.',
   '100% CRM compliance, zero lead leakage when staff transition, and real-time deal stage advancement via chat triggers.',
   'business', ARRAY['sales', 'retail', 'automotive'], false, 1),

  ('c1000000-0000-0000-0000-000000000014', 'integrations', 'Accounting & Invoicing Bi-Directional Sync',
   'Stripe transactions, recurring subscriptions, and manual bank wires were manually reconciled each month in Xero.',
   'Constructed an automated middleware sync with tax jurisdiction mapping, fee separation, and daily batch reconciliations.',
   'Eliminated 25 hours of monthly manual bookkeeper reconciliation; tax audit readiness reached 100%.',
   'business', ARRAY['finance', 'e-commerce', 'saas'], false, 2),

  ('c1000000-0000-0000-0000-000000000015', 'integrations', 'E-Commerce Inventory & Logistics Multi-Warehouse Sync',
   'Selling across Shopify, Amazon, and retail storefronts caused stockouts and overselling penalties.',
   'Implemented an event-driven stock synchronization engine across 3 regional fulfillment centers and all sales channels.',
   'Overselling dropped to absolute zero; warehouse transfer routing optimized by 38% based on localized demand signals.',
   'business', ARRAY['retail', 'logistics', 'manufacturing'], false, 3)
ON CONFLICT (id) DO NOTHING;
