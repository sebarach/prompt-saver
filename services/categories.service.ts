import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type CategoryRow = Database['public']['Tables']['categories']['Row'];

// ─── Service (RPC only) ─────────────────────────────────
export const categoriesService = {
  async getAll(): Promise<string[]> {
    const { data, error } = await supabase.rpc('get_categories');
    if (error) throw error;
    return (data as CategoryRow[]).map((row) => row.name);
  },

  async create(name: string): Promise<string> {
    const { data, error } = await supabase.rpc('create_category', {
      p_name: name,
    });
    if (error) throw error;
    return (data as CategoryRow).name;
  },
};
