import { ContentType, ContentStatus } from '../types/command';

export interface ContentManifestEntry {
  page: string;
  content_key: string;
  content_type: ContentType;
  required: boolean;
  slug?: string;
  category?: string;
  defaultTitle?: string;
  defaultSummary?: string;
  metadata?: Record<string, any>;
}

export interface ContentHealthReport {
  total: number;
  published: number;
  placeholder: number;
  missing: number;
  stale: number;
  by_page?: Record<
    string,
    {
      total: number;
      published: number;
      placeholder: number;
      missing: number;
      stale: number;
    }
  >;
  details: {
    content_key: string;
    page: string;
    status: ContentStatus;
    content_type: ContentType;
    required: boolean;
  }[];
}

/**
 * Humanizes the last dot segment of a content key.
 * e.g., 'learn.guide.ai-workflows' -> 'AI Workflows'
 */
export function humanizeKey(key: string): string {
  const segment = key.split('.').pop() || key;
  return segment
    .split('-')
    .map((word) => {
      if (word.toLowerCase() === 'ai') return 'AI';
      if (word.toLowerCase() === 'cta') return 'CTA';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * CoreIQ Create Content Manifest.
 * Covers /learn, /home, /solutions, /apps, /tools, and /about.
 */
export const CONTENT_MANIFEST: ContentManifestEntry[] = [
  // 1. Hero text & CTAs
  {
    page: '/learn',
    content_key: 'learn.hero.title',
    content_type: 'text',
    required: true,
    defaultTitle: 'Learn what matters. Build what works.',
    defaultSummary: 'Hero primary headline for CoreIQ Learn.',
  },
  {
    page: '/learn',
    content_key: 'learn.hero.description',
    content_type: 'text',
    required: true,
    defaultTitle: 'Learn Hero Description',
    defaultSummary: 'Practical AI education for people who want to build real things.',
  },
  {
    page: '/learn',
    content_key: 'learn.hero.cta.browse',
    content_type: 'text',
    required: false,
    defaultTitle: 'Browse all',
    defaultSummary: 'Show me all available Core IQ learning guides',
  },
  {
    page: '/learn',
    content_key: 'learn.hero.cta.basics',
    content_type: 'text',
    required: false,
    defaultTitle: 'Start with basics',
    defaultSummary: 'I want to learn the basics of AI and agents',
  },
  {
    page: '/learn',
    content_key: 'learn.hero.cta.workflows',
    content_type: 'text',
    required: false,
    defaultTitle: 'Explore workflows',
    defaultSummary: 'How to build production AI workflows',
  },

  // 2. Featured Article
  {
    page: '/learn',
    content_key: 'learn.featured.article',
    content_type: 'article',
    required: true,
    slug: 'featured-ai-workflow',
    defaultTitle: 'How to turn an AI idea into a useful workflow.',
    defaultSummary: 'A practical walkthrough of breaking down a business problem, choosing the right AI approach, and building a working automation.',
  },

  // 3. Topics (Stream streams)
  {
    page: '/learn',
    content_key: 'learn.topic.ai-foundations',
    content_type: 'topic',
    required: true,
    category: 'AI Fundamentals',
    defaultTitle: 'AI Foundations',
    defaultSummary: 'Core principles of modern artificial intelligence and frontier models.',
  },
  {
    page: '/learn',
    content_key: 'learn.topic.prompt-engineering',
    content_type: 'topic',
    required: true,
    category: 'AI Fundamentals',
    defaultTitle: 'Prompt Engineering',
    defaultSummary: 'System prompt design, few-shot prompting, and structured output patterns.',
  },
  {
    page: '/learn',
    content_key: 'learn.topic.automation',
    content_type: 'topic',
    required: true,
    category: 'Automation',
    defaultTitle: 'Business Automation',
    defaultSummary: 'End-to-end automation pipelines, webhook triggers, and autonomous task queues.',
  },
  {
    page: '/learn',
    content_key: 'learn.topic.agents',
    content_type: 'topic',
    required: true,
    category: 'Agents',
    defaultTitle: 'Autonomous Agents',
    defaultSummary: 'Agentic reasoning loops, tool-use execution, and multi-agent swarm dynamics.',
  },
  {
    page: '/learn',
    content_key: 'learn.topic.tools',
    content_type: 'topic',
    required: true,
    category: 'Tools & Workflows',
    defaultTitle: 'Developer & AI Tools',
    defaultSummary: 'Model context protocols, vector datastores, and tool orchestration kits.',
  },
  {
    page: '/learn',
    content_key: 'learn.topic.workflows',
    content_type: 'topic',
    required: true,
    category: 'Development',
    defaultTitle: 'Production Workflows',
    defaultSummary: 'Human-in-the-loop validation, error recovery, and enterprise deployments.',
  },

  // 4. Learning Pathways
  {
    page: '/learn',
    content_key: 'learn.path.beginner',
    content_type: 'learning_path',
    required: true,
    defaultTitle: 'Foundations: Start Here',
    defaultSummary: 'New to AI? Begin with the fundamentals and work toward your first automation.',
  },
  {
    page: '/learn',
    content_key: 'learn.path.builder',
    content_type: 'learning_path',
    required: true,
    defaultTitle: 'Advanced Systems: Build With AI',
    defaultSummary: 'Already know the basics? Go deeper into agents, workflows and real systems.',
  },

  // 5. Curated Guides (wired to individual articles)
  {
    page: '/learn',
    content_key: 'learn.guide.ai-workflows',
    content_type: 'guide',
    required: true,
    slug: 'ai-workflows',
    category: 'Development',
    defaultTitle: 'AI Workflows & Orchestration',
    defaultSummary: 'Connect your tools, eliminate manual tasks, and build reliable automation pipelines with error recovery.',
    metadata: { level: 'Intermediate', readTime: '20 min read', iconName: 'Zap' },
  },
  {
    page: '/learn',
    content_key: 'learn.guide.prompt-engineering',
    content_type: 'guide',
    required: true,
    slug: 'prompt-engineering',
    category: 'AI Fundamentals',
    defaultTitle: 'The Prompt Engineering Handbook',
    defaultSummary: 'Techniques, frameworks and best practices for getting precise, high-quality results from any model.',
    metadata: { level: 'All Levels', readTime: '30 min read', iconName: 'MessageSquare' },
  },
  {
    page: '/learn',
    content_key: 'learn.guide.automation',
    content_type: 'guide',
    required: true,
    slug: 'automation',
    category: 'Automation',
    defaultTitle: 'Mastering Workflow Automation',
    defaultSummary: 'Practical patterns for webhook chaining, data synthesis, and resilient asynchronous job processing.',
    metadata: { level: 'Intermediate', readTime: '25 min read', iconName: 'Zap' },
  },
  {
    page: '/learn',
    content_key: 'learn.guide.agents',
    content_type: 'guide',
    required: true,
    slug: 'agents',
    category: 'Agents',
    defaultTitle: 'Understanding AI Agents',
    defaultSummary: 'How autonomous agents work, when to use them, and how they collaborate in swarms with tool rights.',
    metadata: { level: 'Beginner', readTime: '15 min read', iconName: 'Network' },
  },
  {
    page: '/learn',
    content_key: 'learn.guide.ai-tools',
    content_type: 'guide',
    required: true,
    slug: 'ai-tools',
    category: 'Tools & Workflows',
    defaultTitle: 'Building with Core IQ Tools',
    defaultSummary: 'A practical walkthrough of every tool in the Core IQ ecosystem and how to combine them into workflows.',
    metadata: { level: 'Beginner', readTime: '10 min read', iconName: 'Wrench' },
  },
  {
    page: '/learn',
    content_key: 'learn.guide.workflows',
    content_type: 'guide',
    required: true,
    slug: 'workflows',
    category: 'Development',
    defaultTitle: 'Data & Intelligence Architecture',
    defaultSummary: 'How to structure, store and query data for intelligent systems that scale reliably in production.',
    metadata: { level: 'Advanced', readTime: '35 min read', iconName: 'Box' },
  },

  // ==========================================
  // HOME PAGE (/home)
  // ==========================================
  {
    page: '/home',
    content_key: 'home.hero.title',
    content_type: 'text',
    required: true,
    defaultTitle: 'Autonomous AI Systems & Intelligent Creation',
    defaultSummary: 'Primary hero headline for the Core IQ home experience.',
  },
  {
    page: '/home',
    content_key: 'home.hero.subtitle',
    content_type: 'text',
    required: true,
    defaultTitle: 'Home Hero Subtitle',
    defaultSummary: 'CoreIQ designs, automates, and orchestrates custom AI agents, voice assistants, and digital infrastructure.',
  },
  {
    page: '/home',
    content_key: 'home.capability.agents',
    content_type: 'text',
    required: false,
    defaultTitle: 'AI Agents',
    defaultSummary: 'Autonomous digital agents tailored to enterprise tasks.',
  },
  {
    page: '/home',
    content_key: 'home.capability.integrations',
    content_type: 'text',
    required: false,
    defaultTitle: 'Integrations',
    defaultSummary: 'Unified connection layer bridging models, APIs, and business data.',
  },
  {
    page: '/home',
    content_key: 'home.capability.automation',
    content_type: 'text',
    required: false,
    defaultTitle: 'Automation',
    defaultSummary: 'Resilient multi-step asynchronous workflow automation.',
  },
  {
    page: '/home',
    content_key: 'home.capability.apps-websites',
    content_type: 'text',
    required: false,
    defaultTitle: 'Apps & Websites',
    defaultSummary: 'High-performance interactive web applications and software.',
  },
  {
    page: '/home',
    content_key: 'home.capability.learn',
    content_type: 'text',
    required: false,
    defaultTitle: 'AI Education',
    defaultSummary: 'Guides and systems thinking for intelligent system builders.',
  },
  {
    page: '/home',
    content_key: 'home.explore.agents',
    content_type: 'resource',
    required: false,
    defaultTitle: 'Explore Agents',
    defaultSummary: 'Autonomous execution agents with tool calling and persistent memory.',
  },
  {
    page: '/home',
    content_key: 'home.explore.automation',
    content_type: 'resource',
    required: false,
    defaultTitle: 'Explore Automation',
    defaultSummary: 'Automated event triggers, webhook orchestration, and pipeline processing.',
  },
  {
    page: '/home',
    content_key: 'home.explore.apps',
    content_type: 'resource',
    required: false,
    defaultTitle: 'Explore Apps',
    defaultSummary: 'Purpose-built AI tools and productivity applications.',
  },
  {
    page: '/home',
    content_key: 'home.explore.websites',
    content_type: 'resource',
    required: false,
    defaultTitle: 'Explore Websites',
    defaultSummary: 'Futuristic responsive web systems with generative AI interfaces.',
  },
  {
    page: '/home',
    content_key: 'home.explore.integrations',
    content_type: 'resource',
    required: false,
    defaultTitle: 'Explore Integrations',
    defaultSummary: 'Deep API and database connectors for seamless enterprise interoperability.',
  },

  // ==========================================
  // SOLUTIONS PAGE (/solutions)
  // ==========================================
  {
    page: '/solutions',
    content_key: 'solutions.hero.title',
    content_type: 'text',
    required: true,
    defaultTitle: 'Solutions Architecture',
    defaultSummary: 'Comprehensive AI solutions tailored to modern operational challenges.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.hero.subtitle',
    content_type: 'text',
    required: true,
    defaultTitle: 'Solutions Hero Subtitle',
    defaultSummary: 'From discrete task automation to autonomous swarms, explore our technical capabilities.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.item.ai-agents',
    content_type: 'topic',
    required: false,
    defaultTitle: 'AI Agents',
    defaultSummary: 'Autonomous agents designed to research, draft, execute, and collaborate.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.item.automation',
    content_type: 'topic',
    required: false,
    defaultTitle: 'Workflow Automation',
    defaultSummary: 'Eliminate repetitive manual tasks through deterministic and generative automation.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.item.apps',
    content_type: 'topic',
    required: false,
    defaultTitle: 'Custom AI Apps',
    defaultSummary: 'Dedicated applications infused with model intelligence and real-time processing.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.item.websites',
    content_type: 'topic',
    required: false,
    defaultTitle: 'Intelligent Websites',
    defaultSummary: 'Web experiences with conversational and generative interfaces.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.item.voice-ai',
    content_type: 'topic',
    required: false,
    defaultTitle: 'Voice AI Systems',
    defaultSummary: 'Ultra-low latency conversational voice agents for customer care and inbound support.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.item.integrations',
    content_type: 'topic',
    required: false,
    defaultTitle: 'System Integrations',
    defaultSummary: 'Bridge disparate CRM, ERP, and internal databases with intelligent routing.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.capability.agents',
    content_type: 'text',
    required: false,
    defaultTitle: 'Agents Capability',
    defaultSummary: 'Multi-agent orchestration and autonomous tool invocation.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.capability.automation',
    content_type: 'text',
    required: false,
    defaultTitle: 'Automation Capability',
    defaultSummary: 'Event-driven logic chains and asynchronous batch operations.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.capability.apps',
    content_type: 'text',
    required: false,
    defaultTitle: 'Apps Capability',
    defaultSummary: 'Full-stack application architecture and reactive state systems.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.capability.voice',
    content_type: 'text',
    required: false,
    defaultTitle: 'Voice Capability',
    defaultSummary: 'Real-time WebSocket audio streaming, TTS, and neural voice synthesis.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.capability.customer',
    content_type: 'text',
    required: false,
    defaultTitle: 'Customer AI Capability',
    defaultSummary: 'Context-aware customer support agents with retrieval-augmented generation.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.capability.integrations',
    content_type: 'text',
    required: false,
    defaultTitle: 'Integrations Capability',
    defaultSummary: 'Model Context Protocol (MCP) servers and third-party webhook gateways.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.process.idea',
    content_type: 'text',
    required: false,
    defaultTitle: 'Idea',
    defaultSummary: 'Clarifying the vision and defining high-impact outcome metrics.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.process.discovery',
    content_type: 'text',
    required: false,
    defaultTitle: 'Discovery',
    defaultSummary: 'Mapping system architecture, data dependencies, and security requirements.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.process.design',
    content_type: 'text',
    required: false,
    defaultTitle: 'Design',
    defaultSummary: 'Crafting user flows, agent prompts, and high-fidelity interface prototypes.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.process.build',
    content_type: 'text',
    required: false,
    defaultTitle: 'Build',
    defaultSummary: 'Developing resilient full-stack code and establishing test suites.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.process.integrate',
    content_type: 'text',
    required: false,
    defaultTitle: 'Integrate',
    defaultSummary: 'Connecting production APIs, webhooks, and telemetry logging.',
  },
  {
    page: '/solutions',
    content_key: 'solutions.process.optimize',
    content_type: 'text',
    required: false,
    defaultTitle: 'Optimize',
    defaultSummary: 'Continuous monitoring, latency tuning, and model cost reduction.',
  },

  // ==========================================
  // APPS PAGE (/apps)
  // ==========================================
  {
    page: '/apps',
    content_key: 'apps.hero.title',
    content_type: 'text',
    required: true,
    defaultTitle: 'CoreIQ App Ecosystem',
    defaultSummary: 'A curated collection of purpose-built intelligent creative applications.',
  },
  {
    page: '/apps',
    content_key: 'apps.hero.subtitle',
    content_type: 'text',
    required: true,
    defaultTitle: 'Apps Hero Subtitle',
    defaultSummary: 'Explore specialized software for imaging, copywriting, synthesis, and workflow mapping.',
  },
  {
    page: '/apps',
    content_key: 'apps.item.imageforge',
    content_type: 'resource',
    required: false,
    defaultTitle: 'ImageForge',
    defaultSummary: 'Generative image studio with prompt refinement and aspect ratio controls.',
  },
  {
    page: '/apps',
    content_key: 'apps.item.writepro',
    content_type: 'resource',
    required: false,
    defaultTitle: 'WritePro',
    defaultSummary: 'Long-form editorial assistant with voice consistency and outline generation.',
  },
  {
    page: '/apps',
    content_key: 'apps.item.datamind',
    content_type: 'resource',
    required: false,
    defaultTitle: 'DataMind',
    defaultSummary: 'Natural language database querying and structured dataset transformation.',
  },
  {
    page: '/apps',
    content_key: 'apps.item.flowbuilder',
    content_type: 'resource',
    required: false,
    defaultTitle: 'FlowBuilder',
    defaultSummary: 'Visual canvas for composing multi-step automated execution graphs.',
  },
  {
    page: '/apps',
    content_key: 'apps.item.webcraft',
    content_type: 'resource',
    required: false,
    defaultTitle: 'WebCraft',
    defaultSummary: 'Rapid UI prototyping tool transforming wireframes into production components.',
  },
  {
    page: '/apps',
    content_key: 'apps.item.voicestudio',
    content_type: 'resource',
    required: false,
    defaultTitle: 'VoiceStudio',
    defaultSummary: 'Synthesizer and conversational tester for neural voice agent configurations.',
  },
  {
    page: '/apps',
    content_key: 'apps.item.customerai',
    content_type: 'resource',
    required: false,
    defaultTitle: 'CustomerAI',
    defaultSummary: 'Knowledge-grounded agent for automated multi-channel support.',
  },
  {
    page: '/apps',
    content_key: 'apps.item.appbuilder',
    content_type: 'resource',
    required: false,
    defaultTitle: 'AppBuilder',
    defaultSummary: 'Scaffolding environment for generating micro-applications with custom logic.',
  },
  {
    page: '/apps',
    content_key: 'apps.item.researchpro',
    content_type: 'resource',
    required: false,
    defaultTitle: 'ResearchPro',
    defaultSummary: 'Deep web and document synthesizer generating comprehensive whitepapers.',
  },
  {
    page: '/apps',
    content_key: 'apps.item.marketingai',
    content_type: 'resource',
    required: false,
    defaultTitle: 'MarketingAI',
    defaultSummary: 'Campaign strategist generating copy variants, hooks, and content schedules.',
  },
  {
    page: '/apps',
    content_key: 'apps.tier.try',
    content_type: 'text',
    required: false,
    defaultTitle: 'Try Tier',
    defaultSummary: 'Explore interactive demos directly in your browser with zero setup.',
  },
  {
    page: '/apps',
    content_key: 'apps.tier.upgrade',
    content_type: 'text',
    required: false,
    defaultTitle: 'Upgrade Tier',
    defaultSummary: 'Unlock dedicated compute, custom keys, and extended context windows.',
  },
  {
    page: '/apps',
    content_key: 'apps.tier.customize',
    content_type: 'text',
    required: false,
    defaultTitle: 'Customize Tier',
    defaultSummary: 'Tailor model prompts, add proprietary MCP tools, and white-label branding.',
  },

  // ==========================================
  // TOOLS PAGE (/tools)
  // ==========================================
  {
    page: '/tools',
    content_key: 'tools.hero.title',
    content_type: 'text',
    required: true,
    defaultTitle: 'Interactive Utilities',
    defaultSummary: 'Focused, client-side intelligence tools for rapid execution.',
  },
  {
    page: '/tools',
    content_key: 'tools.hero.subtitle',
    content_type: 'text',
    required: true,
    defaultTitle: 'Tools Hero Subtitle',
    defaultSummary: 'Zero latency micro-utilities designed to accelerate your day-to-day workflow.',
  },
  {
    page: '/tools',
    content_key: 'tools.item.prompt-enhancer',
    content_type: 'resource',
    required: false,
    defaultTitle: 'Prompt Enhancer',
    defaultSummary: 'Refine raw prompts into structured, high-performing instructions.',
  },
  {
    page: '/tools',
    content_key: 'tools.item.headline-generator',
    content_type: 'resource',
    required: false,
    defaultTitle: 'Headline Generator',
    defaultSummary: 'Generate captivating marketing headlines and value statements.',
  },
  {
    page: '/tools',
    content_key: 'tools.item.image-prompt-builder',
    content_type: 'resource',
    required: false,
    defaultTitle: 'Image Prompt Builder',
    defaultSummary: 'Construct rich photographic and cinematic prompts with stylistic parameters.',
  },
  {
    page: '/tools',
    content_key: 'tools.item.code-explainer',
    content_type: 'resource',
    required: false,
    defaultTitle: 'Code Explainer',
    defaultSummary: 'Deconstruct complex codebases and syntax into plain-English explanations.',
  },
  {
    page: '/tools',
    content_key: 'tools.item.data-formatter',
    content_type: 'resource',
    required: false,
    defaultTitle: 'Data Formatter',
    defaultSummary: 'Convert messy unstructured data into pristine JSON, CSV, or markdown tables.',
  },
  {
    page: '/tools',
    content_key: 'tools.item.regex-builder',
    content_type: 'resource',
    required: false,
    defaultTitle: 'Regex Builder',
    defaultSummary: 'Generate and explain regular expressions using natural language descriptions.',
  },
  {
    page: '/tools',
    content_key: 'tools.item.meeting-summarizer',
    content_type: 'resource',
    required: false,
    defaultTitle: 'Meeting Summarizer',
    defaultSummary: 'Extract key decisions, action items, and timelines from meeting transcripts.',
  },
  {
    page: '/tools',
    content_key: 'tools.item.workflow-mapper',
    content_type: 'resource',
    required: false,
    defaultTitle: 'Workflow Mapper',
    defaultSummary: 'Turn step-by-step descriptions into clean interactive pipeline diagrams.',
  },
  {
    page: '/tools',
    content_key: 'tools.philosophy.speed',
    content_type: 'text',
    required: false,
    defaultTitle: 'Instant Speed',
    defaultSummary: 'Tools load immediately with instantaneous feedback and zero clutter.',
  },
  {
    page: '/tools',
    content_key: 'tools.philosophy.focus',
    content_type: 'text',
    required: false,
    defaultTitle: 'Singular Focus',
    defaultSummary: 'Each utility performs one task exceptionally well without distraction.',
  },
  {
    page: '/tools',
    content_key: 'tools.philosophy.composability',
    content_type: 'text',
    required: false,
    defaultTitle: 'Composability',
    defaultSummary: 'Output from any tool is easily piped into other systems or workflows.',
  },

  // ==========================================
  // ABOUT PAGE (/about)
  // ==========================================
  {
    page: '/about',
    content_key: 'about.hero.title',
    content_type: 'text',
    required: true,
    defaultTitle: 'About CoreIQ',
    defaultSummary: 'The philosophy and architecture powering autonomous creation.',
  },
  {
    page: '/about',
    content_key: 'about.hero.subtitle',
    content_type: 'text',
    required: true,
    defaultTitle: 'About Hero Subtitle',
    defaultSummary: 'We build sovereign AI infrastructure that connects ideas, intelligence, and action.',
  },
  {
    page: '/about',
    content_key: 'about.pillar.ideas',
    content_type: 'text',
    required: false,
    defaultTitle: 'Ideas',
    defaultSummary: 'Clarifying intent and structuring conceptual breakthroughs into buildable roadmaps.',
  },
  {
    page: '/about',
    content_key: 'about.pillar.intelligence',
    content_type: 'text',
    required: false,
    defaultTitle: 'Intelligence',
    defaultSummary: 'Applying state-of-the-art models and deterministic logic to solve complex problems.',
  },
  {
    page: '/about',
    content_key: 'about.pillar.action',
    content_type: 'text',
    required: false,
    defaultTitle: 'Action',
    defaultSummary: 'Transforming thought into tangible tools, agents, workflows, and websites.',
  },
  {
    page: '/about',
    content_key: 'about.belief.useful',
    content_type: 'text',
    required: false,
    defaultTitle: 'Useful Systems',
    defaultSummary: 'AI should solve real bottlenecks rather than serve as decorative spectacle.',
  },
  {
    page: '/about',
    content_key: 'about.belief.friction',
    content_type: 'text',
    required: false,
    defaultTitle: 'Frictionless Creation',
    defaultSummary: 'Removing intermediate barriers between human imagination and digital realization.',
  },
  {
    page: '/about',
    content_key: 'about.belief.understandable',
    content_type: 'text',
    required: false,
    defaultTitle: 'Understandable Architecture',
    defaultSummary: 'Systems should remain inspectable, predictable, and transparent to their operators.',
  },
  {
    page: '/about',
    content_key: 'about.belief.time',
    content_type: 'text',
    required: false,
    defaultTitle: 'Time Sovereignty',
    defaultSummary: 'Automating the mundane gives creators the freedom to focus on high-order creativity.',
  },
  {
    page: '/about',
    content_key: 'about.principle.start-with-problem',
    content_type: 'text',
    required: false,
    defaultTitle: 'Start With The Problem',
    defaultSummary: 'Never build tech looking for a use case; anchor in acute human friction.',
  },
  {
    page: '/about',
    content_key: 'about.principle.smallest-system',
    content_type: 'text',
    required: false,
    defaultTitle: 'Smallest Working System',
    defaultSummary: 'Deliver working utility first, then scale complexity incrementally.',
  },
  {
    page: '/about',
    content_key: 'about.principle.connect-workflow',
    content_type: 'text',
    required: false,
    defaultTitle: 'Connect To The Workflow',
    defaultSummary: 'Integrate directly where people already work, communicate, and create.',
  },
  {
    page: '/about',
    content_key: 'about.principle.test-reality',
    content_type: 'text',
    required: false,
    defaultTitle: 'Test Against Reality',
    defaultSummary: 'Validate against production data, edge cases, and human behavior.',
  },
  {
    page: '/about',
    content_key: 'about.principle.improve-continuously',
    content_type: 'text',
    required: false,
    defaultTitle: 'Improve Continuously',
    defaultSummary: 'Treat systems as living organisms that adapt with feedback loops and performance telemetry.',
  },
];

/**
 * Returns all manifest entries for a given page route.
 */
export function getManifestForPage(page: string): ContentManifestEntry[] {
  return CONTENT_MANIFEST.filter((entry) => entry.page === page);
}

/**
 * Looks up a single manifest entry by content_key.
 */
export function getManifestEntry(contentKey: string): ContentManifestEntry | undefined {
  return CONTENT_MANIFEST.find((entry) => entry.content_key === contentKey);
}

/**
 * Looks up a manifest entry by slug or guide key.
 */
export function getManifestEntryBySlug(slug: string): ContentManifestEntry | undefined {
  return CONTENT_MANIFEST.find((entry) => entry.slug === slug || entry.content_key === `learn.guide.${slug}`);
}

/**
 * Evaluates health of content rows against the manifest.
 */
export function evaluateContentHealth(
  existingItems: { content_key?: string; key?: string; status?: string }[]
): ContentHealthReport {
  let published = 0;
  let placeholder = 0;
  let missing = 0;
  let stale = 0;

  const itemMap = new Map<string, { status?: string }>();
  for (const item of existingItems) {
    if (item.content_key) itemMap.set(item.content_key, item);
    if (item.key) itemMap.set(item.key, item);
  }

  const by_page: Record<
    string,
    { total: number; published: number; placeholder: number; missing: number; stale: number }
  > = {};

  const details = CONTENT_MANIFEST.map((entry) => {
    if (!by_page[entry.page]) {
      by_page[entry.page] = { total: 0, published: 0, placeholder: 0, missing: 0, stale: 0 };
    }
    by_page[entry.page].total++;

    const found = itemMap.get(entry.content_key);
    let resolvedStatus: ContentStatus = 'MISSING';

    if (!found) {
      missing++;
      by_page[entry.page].missing++;
      resolvedStatus = 'MISSING';
    } else {
      const rawStatus = (found.status || '').toUpperCase();
      if (rawStatus === 'PUBLISHED') {
        published++;
        by_page[entry.page].published++;
        resolvedStatus = 'PUBLISHED';
      } else if (rawStatus === 'STALE') {
        stale++;
        by_page[entry.page].stale++;
        resolvedStatus = 'STALE';
      } else {
        placeholder++;
        by_page[entry.page].placeholder++;
        resolvedStatus = (rawStatus as ContentStatus) || 'PLACEHOLDER';
      }
    }

    return {
      content_key: entry.content_key,
      page: entry.page,
      status: resolvedStatus,
      content_type: entry.content_type,
      required: entry.required,
    };
  });

  return {
    total: CONTENT_MANIFEST.length,
    published,
    placeholder,
    missing,
    stale,
    by_page,
    details,
  };
}
