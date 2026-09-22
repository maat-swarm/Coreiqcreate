export type NavRoute = 'home' | 'solutions' | 'apps' | 'learn' | 'tools' | 'about' | 'ask' | 'command' | `learn/${string}`;

export interface NavItem {
  id: NavRoute;
  label: string;
  path: string;
}

export interface SolutionItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: string;
  gradient: string;
  actionText: string;
  previewType?: 'agents' | 'automation' | 'apps' | 'web' | 'voice' | 'integrations';
}

export interface AppItem {
  id: string;
  title: string;
  tagline: string;
  category: 'AI' | 'Business' | 'Productivity' | 'Creative' | 'Documents' | 'Automation' | 'Data' | 'Marketing' | 'Websites' | 'Apps';
  iconName: string;
  accentColor: string;
  featured?: boolean;
}

export interface ToolItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'Writing' | 'Documents' | 'Images' | 'Presentations' | 'Research' | 'Productivity' | 'AI' | 'Code' | 'Voice' | 'Business' | 'Data' | 'Automation';
  gradient: string;
}

export interface LearnTopic {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category?: string;
  level?: string;
  readTime?: string;
  count?: string;
}

export interface LearnArticle {
  id: string;
  tag: string;
  title: string;
  readTime: string;
  gradient: string;
}

export interface ProcessStep {
  number: number;
  label: string;
  sublabel: string;
  iconName: string;
}

export interface AskSuggestion {
  text: string;
  category: string;
}

export interface SolutionBlueprint {
  title: string;
  description: string;
  suggestedStack: string[];
  capabilities: string[];
  estimatedTimeline: string;
  recommendedType: 'agent' | 'automation' | 'app' | 'website' | 'voice' | 'custom';
}
