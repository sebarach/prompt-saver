import { supabase } from '../lib/supabase';
import { Item } from '../types';
import { Database } from '../types/supabase';

type ItemRow = Database['public']['Tables']['items']['Row'];

// ─── Row → Domain mapper ────────────────────────────────
function mapRowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    type: row.type as Item['type'],
    category: row.category,
    title: row.title,
    content: row.content,
    description: row.description || undefined,
    tags: row.tags || [],
    isDeprecated: row.is_deprecated ?? false,
    createdAt: new Date(row.created_at).getTime(),
  };
}

// ─── Service (RPC only) ─────────────────────────────────
export const itemsService = {
  async getAll(): Promise<Item[]> {
    const { data, error } = await supabase.rpc('get_items');
    if (error) throw error;
    return (data as ItemRow[]).map(mapRowToItem);
  },

  async create(item: Omit<Item, 'id' | 'createdAt'>): Promise<Item> {
    const { data, error } = await supabase.rpc('create_item', {
      p_type: item.type,
      p_title: item.title,
      p_content: item.content,
      p_description: item.description ?? '',
      p_category: item.category,
      p_tags: item.tags ?? [],
    });
    if (error) throw error;
    return mapRowToItem(data as ItemRow);
  },

  async update(id: string, updates: Partial<Omit<Item, 'id' | 'createdAt'>>): Promise<Item> {
    const { data, error } = await supabase.rpc('update_item', {
      p_id: id,
      p_title: updates.title,
      p_content: updates.content,
      p_description: updates.description,
      p_category: updates.category,
      p_tags: updates.tags,
      p_is_deprecated: updates.isDeprecated,
    });
    if (error) throw error;
    return mapRowToItem(data as ItemRow);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.rpc('delete_item', { p_id: id });
    if (error) throw error;
  },
};
