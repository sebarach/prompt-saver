import { supabase } from '../lib/supabase';
import type { Item, Category } from '../types';
import type { Database } from '../types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ItemRow = Database['public']['Functions']['get_items']['Returns'] extends infer T
  ? T extends Array<infer U> ? U : never
  : never;

function mapRowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    type: row.type as Item['type'],
    categoryId: row.category_id,
    categoryName: row.category_name ?? '',
    title: row.title,
    content: row.content,
    description: row.description || undefined,
    tags: row.tags || [],
    isDeprecated: row.is_deprecated ?? false,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export const itemsService = {
  async getAll(): Promise<Item[]> {
    const { data, error } = await supabase.rpc('get_items');
    if (error) throw error;
    return (data as ItemRow[]).map(mapRowToItem);
  },

  async create(item: Omit<Item, 'id' | 'createdAt' | 'categoryName'>): Promise<Item> {
    if (!item.categoryId || !UUID_RE.test(item.categoryId)) {
      throw new Error('Debes seleccionar una categoría válida');
    }
    const { data, error } = await supabase.rpc('create_item', {
      p_type: item.type,
      p_title: item.title,
      p_content: item.content,
      p_description: item.description ?? '',
      p_category_id: item.categoryId,
      p_tags: item.tags ?? [],
    });
    if (error) throw error;
    return mapRowToItem((data as ItemRow[])[0]);
  },

  async update(id: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'categoryName'>>): Promise<Item> {
    const catId = updates.categoryId && UUID_RE.test(updates.categoryId) ? updates.categoryId : null;
    const { data, error } = await supabase.rpc('update_item', {
      p_id: id,
      p_title: updates.title,
      p_content: updates.content,
      p_description: updates.description,
      p_category_id: catId,
      p_tags: updates.tags,
      p_is_deprecated: updates.isDeprecated,
    });
    if (error) throw error;
    return mapRowToItem((data as ItemRow[])[0]);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.rpc('delete_item', { p_id: id });
    if (error) throw error;
  },
};

export { Category };
