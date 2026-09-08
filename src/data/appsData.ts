import { AppItem } from '../types';

export const APPS_LIST: AppItem[] = [
  {
    id: 'imageforge',
    title: 'ImageForge',
    tagline: 'Create and edit stunning images with AI.',
    category: 'Creative',
    iconName: 'Flame',
    accentColor: '#ec4899',
    featured: true,
  },
  {
    id: 'writepro',
    title: 'WritePro',
    tagline: 'Generate, refine and improve your writing.',
    category: 'Productivity',
    iconName: 'PenTool',
    accentColor: '#06b6d4',
  },
  {
    id: 'datamind',
    title: 'DataMind',
    tagline: 'Turn your data into insights with AI.',
    category: 'Data',
    iconName: 'Database',
    accentColor: '#8b5cf6',
  },
  {
    id: 'flowbuilder',
    title: 'FlowBuilder',
    tagline: 'Automate your workflows without code.',
    category: 'Automation',
    iconName: 'GitMerge',
    accentColor: '#3b82f6',
  },
  {
    id: 'webcraft',
    title: 'WebCraft',
    tagline: 'Build modern websites and web apps.',
    category: 'Websites',
    iconName: 'Monitor',
    accentColor: '#10b981',
  },
  {
    id: 'voicestudio',
    title: 'VoiceStudio',
    tagline: 'Create natural voice and speech with AI.',
    category: 'AI',
    iconName: 'Volume2',
    accentColor: '#f43f5e',
  },
  {
    id: 'customerai',
    title: 'CustomerAI',
    tagline: 'Smart chatbots for better customer experiences.',
    category: 'AI',
    iconName: 'MessageSquare',
    accentColor: '#06b6d4',
  },
  {
    id: 'appbuilder',
    title: 'AppBuilder',
    tagline: 'Build and launch your own app.',
    category: 'Apps',
    iconName: 'LayoutGrid',
    accentColor: '#a855f7',
  },
  {
    id: 'researchpro',
    title: 'ResearchPro',
    tagline: 'Find, analyse and summarise information faster.',
    category: 'Productivity',
    iconName: 'Search',
    accentColor: '#38bdf8',
  },
  {
    id: 'marketingai',
    title: 'MarketingAI',
    tagline: 'Create campaigns, content and strategy with AI.',
    category: 'Marketing',
    iconName: 'Megaphone',
    accentColor: '#f59e0b',
  },
];

export const APP_CATEGORIES = [
  'All',
  'AI',
  'Business',
  'Productivity',
  'Creative',
  'Documents',
  'Automation',
  'Data',
  'Marketing',
] as const;

export const PRO_TIERS = [
  {
    step: '1',
    title: 'Try',
    desc: 'Explore free tools and get started with intelligent creation immediately.',
    iconName: 'Play',
  },
  {
    step: '2',
    title: 'Upgrade',
    desc: 'Unlock more features, custom models, and expanded production limits.',
    iconName: 'Sparkles',
  },
  {
    step: '3',
    title: 'Customize',
    desc: 'Get a tailored enterprise-grade solution built exclusively for your business.',
    iconName: 'Cpu',
  },
];
