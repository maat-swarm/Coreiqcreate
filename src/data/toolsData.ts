import { ToolItem } from '../types';

export const TOOL_CATEGORIES = [
  'All',
  'Writing',
  'Images',
  'Code',
  'Business',
  'Data',
  'Automation',
];

export const TOOLS_LIST: ToolItem[] = [
  {
    id: 'prompt-enhancer',
    title: 'Prompt Enhancer',
    description: 'Transform vague ideas into structured, high-leverage prompts that unlock superior model intelligence.',
    iconName: 'Sparkles',
    category: 'Writing',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'headline-generator',
    title: 'Headline Generator',
    description: 'Craft high-converting hooks, titles, and editorial headlines tailored to your specific audience.',
    iconName: 'FileText',
    category: 'Writing',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: 'image-prompt-builder',
    title: 'Image Prompt Builder',
    description: 'Construct detailed photographic and artistic prompts with camera lens, lighting, and composition tokens.',
    iconName: 'Image',
    category: 'Images',
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'code-explainer',
    title: 'Code Explainer',
    description: 'Break down complex algorithms, legacy repositories, or unfamiliar syntax into clear mental models.',
    iconName: 'Code',
    category: 'Code',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'data-formatter',
    title: 'Data Formatter',
    description: 'Instantly convert messy CSV, JSON, markdown tables, and unstructured text into clean schemas.',
    iconName: 'Database',
    category: 'Data',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'regex-builder',
    title: 'Regex Builder',
    description: 'Explain, construct, and validate regular expressions with test pattern evaluation and edge-case flags.',
    iconName: 'Terminal',
    category: 'Code',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'meeting-summarizer',
    title: 'Meeting Summarizer',
    description: 'Condense audio transcripts or discussion notes into executive decisions, blockers, and next actions.',
    iconName: 'Clock',
    category: 'Business',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    id: 'workflow-mapper',
    title: 'Workflow Mapper',
    description: 'Map operational bottlenecks and generate autonomous trigger-action execution diagrams.',
    iconName: 'GitBranch',
    category: 'Automation',
    gradient: 'from-cyan-500 to-teal-500',
  },
];

export const TOOL_PHILOSOPHY = [
  {
    title: 'Speed',
    description: 'No accounts, no onboarding, no configuration. Open the tool, get what you need, and move on.',
    iconName: 'Zap',
  },
  {
    title: 'Focus',
    description: 'Each tool does one thing with total precision. No feature bloat, no distracting menus or complex settings.',
    iconName: 'Crosshair',
  },
  {
    title: 'Composability',
    description: 'Use tools independently or chain them together as building blocks in larger workflows and automation swarms.',
    iconName: 'Layers',
  },
];
