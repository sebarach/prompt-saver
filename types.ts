export type ItemType = 'prompt' | 'command' | 'snippet';

export interface Item {
  id: string;
  type: ItemType;
  category: string; // e.g., 'Azure', 'NPM', 'React'
  title: string;
  content: string; // The prompt text or command code
  description?: string;
  tags: string[];
  isDeprecated?: boolean;
  createdAt: number;
}

export interface FilterState {
  query: string;
  tags: string[];
  category: string | null;
}

export type ViewMode = 'all' | 'prompts' | 'commands' | 'snippets';