import { LearnTopic, LearnArticle } from '../types';

export const LEARN_CATEGORIES = [
  'All',
  'AI Fundamentals',
  'Automation',
  'Agents',
  'Development',
  'Business Strategy',
  'Tools & Workflows',
];

export const LEARN_TOPICS: LearnTopic[] = [
  {
    id: 'understanding-ai-agents',
    title: 'Understanding AI Agents',
    description: 'How autonomous agents work, when to use them, and how they collaborate in swarms with tool rights.',
    iconName: 'Network',
    category: 'Agents',
    level: 'Beginner',
    readTime: '15 min read',
  },
  {
    id: 'mastering-workflow-automation',
    title: 'Mastering Workflow Automation',
    description: 'Connect your tools, eliminate manual tasks, and build reliable automation pipelines with error recovery.',
    iconName: 'Zap',
    category: 'Automation',
    level: 'Intermediate',
    readTime: '25 min read',
  },
  {
    id: 'building-with-core-iq-tools',
    title: 'Building with Core IQ Tools',
    description: 'A practical walkthrough of every tool in the Core IQ ecosystem and how to combine them into workflows.',
    iconName: 'Wrench',
    category: 'Tools & Workflows',
    level: 'Beginner',
    readTime: '10 min read',
  },
  {
    id: 'prompt-engineering-handbook',
    title: 'The Prompt Engineering Handbook',
    description: 'Techniques, frameworks and best practices for getting precise, high-quality results from any model.',
    iconName: 'MessageSquare',
    category: 'AI Fundamentals',
    level: 'All Levels',
    readTime: '30 min read',
  },
  {
    id: 'data-intelligence-architecture',
    title: 'Data & Intelligence Architecture',
    description: 'How to structure, store and query data for intelligent systems that scale reliably in production.',
    iconName: 'Box',
    category: 'Development',
    level: 'Advanced',
    readTime: '35 min read',
  },
  {
    id: 'from-idea-to-product',
    title: 'From Idea to Product',
    description: 'The complete journey of turning a business need into a working application with modern web tech.',
    iconName: 'GraduationCap',
    category: 'Business Strategy',
    level: 'Intermediate',
    readTime: '20 min read',
  },
];

export const FOUR_PILLARS = [
  {
    title: 'Concepts',
    description: 'Understand how AI actually works, beyond the hype. Mental models that give you permanent clarity.',
    iconName: 'Compass',
  },
  {
    title: 'Tools',
    description: 'Learn which tools to use and how they fit together into modular, friction-free creative stacks.',
    iconName: 'Wrench',
  },
  {
    title: 'Practice',
    description: 'Build real projects that solve genuine problems. Real code, live pipelines, and working applications.',
    iconName: 'Hammer',
  },
  {
    title: 'Strategy',
    description: 'Think critically about where AI adds real leverage and where human judgment remains paramount.',
    iconName: 'Target',
  },
];

export const LEARN_PATH_STEPS = [
  { step: 'UNDERSTAND', desc: 'Learn the fundamentals and key concepts.', iconName: 'Lightbulb' },
  { step: 'EXPERIMENT', desc: 'Try tools and explore possibilities.', iconName: 'FlaskConical' },
  { step: 'BUILD', desc: 'Create your own projects.', iconName: 'Code' },
  { step: 'AUTOMATE', desc: 'Streamline your workflows.', iconName: 'Cog' },
  { step: 'SCALE', desc: 'Turn solutions into impact.', iconName: 'TrendingUp' },
];

export const LATEST_LEARNING_ARTICLES: LearnArticle[] = [
  {
    id: 'multimodal-models',
    tag: 'AI NEWS',
    title: 'New generation of multimodal models',
    readTime: '4 min read',
    gradient: 'from-blue-600 to-cyan-500',
  },
  {
    id: 'first-ai-agent',
    tag: 'GUIDE',
    title: 'How to build your first AI agent',
    readTime: '8 min read',
    gradient: 'from-indigo-600 to-purple-500',
  },
  {
    id: 'website-in-minutes',
    tag: 'TUTORIAL',
    title: 'Create a website with AI in minutes',
    readTime: '6 min read',
    gradient: 'from-fuchsia-600 to-pink-500',
  },
];
