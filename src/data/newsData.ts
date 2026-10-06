export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: 'Frontier Models' | 'Autonomous Agents' | 'Breakthroughs' | 'Tools & Protocols' | 'Enterprise & Cloud';
  date: string;
  readTime: string;
  author: string;
  badge: string;
  featured?: boolean;
  tags: string[];
  takeaways: string[];
  source?: string;
  accentColor: string;
}

export const NEWS_CATEGORIES = [
  'All',
  'Frontier Models',
  'Autonomous Agents',
  'Breakthroughs',
  'Tools & Protocols',
  'Enterprise & Cloud',
] as const;

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'news-1',
    slug: 'gemini-3-multimodal-reasoning',
    title: 'Gemini 3.0 Multimodal Reasoning & Agentic Workflows Reach General Availability',
    summary: 'Google rolls out advanced multimodal reasoning with sub-second tool execution, native audio duplexing, and autonomous multi-turn validation loops for production environments.',
    body: `Frontier artificial intelligence has crossed a key threshold with the general availability of Gemini 3.0 multimodal reasoning models. Unlike previous architectures that treated tool calling and reasoning as secondary post-processing steps, Gemini 3.0 integrates speculative decoding and dynamic execution sandboxes directly into the foundation model's attention layers.

### Architectural Innovations
1. **Unified Multimodal Token Space:** Audio waveforms, high-fps video streams, and structured JSON tokens are tokenized into a single shared latent embedding space. This eliminates latency bottlenecks historically caused by chaining speech-to-text and image captioning models.
2. **Deterministic Tool Synthesis:** The model can construct, execute, and verify TypeScript and Python code payloads in milliseconds before emitting a response to the user.
3. **Multi-Agent Memory Anchors:** Native context caching allows long-horizon task execution across millions of tokens without linear cost degradation.

### Benchmark Highlights
In rigorous evaluation across SWE-bench Verified and GAIA complex reasoning suites, Gemini 3.0 demonstrated:
- **89.4% tool execution accuracy** on multi-step workflows.
- **42% reduction in end-to-end token latency** compared to Gemini 1.5 Pro.
- **Sub-190ms speech response times** in full-duplex WebRTC streaming configurations.

For builders on CoreIQ Create, this provides the cognitive foundation for autonomous customer operations, code generation pipelines, and zero-latency real-time agents.`,
    category: 'Frontier Models',
    date: 'October 5, 2026',
    readTime: '4 min read',
    author: 'CoreIQ Intelligence Desk',
    badge: 'BREAKING',
    featured: true,
    tags: ['Gemini 3.0', 'Multimodal', 'Reasoning', 'Benchmarks', 'Google AI'],
    takeaways: [
      'Native speculative tool execution reduces reasoning latency by over 40%',
      'Single latent embedding space replaces separate STT/Vision pipelines',
      'Context caching enables cost-efficient enterprise workflows spanning millions of tokens',
    ],
    source: 'CoreIQ Research & Frontier Intelligence',
    accentColor: 'cyan',
  },
  {
    id: 'news-2',
    slug: 'mcp-universal-agent-standard',
    title: 'Model Context Protocol (MCP) Cemented as Global Standard for Autonomous Tooling',
    summary: 'Over 80 enterprise platforms and developer ecosystems have adopted the open MCP JSON-RPC protocol, enabling zero-friction interoperability across autonomous developer swarms.',
    body: `The fragmentation of agent tool APIs has officially come to an end with the widespread adoption of the Model Context Protocol (MCP). By formalizing tools, resources, and prompt templates into a typed JSON-RPC specification, autonomous agents can now discover and invoke database queries, Git operations, and third-party APIs without proprietary adapters.

### Why MCP Won the Ecosystem
- **Universal Discovery:** When an agent boots, it requests \`tools/list\` and instantly understands input schemas, parameter requirements, and required access scopes.
- **Dual Transport Layer:** MCP supports both high-security local STDIO processes and streaming Server-Sent Events (SSE) / HTTP POST endpoints for remote microservices.
- **Cryptographic Auditability:** Every tool invocation can be signed and verified, creating tamper-proof execution logs for enterprise compliance.

CoreIQ Command integrates native MCP endpoints at \`/mcp\` and \`/api/v1/tools\`, allowing external orchestrators like Grok, Claude, and Hermes Prime to interact directly with website CMS, lead pipelines, and task boards.`,
    category: 'Tools & Protocols',
    date: 'October 4, 2026',
    readTime: '5 min read',
    author: 'Desmond Vance, Commander',
    badge: 'INDUSTRY STANDARD',
    tags: ['MCP', 'Protocols', 'Agent Swarm', 'DevTools', 'JSON-RPC'],
    takeaways: [
      'Typed JSON-RPC protocol eliminates bespoke API wrappers for autonomous agents',
      'Unified discovery allows agents to inspect schemas and permissions on boot',
      'Enables true cross-provider swarm orchestration between OpenAI, Google, and Anthropic nodes',
    ],
    source: 'Autonomous Systems Standards Council',
    accentColor: 'purple',
  },
  {
    id: 'news-3',
    slug: 'autonomous-coding-swarms-benchmark',
    title: 'Multi-Agent Coding Swarms Achieve 89% Zero-Shot Bug Resolution on SWE-bench',
    summary: 'New decentralized swarm orchestration paradigms surpass monolithic reasoning models by dividing tasks among specialized planning, coding, and review nodes.',
    body: `Single-model prompt engineering has reached its practical plateau for complex software engineering. The frontier has shifted decisively to specialized multi-agent swarms.

Recent evaluations on the SWE-bench Verified dataset demonstrate that three specialized agents—an Architectural Planner, a Synthesizer, and an Adversarial Test Runner—solve complex GitHub issues with an 89.2% success rate, surpassing even the largest standalone frontier models.

### Key Swarm Roles
1. **The Planner:** Reads repository context, traces dependency graphs, and generates a minimal reproducible test case before writing code.
2. **The Implementer:** Makes minimal, surgically precise edits to the target files without altering existing coding standards.
3. **The Adversary:** Runs the test suite, introduces edge-case assertions, and forces the implementer to loop until compilation and tests pass with zero regressions.

This architecture closely mirrors the CoreIQ Create engineering loop: Read before Write, One Change at a Time, and Zero Claims without Evidence.`,
    category: 'Autonomous Agents',
    date: 'October 3, 2026',
    readTime: '6 min read',
    author: 'Elena Rostova, AI Systems Lead',
    badge: 'BENCHMARK',
    tags: ['SWE-bench', 'Coding Agents', 'Swarm Intelligence', 'Automated Testing'],
    takeaways: [
      'Specialized roles (Planner, Implementer, Adversary) beat single monolithic prompts',
      'Test-driven feedback loops reduce code regressions by 74%',
      'Cost per bug resolution drops significantly when smaller models are coordinated properly',
    ],
    source: 'Software Engineering AI Research Group',
    accentColor: 'blue',
  },
  {
    id: 'news-4',
    slug: 'edge-slm-on-device-breakthroughs',
    title: 'Sub-4B Parameter Small Language Models (SLMs) Match GPT-4 Class Reasoning on Edge Silicon',
    summary: 'Quantization innovations and synthetic distillation datasets allow 3B parameter models to execute offline structured tool calling at 65 tokens/sec on mobile chips.',
    body: `The belief that capable AI requires massive data centers is rapidly becoming outdated. Breakthroughs in ternary quantization (1.58-bit representations) and curriculum distillation have produced sub-4B models that rival GPT-4 on structured reasoning, function calling, and document comprehension.

Running locally on consumer hardware like the Apple M4, Qualcomm Snapdragon X Elite, and Google Tensor G5, these edge models process data with complete zero-data-retention privacy and zero cloud egress fees.

### Strategic Implications
- **Offline Reliability:** Critical industrial and healthcare applications no longer fail during network interruptions.
- **Zero Latency:** Time-to-first-token drops to under 30 milliseconds on unified memory architectures.
- **Hybrid Tiering:** Enterprises can route simple tasks locally and escalate only ambiguous multi-step reasoning to cloud frontier models, slashing compute budgets by 80%.`,
    category: 'Breakthroughs',
    date: 'October 2, 2026',
    readTime: '4 min read',
    author: 'Marcus Chen, Silicon & Hardware',
    badge: 'EDGE AI',
    tags: ['Edge AI', 'SLMs', 'Local AI', 'Quantization', 'Privacy'],
    takeaways: [
      '3B parameter distilled models achieve parity with legacy frontier reasoning',
      'Enables offline zero-latency execution on phones and edge devices',
      'Hybrid routing reduces enterprise cloud API costs by up to 80%',
    ],
    source: 'Applied Machine Learning Journal',
    accentColor: 'emerald',
  },
  {
    id: 'news-5',
    slug: 'enterprise-agent-governance-report',
    title: '2026 Enterprise Agent Governance: Guardrails, Auditing, and RLS Hardening',
    summary: 'A definitive operational framework for securing machine-to-machine API keys, preventing prompt extraction, and enforcing row-level security across agentic data pipelines.',
    body: `As autonomous agents gain direct access to financial rails, customer CRM databases, and cloud infrastructure, cybersecurity protocols have evolved to treat agents as autonomous machine identities rather than human delegates.

### Mandatory Hardening Pillars
1. **Cryptographic Scopes:** Tokens must carry granular permissions (e.g., \`READ_LEADS\`, \`WRITE_CONTENT\`) rather than universal administrative access.
2. **Database Row Level Security (RLS):** Application code cannot be trusted alone; the database engine must enforce tenant boundaries at the SQL row level.
3. **Execution Guardrails:** Autonomous loops must have circuit breakers, strict per-hour token budgets, and anomaly detection for unusual data exfiltration attempts.

CoreIQ Command enforces these principles through SHA-256 hashed machine tokens, real-time scope validation middleware, and automated error trapping.`,
    category: 'Enterprise & Cloud',
    date: 'October 1, 2026',
    readTime: '5 min read',
    author: 'CoreIQ Security Division',
    badge: 'SECURITY',
    tags: ['Security', 'Enterprise AI', 'Governance', 'RLS', 'Cybersecurity'],
    takeaways: [
      'Treat AI agents as first-class machine identities with cryptographically hashed tokens',
      'Row Level Security (RLS) is non-negotiable for multi-tenant agent databases',
      'Circuit breakers prevent recursive infinite loops and budget overruns',
    ],
    source: 'Enterprise AI Security Institute',
    accentColor: 'amber',
  },
  {
    id: 'news-6',
    slug: 'realtime-voice-duplexing-scale',
    title: 'WebRTC Audio Duplexing Closes Latency Gap in Conversational AI to 180ms',
    summary: 'Direct speech-to-speech neural streaming replaces chained STT-LLM-TTS pipelines, delivering natural human interruption handling and emotional intonation at scale.',
    body: `Conversational AI has shed its mechanical pauses. By eliminating intermediate text transcription and processing continuous audio frames through native neural duplexers, latency has fallen beneath the human conversational perception threshold of 200 milliseconds.

Users can speak naturally, interrupt mid-sentence, pause for thought, and receive responses with nuanced tone and pacing.

### Core Architecture
- **Continuous Bidirectional Audio Streams:** Audio flows over WebRTC UDP sockets directly into the model's audio encoder.
- **Voice Activity Detection (VAD) Neural Pruning:** The model dynamically discerns ambient background noise from intentional human speech.
- **Adaptive Interruption Curves:** When the user begins speaking, the audio synthesis engine smoothly ducks volume and cancels active speculative tokens without audio pops.`,
    category: 'Breakthroughs',
    date: 'September 29, 2026',
    readTime: '3 min read',
    author: 'Liam O’Connor, Audio & Voice',
    badge: 'VOICE AI',
    tags: ['Voice AI', 'WebRTC', 'Low Latency', 'Speech Synthesis', 'Duplex'],
    takeaways: [
      'End-to-end speech streaming eliminates transcription lag entirely',
      'Sub-200ms turnaround feels instantaneous and conversational',
      'Smooth interruption handling mimics natural human dialogue dynamics',
    ],
    source: 'Conversational Computing Quarterly',
    accentColor: 'pink',
  },
];

export const TRENDING_TOPICS = [
  { tag: 'Gemini 3.0', count: '14 updates' },
  { tag: 'Model Context Protocol', count: '28 tools' },
  { tag: 'SWE-bench', count: '8 benchmarks' },
  { tag: 'Edge SLMs', count: '19 models' },
  { tag: 'Autonomous Swarms', count: '41 nodes' },
  { tag: 'Voice Duplexing', count: '12 APIs' },
];
