export interface ProblemItem {
  id: string;
  title: string;
  issue: string;
  solution: string;
  example: string;
  capabilities: string[];
  ctaPrompt: string;
}

export interface ServiceItem {
  id: string;
  number: string;
  overline: string;
  title: string;
  summary: string;
  description: string;
  examples: string[];
  outcomes: string[];
  workflow: string;
  ctaLabel: string;
  ctaPrompt: string;
}

export interface BlueprintStep {
  step: string;
  title: string;
  detail: string;
}

export interface BlueprintItem {
  id: string;
  title: string;
  description: string;
  badge: string;
  steps: BlueprintStep[];
}

export interface DeliveryStage {
  number: string;
  name: string;
  description: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  published: boolean;
}

export interface ServicesPageContent {
  seo: {
    title: string;
    description: string;
    canonicalUrl: string;
  };
  hero: {
    overline: string;
    h1: string;
    supportingCopy: string;
    geoLine: string;
    primaryCta: string;
    primaryCtaPrompt: string;
    secondaryCta: string;
  };
  capabilityTicker: {
    enabled: boolean;
    items: string[];
  };
  problemDiscovery: {
    heading: string;
    subheading: string;
    problems: ProblemItem[];
  };
  services: ServiceItem[];
  blueprints: {
    heading: string;
    subheading: string;
    items: BlueprintItem[];
  };
  delivery: {
    heading: string;
    subheading: string;
    stages: DeliveryStage[];
  };
  faqs: {
    heading: string;
    subheading: string;
    items: FaqItem[];
  };
  closing: {
    headline: string;
    supporting: string;
    primaryCta: string;
    primaryCtaPrompt: string;
    secondaryCta: string;
    secondaryCtaPrompt: string;
  };
}

export const DEFAULT_SERVICES_CONTENT: ServicesPageContent = {
  seo: {
    title: 'AI Automation Services South Africa | AI Agents & Custom Solutions | CoreIQ Create',
    description:
      'CoreIQ builds AI agents, workflow automation, WhatsApp chatbots, voice AI and custom apps for businesses in South Africa, across Africa and worldwide.',
    canonicalUrl: '/services',
  },
  hero: {
    overline: 'INTELLIGENT SYSTEMS / COREIQ CREATE',
    h1: 'AI automation and intelligent systems built around your business.',
    supportingCopy:
      'From intelligent AI agents and automated workflows to custom applications, voice systems and connected business platforms, CoreIQ turns complex business requirements into working digital solutions.',
    geoLine: 'SOUTH AFRICA · AFRICA · WORLDWIDE',
    primaryCta: 'Build My Solution',
    primaryCtaPrompt:
      'I would like to explore custom AI automation and intelligent systems for my business. Can you guide me through the possibilities?',
    secondaryCta: 'Explore Our Capabilities',
  },
  capabilityTicker: {
    enabled: true,
    items: [
      'AI AGENTS',
      'WORKFLOW AUTOMATION',
      'WHATSAPP AI',
      'VOICE AI',
      'CUSTOM APPLICATIONS',
      'SYSTEM INTEGRATIONS',
    ],
  },
  problemDiscovery: {
    heading: 'What needs to work better?',
    subheading:
      'Start with the bottleneck or friction in your business. Select a challenge to see the underlying root cause, recommended CoreIQ architecture, and practical system solution.',
    problems: [
      {
        id: 'problem-leads',
        title: 'We lose potential customers when nobody is available.',
        issue:
          'Inquiries arrive after hours, over weekends, and during busy peaks when staff cannot respond immediately. Delayed replies cause high-intent prospects to turn to competitors.',
        solution:
          'An autonomous customer AI agent integrated with WhatsApp Business, real-time qualification, and direct CRM sync.',
        example:
          'When a prospect inquires at 10 PM, an AI assistant responds within 15 seconds, answers pricing and capability questions, qualifies requirements, and books a call directly into the team calendar.',
        capabilities: ['AI Agents', 'WhatsApp Business Automation', 'CRM Integration'],
        ctaPrompt:
          'I need an AI system to capture and qualify leads when our team is away or after hours.',
      },
      {
        id: 'problem-manual',
        title: 'Too much of our work is repetitive and manual.',
        issue:
          'Teams spend dozens of hours re-keying data between spreadsheets, invoicing tools, communication channels, and back-office databases.',
        solution:
          'Multi-step workflow automation connecting email, PDF document processing, database sync, and notifications.',
        example:
          'Incoming supplier invoices are automatically parsed, verified against purchase orders, approved through rule-based logic, and logged directly into accounting.',
        capabilities: ['Workflow Automation', 'Document Processing', 'System Integration'],
        ctaPrompt:
          'We want to automate repetitive manual data entry and document handling across our business.',
      },
      {
        id: 'problem-support',
        title: 'Our customer support takes too much time.',
        issue:
          'Frontline support staff are overwhelmed answering the exact same 20 repetitive questions all day, delaying responses for high-value technical tickets.',
        solution:
          'A grounded AI support assistant trained on your knowledge base, FAQs, policies, and ticketing history.',
        example:
          'Resolves 75%+ of recurring queries instantly across web and chat with accurate, citation-backed answers, while seamlessly escalating complex cases to human specialists.',
        capabilities: ['Customer AI & Chatbots', 'Knowledge Retrieval', 'Human Handover'],
        ctaPrompt:
          'We want an AI customer support assistant to handle repetitive tickets and free up our support team.',
      },
      {
        id: 'problem-silos',
        title: "Our business tools don't communicate properly.",
        issue:
          'Customer records live in one app, billing in another, inventory in a third, and team conversations in chat apps, creating blind spots and manual synchronization.',
        solution:
          'Unified API connectors, event-driven webhooks, and centralized business intelligence pipelines.',
        example:
          'A new deal closed in your CRM automatically provisions client portals, notifies the operations team on Slack or WhatsApp, and prepares invoicing ledgers.',
        capabilities: ['API Integrations', 'Data Pipelines', 'Business Intelligence'],
        ctaPrompt:
          'Our software tools are disconnected. We need custom integrations and automated sync between them.',
      },
      {
        id: 'problem-platform',
        title: 'We need an application or digital platform.',
        issue:
          "Off-the-shelf software doesn't match your unique operational model, and hiring large dev agencies takes months with excessive overhead.",
        solution:
          'Bespoke full-stack web applications, customer portals, internal operational command hubs, and mobile-ready tools.',
        example:
          'A custom contractor portal with offline mobile work orders, client digital sign-offs, automated PDF quoting, and live dispatch tracking.',
        capabilities: ['Custom Web Apps', 'Client Portals', 'Internal Dashboards'],
        ctaPrompt:
          'We need a custom web application or digital platform built specifically around our workflow.',
      },
      {
        id: 'problem-insights',
        title: 'We need better access to our business information.',
        issue:
          'Critical operational decisions are delayed because data is scattered across files, proprietary systems, and unorganized archives.',
        solution:
          'Executive intelligence dashboards, vector-grounded document search, and real-time operational reporting.',
        example:
          'Management can ask natural language questions ("What was our gross margin across product lines last month?") and receive instant charts and data summaries.',
        capabilities: ['Business Intelligence', 'Knowledge Retrieval', 'Automated Reporting'],
        ctaPrompt:
          'We want an AI-powered intelligence system and unified reporting dashboard for our business data.',
      },
    ],
  },
  services: [
    {
      id: 'service-ai-agents',
      number: '01',
      overline: 'AUTONOMOUS INTELLIGENCE',
      title: 'AI Agents & Business Assistants',
      summary:
        'Custom AI agents that perform real work across your business operations — not just answering questions, but using tools, following rules, and executing multi-step tasks.',
      description:
        'Unlike simple chatbots that generate text, CoreIQ AI agents are purpose-built digital workers. They connect directly to your databases, APIs, documents, and messaging platforms to autonomously research, qualify, triage, calculate, and take action within explicit business guardrails.',
      examples: [
        'Customer Service Agents',
        'Sales & Lead Qualification Agents',
        'Research & Synthesis Agents',
        'Administrative & Scheduling Agents',
        'Operations & Triage Agents',
        'Knowledge & Policy Assistants',
        'Custom Business Role Agents',
      ],
      outcomes: [
        '24/7 autonomous task execution without human fatigue',
        'Immediate response times across all customer channels',
        'Consistent application of your company standard operating procedures',
        'Scalable throughput during peak business demand',
      ],
      workflow: 'Inquiry / Trigger → Policy & Knowledge Grounding → Decision Logic → Tool / Action Execution → Verified Confirmation',
      ctaLabel: 'Deploy an AI Agent',
      ctaPrompt:
        'I am interested in deploying custom AI agents for our business operations. Can we discuss our requirements?',
    },
    {
      id: 'service-workflow-automation',
      number: '02',
      overline: 'PROCESS ENGINEERING',
      title: 'Workflow & Business Process Automation',
      summary:
        'Connect repetitive business processes into reliable, intelligent automated workflows that reduce manual labor and eliminate human error.',
      description:
        'Every business runs on repeatable sequences: handling leads, sending invoices, routing approvals, notifying stakeholders, and moving information between software tools. CoreIQ designs automated end-to-end pipelines that execute these tasks reliably in seconds instead of hours.',
      examples: [
        'Automated Lead Routing & CRM Sync',
        'Email & Document Processing Pipelines',
        'Billing, Invoicing & Reconciliation',
        'Multi-Level Approval Workflows',
        'Client Onboarding Sequences',
        'Automated Scheduled Reminders & Alerts',
        'Cross-Platform Data Synchronization',
      ],
      outcomes: [
        'Up to 80% reduction in repetitive manual administration',
        'Zero lost leads or missed follow-up deadlines',
        'Error-free document and financial record creation',
        'Freed-up staff focus for high-value strategic growth',
      ],
      workflow: 'Event Trigger → Data Extraction & Normalization → Business Rules & Approvals → Target Systems Update → Audit Log',
      ctaLabel: 'Automate My Workflows',
      ctaPrompt:
        'I want to automate repetitive workflows and business processes in my company. What are the best options?',
    },
    {
      id: 'service-customer-ai-whatsapp',
      number: '03',
      overline: 'CONVERSATIONAL SYSTEMS',
      title: 'Customer AI, Chatbots & WhatsApp Automation',
      summary:
        'Intelligent conversational systems that engage prospects and support customers where they already communicate — on your website, WhatsApp Business, and messaging apps.',
      description:
        'In South Africa and across international markets, WhatsApp and instant messaging are the primary lifelines for business communication. CoreIQ builds natural, intelligent messaging flows that answer questions, showcase products, capture and qualify leads, schedule bookings, and seamlessly escalate to human agents when required.',
      examples: [
        'WhatsApp Business Official API Automation',
        'Interactive Website AI Copilots',
        'Lead Intake & Automated Qualification',
        '24/7 Customer Support & FAQ Resolution',
        'Booking & Appointment Confirmation Flows',
        'Order Status & Tracking Notifications',
        'Human-in-the-Loop Agent Escalation',
      ],
      outcomes: [
        'Sub-30-second first-response time 24 hours a day',
        'Seamless customer experience on South Africa’s most popular channel',
        'Automated pre-qualification so sales reps talk to hot leads only',
        'Full compliance with business messaging policies and data protection',
      ],
      workflow: 'Customer Message → Intent & Language Detection → Business Logic & Knowledge Base → Instant Resolution or CRM Escalation',
      ctaLabel: 'Launch WhatsApp & Chat AI',
      ctaPrompt:
        'I want to build a WhatsApp Business automation and customer AI chatbot for our company.',
    },
    {
      id: 'service-voice-ai',
      number: '04',
      overline: 'SPOKEN INTELLIGENCE',
      title: 'Voice AI & Intelligent Call Systems',
      summary:
        'Ultra-low-latency conversational voice agents that answer telephone calls, schedule appointments, qualify callers, and route emergencies 24/7.',
      description:
        'Voice AI is no longer a robotic IVR menu. CoreIQ builds warm, natural conversational voice assistants with human-like cadence, realistic accents, and deep context awareness. They can conduct end-to-end phone consultations, capture customer requirements, book calendar slots, and send instant SMS summaries.',
      examples: [
        '24/7 After-Hours Intelligent Receptionist',
        'Automated Clinic & Practice Recall Calls',
        'Emergency Triage & Urgent Dispatch Assistant',
        'Inbound Lead Qualification by Phone',
        'Service Booking & Rescheduling Assistant',
        'Outbound Confirmation & Survey Flows',
        'Voice-to-CRM Call Logging & Summaries',
      ],
      outcomes: [
        '100% of phone calls answered on the first ring',
        'Reclaimed hours spent on manual confirmation calls',
        'Eliminated missed revenue from lost after-hours inquiries',
        'Instant transcription and CRM synchronization for every call',
      ],
      workflow: 'Incoming Call → Real-Time Speech-to-Text → Neural Conversational Model → Expressive Text-to-Speech → CRM / Calendar Action',
      ctaLabel: 'Explore Voice AI',
      ctaPrompt:
        'I would like to explore Voice AI and an intelligent phone receptionist for our business.',
    },
    {
      id: 'service-custom-apps',
      number: '05',
      overline: 'PRODUCT ENGINEERING',
      title: 'Custom Apps, Websites & Digital Platforms',
      summary:
        'Bespoke digital platforms, high-performance web applications, client portals, and internal operational software tailored to your exact business model.',
      description:
        'When generic off-the-shelf software forces your business into awkward workarounds, CoreIQ engineers custom web platforms built with modern React, TypeScript, scalable cloud databases, and intuitive interfaces. We take your project from architecture and UX design through to production deployment and long-term maintenance.',
      examples: [
        'Enterprise Business Websites & SEO Platforms',
        'Custom SaaS Applications & Web Portals',
        'Customer Account & Self-Service Dashboards',
        'Internal Command & Operations Hubs',
        'Mobile-Responsive Field Dispatch Tools',
        'Online Ordering, Booking & Checkout Systems',
        'Secure Document Portals with Role-Based Access',
      ],
      outcomes: [
        'Software that matches your exact competitive workflow',
        'Complete data sovereignty and independent hosting options',
        'Delightful, responsive user experience on mobile, tablet, and desktop',
        'Fast delivery in weeks rather than multi-year agency cycles',
      ],
      workflow: 'Discovery & UX Architecture → Prototyping & Database Schema → Production Build → Security & Performance QA → Deployment',
      ctaLabel: 'Build a Custom Platform',
      ctaPrompt:
        'We need a custom web application or digital platform built for our business. Can we discuss scope and architecture?',
    },
    {
      id: 'service-integrations-bi',
      number: '06',
      overline: 'DATA & CONNECTIVITY',
      title: 'Integrations, Data & Business Intelligence',
      summary:
        'Bridge your existing software ecosystem, unify disparate data sources, and deploy actionable business intelligence dashboards.',
      description:
        'Modern organizations use dozens of tools: CRM, ERP, accounting, marketing, inventory, and messaging. CoreIQ connects these systems with secure APIs, webhook pipelines, and centralized data layers, turning scattered spreadsheets and silos into a single source of truth with real-time operational analytics.',
      examples: [
        'Bi-Directional CRM & Accounting Sync (HubSpot, Salesforce, Xero, Zoho)',
        'E-Commerce, Inventory & Multi-Warehouse Pipelines',
        'Custom REST & GraphQL API Development',
        'Vector Databases & Knowledge Retrieval (RAG)',
        'Executive Analytics & Operational Dashboards',
        'Automated Scheduled PDF & Spreadsheet Reports',
        'Webhook Orchestration & Event Buses',
      ],
      outcomes: [
        'Single source of truth across all business tools',
        'Immediate executive visibility into key operating metrics',
        'Zero data discrepancies between sales, fulfillment, and accounting',
        'Scalable foundation for future AI agent deployments',
      ],
      workflow: 'Source Data Connectors → Transformation & Validation → Secure Data Warehouse → Analytics Engine & Live Dashboards',
      ctaLabel: 'Connect Our Systems',
      ctaPrompt:
        'We want to integrate our business software and build unified data intelligence pipelines.',
    },
  ],
  blueprints: {
    heading: 'Systems Built From Multiple Capabilities',
    subheading:
      'The most powerful business outcomes happen when multiple capabilities work together as a synchronized system. Here are three architectural blueprints representing possible system combinations.',
    items: [
      {
        id: 'blueprint-lead-to-customer',
        title: 'Intelligent Lead-to-Customer System',
        description:
          'A unified acquisition engine that turns casual website visitors and messaging inquiries into paid, scheduled clients without human bottlenecks.',
        badge: 'ACQUISITION & SALES',
        steps: [
          { step: '01', title: 'Omnichannel Engagement', detail: 'Website AI Assistant + WhatsApp Business greeting' },
          { step: '02', title: 'Real-Time Qualification', detail: 'Automated intent analysis, budget matching & requirement intake' },
          { step: '03', title: 'Calendar & Meeting Booking', detail: 'Direct calendar integration based on team availability' },
          { step: '04', title: 'CRM & Pipeline Synchronization', detail: 'Contact record, qualification brief & meeting notes logged' },
          { step: '05', title: 'Automated Multi-Channel Nurturing', detail: 'Personalized SMS, WhatsApp & email confirmation sequences' },
        ],
      },
      {
        id: 'blueprint-customer-communication',
        title: 'Intelligent Customer Communication System',
        description:
          'An integrated support and conversational ecosystem that handles text, messaging, and voice calls with seamless human escalation.',
        badge: 'SUPPORT & VOICE',
        steps: [
          { step: '01', title: 'Universal Inbound Triage', detail: 'Web chat, WhatsApp and Phone voice calls received simultaneously' },
          { step: '02', title: 'Knowledge Retrieval (RAG)', detail: 'Verified query resolution against your company knowledge base' },
          { step: '03', title: 'Tool Action & Account Lookup', detail: 'Real-time order lookup, appointment changes or ticket creation' },
          { step: '04', title: 'Smart Human Escalation', detail: 'High-priority or sensitive tickets routed with full conversational dossier' },
          { step: '05', title: 'Customer Feedback & Follow-up', detail: 'Post-resolution satisfaction survey and audit telemetry' },
        ],
      },
      {
        id: 'blueprint-connected-operations',
        title: 'Connected Business Operations System',
        description:
          'An enterprise operational backbone connecting document processing, automated workflows, internal database records, and executive reporting.',
        badge: 'OPERATIONS & BI',
        steps: [
          { step: '01', title: 'Intelligent Document Intake', detail: 'Automated OCR & parsing of PDF invoices, POs, and contracts' },
          { step: '02', title: 'Validation & Rule Engine', detail: 'Automated 3-way matching and conditional policy checks' },
          { step: '03', title: 'Core Database Ledger', detail: 'Synchronous write to central database and ERP software' },
          { step: '04', title: 'Executive BI Dashboard', detail: 'Real-time margin, throughput, and operational metrics' },
          { step: '05', title: 'Predictive Decision Support', detail: 'Automated anomaly detection and executive summary alerts' },
        ],
      },
    ],
  },
  delivery: {
    heading: 'How We Build Your Solution',
    subheading:
      'We provide end-to-end systems delivery: understanding the business problem, defining the system, building it, integrating it, testing it, deploying it, and continuously improving it.',
    stages: [
      {
        number: '01',
        name: 'Discover',
        description:
          'We understand your core business problem, operational bottlenecks, technology stack, and high-value objectives.',
      },
      {
        number: '02',
        name: 'Blueprint',
        description:
          'We define the solution architecture, data models, integration boundaries, security parameters, and delivery roadmap.',
      },
      {
        number: '03',
        name: 'Design',
        description:
          'We plan user experiences, conversation flows, business guardrails, interface wireframes, and system interactions.',
      },
      {
        number: '04',
        name: 'Build',
        description:
          'We develop the AI agents, automated pipelines, database schemas, and application logic using production-grade code.',
      },
      {
        number: '05',
        name: 'Integrate',
        description:
          'We connect your required systems, APIs, messaging channels, CRMs, document repositories, and legacy databases.',
      },
      {
        number: '06',
        name: 'Test & Deploy',
        description:
          'We validate the solution against real-world production scenarios, stress test edge cases, and deploy for active business use.',
      },
      {
        number: '07',
        name: 'Improve',
        description:
          'We monitor performance telemetry, gather user feedback, and refine and extend the system as your requirements evolve.',
      },
    ],
  },
  faqs: {
    heading: 'Frequently Asked Questions',
    subheading:
      'Clear, honest answers about our AI automation services, technology architecture, delivery model, and regional capabilities.',
    items: [
      {
        id: 'faq-1',
        question: 'What AI automation services does CoreIQ Create provide in South Africa?',
        answer:
          'CoreIQ provides comprehensive AI and automation engineering for businesses in South Africa, across Africa, and internationally. Our core services include autonomous AI agents, workflow and business process automation, WhatsApp Business API chatbots, conversational voice AI receptionists, custom full-stack web applications, and system integrations with business intelligence reporting.',
        published: true,
      },
      {
        id: 'faq-2',
        question: 'What is the difference between an AI agent and workflow automation?',
        answer:
          'Workflow automation executes predictable, rule-based sequences (for example: "When a form is submitted, create a row in Google Sheets and email the sales team"). An AI agent possesses reasoning and adaptive capabilities: it can read unstructured customer emails, decide which tools to call, look up policy documents, evaluate context, and generate tailored responses within defined business boundaries.',
        published: true,
      },
      {
        id: 'faq-3',
        question: 'Can CoreIQ automate WhatsApp Business?',
        answer:
          'Yes. We build intelligent WhatsApp Business solutions using the official Cloud API. We can deploy AI assistants that answer product questions, qualify sales leads, verify order statuses, send automated appointment reminders, and hand off conversations to human team members inside your existing CRM or helpdesk.',
        published: true,
      },
      {
        id: 'faq-4',
        question: 'Can CoreIQ build AI customer support systems?',
        answer:
          'Absolutely. We design custom AI customer support agents grounded specifically in your company documentation, FAQs, product catalogs, and operating policies. Our systems resolve routine inquiries instantly with citation-backed accuracy while routing complex or high-priority cases with full transcripts to human operators.',
        published: true,
      },
      {
        id: 'faq-5',
        question: 'Can you build custom applications and websites?',
        answer:
          'Yes. CoreIQ engineers production-grade web applications, customer portals, internal management dashboards, and modern commercial websites using modern React, TypeScript, and cloud databases. We handle complete lifecycle delivery from UI/UX design and database architecture to deployment and monitoring.',
        published: true,
      },
      {
        id: 'faq-6',
        question: 'Can AI systems integrate with our existing CRM and software?',
        answer:
          'Yes. We integrate with virtually any platform that provides an API or webhook interface, including HubSpot, Salesforce, Zoho, Xero, Stripe, Shopify, Google Workspace, Microsoft 365, Slack, and custom SQL databases. We ensure your new AI systems enhance your existing software investment rather than replacing it.',
        published: true,
      },
      {
        id: 'faq-7',
        question: 'Can you build voice AI assistants?',
        answer:
          'Yes. We build ultra-low-latency conversational voice agents that answer inbound phone calls, schedule appointments, handle emergency after-hours triage, and conduct outbound customer check-ins with natural, expressive human cadence and realistic South African and international accents.',
        published: true,
      },
      {
        id: 'faq-8',
        question: 'Do you work with businesses outside South Africa?',
        answer:
          'Yes. While South Africa is our primary search-market priority, CoreIQ actively serves businesses across the African continent and globally (United Kingdom, United States, Europe, and Australia). All project delivery, system architecture, and client communication can be conducted fully remotely.',
        published: true,
      },
      {
        id: 'faq-9',
        question: 'How does a CoreIQ project begin?',
        answer:
          'Every project starts with an initial discovery conversation — either via our interactive Ask CoreIQ assistant or a direct consultation. We identify your business bottleneck, define clear success criteria, produce a transparent system architecture blueprint, and provide a fixed scope and delivery timeline.',
        published: true,
      },
      {
        id: 'faq-10',
        question: "What if I don't know which AI solution my business needs?",
        answer:
          "You don't need to know the technical solution beforehand — that's our job. Start with the problem you want solved (e.g., 'we lose leads after hours' or 'our manual invoice reconciliation is too slow'). Use our interactive problem finder on this page or Ask CoreIQ, and we will recommend the practical system architecture that delivers the highest ROI.",
        published: true,
      },
    ],
  },
  closing: {
    headline: 'Your next system starts with a problem worth solving.',
    supporting:
      "Tell us what your business needs to do better. We'll help turn that requirement into a practical digital solution.",
    primaryCta: 'Start a Project With CoreIQ',
    primaryCtaPrompt:
      'I would like to start a project with CoreIQ Create. Here is an overview of our business and what we want to solve:',
    secondaryCta: 'Ask CoreIQ',
    secondaryCtaPrompt:
      'What are the recommended steps and architectural options for an AI solution for our company?',
  },
};

/**
 * Safely parses JSON string or raw object into a validated ServicesPageContent structure.
 * Falls back cleanly to DEFAULT_SERVICES_CONTENT if input is empty, invalid or corrupted.
 */
export function parseServicesPageContent(raw: any): ServicesPageContent {
  if (!raw) return DEFAULT_SERVICES_CONTENT;

  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return DEFAULT_SERVICES_CONTENT;
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return DEFAULT_SERVICES_CONTENT;
  }

  return {
    seo: {
      title: parsed.seo?.title || DEFAULT_SERVICES_CONTENT.seo.title,
      description: parsed.seo?.description || DEFAULT_SERVICES_CONTENT.seo.description,
      canonicalUrl: parsed.seo?.canonicalUrl || DEFAULT_SERVICES_CONTENT.seo.canonicalUrl,
    },
    hero: {
      overline: parsed.hero?.overline || DEFAULT_SERVICES_CONTENT.hero.overline,
      h1: parsed.hero?.h1 || DEFAULT_SERVICES_CONTENT.hero.h1,
      supportingCopy: parsed.hero?.supportingCopy || DEFAULT_SERVICES_CONTENT.hero.supportingCopy,
      geoLine: parsed.hero?.geoLine || DEFAULT_SERVICES_CONTENT.hero.geoLine,
      primaryCta: parsed.hero?.primaryCta || DEFAULT_SERVICES_CONTENT.hero.primaryCta,
      primaryCtaPrompt: parsed.hero?.primaryCtaPrompt || DEFAULT_SERVICES_CONTENT.hero.primaryCtaPrompt,
      secondaryCta: parsed.hero?.secondaryCta || DEFAULT_SERVICES_CONTENT.hero.secondaryCta,
    },
    capabilityTicker: {
      enabled: parsed.capabilityTicker?.enabled ?? DEFAULT_SERVICES_CONTENT.capabilityTicker.enabled,
      items: Array.isArray(parsed.capabilityTicker?.items) && parsed.capabilityTicker.items.length > 0
        ? parsed.capabilityTicker.items
        : DEFAULT_SERVICES_CONTENT.capabilityTicker.items,
    },
    problemDiscovery: {
      heading: parsed.problemDiscovery?.heading || DEFAULT_SERVICES_CONTENT.problemDiscovery.heading,
      subheading: parsed.problemDiscovery?.subheading || DEFAULT_SERVICES_CONTENT.problemDiscovery.subheading,
      problems: Array.isArray(parsed.problemDiscovery?.problems) && parsed.problemDiscovery.problems.length > 0
        ? parsed.problemDiscovery.problems
        : DEFAULT_SERVICES_CONTENT.problemDiscovery.problems,
    },
    services: Array.isArray(parsed.services) && parsed.services.length > 0
      ? parsed.services
      : DEFAULT_SERVICES_CONTENT.services,
    blueprints: {
      heading: parsed.blueprints?.heading || DEFAULT_SERVICES_CONTENT.blueprints.heading,
      subheading: parsed.blueprints?.subheading || DEFAULT_SERVICES_CONTENT.blueprints.subheading,
      items: Array.isArray(parsed.blueprints?.items) && parsed.blueprints.items.length > 0
        ? parsed.blueprints.items
        : DEFAULT_SERVICES_CONTENT.blueprints.items,
    },
    delivery: {
      heading: parsed.delivery?.heading || DEFAULT_SERVICES_CONTENT.delivery.heading,
      subheading: parsed.delivery?.subheading || DEFAULT_SERVICES_CONTENT.delivery.subheading,
      stages: Array.isArray(parsed.delivery?.stages) && parsed.delivery.stages.length > 0
        ? parsed.delivery.stages
        : DEFAULT_SERVICES_CONTENT.delivery.stages,
    },
    faqs: {
      heading: parsed.faqs?.heading || DEFAULT_SERVICES_CONTENT.faqs.heading,
      subheading: parsed.faqs?.subheading || DEFAULT_SERVICES_CONTENT.faqs.subheading,
      items: Array.isArray(parsed.faqs?.items) && parsed.faqs.items.length > 0
        ? parsed.faqs.items
        : DEFAULT_SERVICES_CONTENT.faqs.items,
    },
    closing: {
      headline: parsed.closing?.headline || DEFAULT_SERVICES_CONTENT.closing.headline,
      supporting: parsed.closing?.supporting || DEFAULT_SERVICES_CONTENT.closing.supporting,
      primaryCta: parsed.closing?.primaryCta || DEFAULT_SERVICES_CONTENT.closing.primaryCta,
      primaryCtaPrompt: parsed.closing?.primaryCtaPrompt || DEFAULT_SERVICES_CONTENT.closing.primaryCtaPrompt,
      secondaryCta: parsed.closing?.secondaryCta || DEFAULT_SERVICES_CONTENT.closing.secondaryCta,
      secondaryCtaPrompt: parsed.closing?.secondaryCtaPrompt || DEFAULT_SERVICES_CONTENT.closing.secondaryCtaPrompt,
    },
  };
}
