export type ItemType = 'prompt' | 'command' | 'snippet';

export interface Category {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  type: ItemType;
  categoryId: string;
  categoryName: string;
  title: string;
  content: string;
  description?: string;
  tags: string[];
  isDeprecated?: boolean;
  createdAt: number;
}

export type ViewMode = 'all' | 'prompts' | 'commands' | 'snippets';
