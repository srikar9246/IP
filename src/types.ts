export type TemplateType = 'blog' | 'social' | 'email' | 'product';

export interface ContentTemplate {
  id: TemplateType;
  title: string;
  description: string;
  icon: string;
  prompt: string;
}

export interface GeneratedContent {
  text: string;
  imageUrl?: string;
  analytics: {
    wordCount: number;
    readingTime: number;
    sentiment: 'Positive' | 'Neutral' | 'Professional';
    keywords: string[];
  };
}

export const TEMPLATES: ContentTemplate[] = [
  {
    id: 'blog',
    title: 'LinkedIn Authority Post',
    description: 'Craft insightful, long-form professional narratives that establish thought leadership in your industry.',
    icon: 'FileText',
    prompt: 'Write a professional LinkedIn authority post about {topic}. Focus on thought leadership, industry insights, and professional tone.'
  },
  {
    id: 'product',
    title: 'Product Launch Ad',
    description: 'High-impact copy and visual prompts designed to convert interest into desire for new offerings.',
    icon: 'Rocket',
    prompt: 'Create a high-impact product launch ad for {topic}. Include compelling copy and a visual description for an ad image.'
  },
  {
    id: 'email',
    title: 'Email Sequence',
    description: 'A sophisticated 5-part nurture flow designed to build relationships and guide audiences through a brand story.',
    icon: 'Mail',
    prompt: 'Draft a 5-part email nurture sequence about {topic}. Each email should advance the brand story and build a relationship with the reader.'
  },
  {
    id: 'product', // Reusing ID for now, or adding a new one
    title: 'Brand Style Guide',
    description: 'Define your tone of voice, aesthetic keywords, and visual constraints for consistent AI generation.',
    icon: 'PenTool',
    prompt: 'Generate a brand style guide for {topic}. Include tone of voice, aesthetic keywords, and visual constraints.'
  }
];
