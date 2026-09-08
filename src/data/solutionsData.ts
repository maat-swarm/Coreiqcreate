import { SolutionItem, ProcessStep } from '../types';

export const SOLUTIONS_LIST: SolutionItem[] = [
  {
    id: 'ai-agents',
    title: 'AI Agents',
    description: 'Specialised intelligence for repeatable work. Autonomous systems that execute workflows and collaborate.',
    iconName: 'Sparkles',
    category: 'Intelligence',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
    actionText: 'Explore Agents',
    previewType: 'agents',
  },
  {
    id: 'automation',
    title: 'Automation',
    description: 'Remove busy work and connect workflows across your entire tech stack effortlessly.',
    iconName: 'Zap',
    category: 'Workflows',
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    actionText: 'Explore Automation',
    previewType: 'automation',
  },
  {
    id: 'apps',
    title: 'Apps',
    description: 'Useful software built around real needs. Fast, scalable and tailored to your operations.',
    iconName: 'LayoutGrid',
    category: 'Software',
    gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
    actionText: 'Explore Apps',
    previewType: 'apps',
  },
  {
    id: 'websites',
    title: 'Websites & Web Apps',
    description: 'Modern digital experiences that work for you. High performance, fluid animations and responsive architecture.',
    iconName: 'Monitor',
    category: 'Web',
    gradient: 'from-cyan-500 via-teal-500 to-blue-500',
    actionText: 'Explore Websites',
    previewType: 'web',
  },
  {
    id: 'voice-ai',
    title: 'Voice AI',
    description: 'Natural voice interfaces and business conversations with human-grade prosody and latency.',
    iconName: 'Mic',
    category: 'Voice',
    gradient: 'from-pink-500 via-purple-500 to-cyan-500',
    actionText: 'Explore Voice AI',
    previewType: 'voice',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Connect tools, data and systems. Unified data pipelines and bidirectional synchronization.',
    iconName: 'Link',
    category: 'Infrastructure',
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    actionText: 'Explore Integrations',
    previewType: 'integrations',
  },
];

export const CONNECTED_CAPABILITIES = [
  { id: 'agents', label: 'AI Agents', desc: 'Specialised intelligence for repeatable work', side: 'left', icon: 'Sparkles' },
  { id: 'automation', label: 'Automation', desc: 'Remove busy work and connect workflows', side: 'left', icon: 'Zap' },
  { id: 'apps', label: 'Apps & Websites', desc: 'Custom solutions built for your unique needs', side: 'left', icon: 'LayoutGrid' },
  { id: 'voice', label: 'Voice AI', desc: 'Natural voice interfaces and conversations', side: 'right', icon: 'Mic' },
  { id: 'customer', label: 'Customer AI', desc: 'Smarter support, happier customers', side: 'right', icon: 'MessageSquare' },
  { id: 'integrations', label: 'Integrations', desc: 'Connect your tools, data and systems', side: 'right', icon: 'Link' },
];

export const PROCESS_STEPS: ProcessStep[] = [
  { number: 1, label: 'IDEA', sublabel: 'Share your vision and goals.', iconName: 'Lightbulb' },
  { number: 2, label: 'DISCOVERY', sublabel: 'We explore options and find the best approach.', iconName: 'Search' },
  { number: 3, label: 'DESIGN', sublabel: 'We craft the right solution for your needs.', iconName: 'Layout' },
  { number: 4, label: 'BUILD', sublabel: 'We bring it to life with modern technology.', iconName: 'Code' },
  { number: 5, label: 'INTEGRATE', sublabel: 'We connect your tools, data and systems.', iconName: 'Link' },
  { number: 6, label: 'OPTIMIZE', sublabel: 'We refine and improve over time.', iconName: 'TrendingUp' },
];

export const GOAL_INTENTS = [
  { icon: 'Zap', text: 'I want to automate my business.', target: 'automation' },
  { icon: 'MessageSquare', text: 'I need an AI customer service agent.', target: 'agents' },
  { icon: 'LayoutGrid', text: 'I want to build an app.', target: 'apps' },
  { icon: 'Monitor', text: 'I need a better website.', target: 'websites' },
  { icon: 'Link', text: 'I want my tools to work together.', target: 'integrations' },
];
