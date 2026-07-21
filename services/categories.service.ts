import { supabase } from '../lib/supabase';
import type { Category } from '../types';
import type { Database } from '../types';

type CategoryRow = Database['public']['Functions']['get_categories']['Returns'] extends infer T
  ? T extends Array<infer U> ? U : never
  : never;

export const categoriesService = {
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase.rpc('get_categories');
    if (error) throw error;
    return (data as CategoryRow[]).map((row) => ({
      id: row.id,
      name: row.name,
    }));
  },

  async create(name: string): Promise<Category> {
    const { data, error } = await supabase.rpc('create_category', {
      p_name: name,
    });
    if (error) throw error;
    const row = (data as CategoryRow[])[0];
    return { id: row.id, name: row.name };
  },
};
