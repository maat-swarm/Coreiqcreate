-- =========================================================================
-- CORE IQ CREATE // NEWS ARTICLES MIGRATION
-- Migration: 20261011_news_articles.sql
-- Description: Dynamic news articles table, RLS, and seed articles
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Frontier Models',
  hero_image TEXT NULL,
  author TEXT NOT NULL DEFAULT 'CoreIQ Intelligence Desk',
  read_time TEXT NOT NULL DEFAULT '4 min read',
  badge TEXT NULL DEFAULT 'BREAKING',
  featured BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  takeaways TEXT[] DEFAULT '{}',
  source TEXT NULL,
  accent_color TEXT NOT NULL DEFAULT 'cyan',
  published BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read published news articles') THEN
    CREATE POLICY "Public read published news articles" ON public.news_articles
      FOR SELECT TO public USING (published = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manage news articles') THEN
    CREATE POLICY "Service role manage news articles" ON public.news_articles
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth manage news articles') THEN
    CREATE POLICY "Auth manage news articles" ON public.news_articles
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Seed initial articles from newsData.ts (published = true)
INSERT INTO public.news_articles (
  id, slug, title, summary, body, category, author, read_time, badge, featured, tags, takeaways, source, accent_color, published, sort_order
) VALUES
(
  'n1000000-0000-0000-0000-000000000001',
  'gemini-3-multimodal-reasoning',
  'Gemini 3.0 Multimodal Reasoning & Agentic Workflows Reach General Availability',
  'Google rolls out advanced multimodal reasoning with sub-second tool execution, native audio duplexing, and autonomous multi-turn validation loops for production environments.',
  'Frontier artificial intelligence has crossed a key threshold with the general availability of Gemini 3.0 multimodal reasoning models. Unlike previous architectures that treated tool calling and reasoning as secondary post-processing steps, Gemini 3.0 integrates speculative decoding and dynamic execution sandboxes directly into the foundation model''s attention layers.

### Architectural Innovations
1. **Unified Multimodal Token Space:** Audio waveforms, high-fps video streams, and structured JSON tokens are tokenized into a single shared latent embedding space. This eliminates latency bottlenecks historically caused by chaining speech-to-text and image captioning models.
2. **Deterministic Tool Synthesis:** The model can construct, execute, and verify TypeScript and Python code payloads in milliseconds before emitting a response to the user.
3. **Multi-Agent Memory Anchors:** Native context caching allows long-horizon task execution across millions of tokens without linear cost degradation.

### Benchmark Highlights
In rigorous evaluation across SWE-bench Verified and GAIA complex reasoning suites, Gemini 3.0 demonstrated:
- **89.4% tool execution accuracy** on multi-step workflows.
- **42% reduction in end-to-end token latency** compared to Gemini 1.5 Pro.
- **Sub-190ms speech response times** in full-duplex WebRTC streaming configurations.

For builders on CoreIQ Create, this provides the cognitive foundation for autonomous customer operations, code generation pipelines, and zero-latency real-time agents.',
  'Frontier Models',
  'CoreIQ Intelligence Desk',
  '4 min read',
  'BREAKING',
  true,
  ARRAY['Gemini 3.0', 'Multimodal', 'Reasoning', 'Benchmarks', 'Google AI'],
  ARRAY[
    'Native speculative tool execution reduces reasoning latency by over 40%',
    'Single latent embedding space replaces separate STT/Vision pipelines',
    'Context caching enables cost-efficient enterprise workflows spanning millions of tokens'
  ],
  'CoreIQ Research & Frontier Intelligence',
  'cyan',
  true,
  1
),
(
  'n1000000-0000-0000-0000-000000000002',
  'mcp-universal-agent-standard',
  'Model Context Protocol (MCP) Cemented as Global Standard for Autonomous Tooling',
  'Over 80 enterprise platforms and developer ecosystems have adopted the open MCP JSON-RPC protocol, enabling zero-friction interoperability across autonomous developer swarms.',
  'The fragmentation of agent tool APIs has officially come to an end with the widespread adoption of the Model Context Protocol (MCP). By formalizing tools, resources, and prompt templates into a typed JSON-RPC specification, autonomous agents can now discover and invoke database queries, Git operations, and third-party APIs without proprietary adapters.

### Why MCP Won the Ecosystem
- **Universal Discovery:** When an agent boots, it requests tools/list and instantly understands input schemas, parameter requirements, and required access scopes.
- **Dual Transport Layer:** MCP supports both high-security local STDIO processes and streaming Server-Sent Events (SSE) / HTTP POST endpoints for remote microservices.
- **Cryptographic Auditability:** Every tool invocation can be signed and verified, creating tamper-proof execution logs for enterprise compliance.

CoreIQ Command integrates native MCP endpoints at /mcp and /api/v1/tools, allowing external orchestrators like Grok, Claude, and Hermes Prime to interact directly with website CMS, lead pipelines, and task boards.',
  'Tools & Protocols',
  'Desmond Vance, Commander',
  '5 min read',
  'INDUSTRY STANDARD',
  false,
  ARRAY['MCP', 'Protocols', 'Agent Swarm', 'DevTools', 'JSON-RPC'],
  ARRAY[
    'Typed JSON-RPC protocol eliminates bespoke API wrappers for autonomous agents',
    'Unified discovery allows agents to inspect schemas and permissions on boot',
    'Enables true cross-provider swarm orchestration between OpenAI, Google, and Anthropic nodes'
  ],
  'Autonomous Systems Standards Council',
  'purple',
  true,
  2
),
(
  'n1000000-0000-0000-0000-000000000003',
  'autonomous-coding-swarms-benchmark',
  'Multi-Agent Coding Swarms Achieve 89% Zero-Shot Bug Resolution on SWE-bench',
  'New decentralized swarm orchestration paradigms surpass monolithic reasoning models by dividing tasks among specialized planning, coding, and review nodes.',
  'Single-model prompt engineering has reached its practical plateau for complex software engineering. The frontier has shifted decisively to specialized multi-agent swarms.

Recent evaluations on the SWE-bench Verified dataset demonstrate that three specialized agents—an Architectural Planner, a Synthesizer, and an Adversarial Test Runner—solve complex GitHub issues with an 89.2% success rate, surpassing even the largest standalone frontier models.

### Key Swarm Roles
1. **The Planner:** Reads repository context, traces dependency graphs, and generates a minimal reproducible test case before writing code.
2. **The Synthesizer:** Produces target code patches using AST-aware diffing.
3. **The Adversarial Reviewer:** Runs sandbox unit tests and linters, repeatedly rejecting faulty candidates until invariants pass.

This verification loop forms the core architecture of CoreIQ Create venture pipelines.',
  'Autonomous Agents',
  'Swarm Systems Engineering',
  '6 min read',
  'BREAKTHROUGH',
  false,
  ARRAY['SWE-bench', 'Swarm Intelligence', 'Autonomous Coding', 'Multi-Agent', 'Verification'],
  ARRAY[
    'Specialized multi-agent trios outperform monolithic 400B+ models on real software engineering tasks',
    'Adversarial review nodes eliminate hallucinated imports and regression defects',
    'Deterministic sandbox execution provides empirical verification before committing changes'
  ],
  'CoreIQ Laboratory Benchmark Dispatch',
  'blue',
  true,
  3
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  author = EXCLUDED.author,
  read_time = EXCLUDED.read_time,
  badge = EXCLUDED.badge,
  tags = EXCLUDED.tags,
  takeaways = EXCLUDED.takeaways,
  published = EXCLUDED.published,
  sort_order = EXCLUDED.sort_order;
