import { supabase } from "../lib/supabase";
import { Item } from "../types";
import { Database } from "../types/supabase";

type ItemRow = Database["public"]["Tables"]["items"]["Row"];

const STORAGE_KEY_ITEMS = "devvault_items";
const STORAGE_KEY_CATEGORIES = "devvault_categories";

// Helper para detectar si estamos en modo offline (sin credenciales válidas)
// O si simplemente queremos forzar el fallback si falla la conexión
const isSupabaseConfigured = () => {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL;
  return url && !url.includes("placeholder");
};

/**
 * Servicio Local (LocalStorage)
 */
const localService = {
  getAllItems: async (): Promise<Item[]> => {
    const stored = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!stored) return [];
    return JSON.parse(stored);
  },
  saveItem: async (item: Omit<Item, "id" | "createdAt">): Promise<Item> => {
    const items = await localService.getAllItems();
    const newItem: Item = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      description: item.description || undefined,
      tags: item.tags || [],
    };
    localStorage.setItem(
      STORAGE_KEY_ITEMS,
      JSON.stringify([newItem, ...items])
    );
    return newItem;
  },
  updateItem: async (
    id: string,
    updates: Partial<Omit<Item, "id" | "createdAt">>
  ): Promise<Item> => {
    const items = await localService.getAllItems();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Item not found");

    const updatedItem = { ...items[index], ...updates };
    items[index] = updatedItem;
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    return updatedItem;
  },
  deleteItem: async (id: string): Promise<void> => {
    const items = await localService.getAllItems();
    const filtered = items.filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(filtered));
  },
  getAllCategories: async (): Promise<string[]> => {
    const stored = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    return stored ? JSON.parse(stored) : [];
  },
  createCategory: async (name: string): Promise<string> => {
    const cats = await localService.getAllCategories();
    if (!cats.includes(name)) {
      const newCats = [...cats, name].sort();
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(newCats));
    }
    return name;
  },
};

/**
 * Servicio Supabase (Original)
 */
const remoteService = {
  getAllItems: async (): Promise<Item[]> => {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as ItemRow[]).map(mapRowToItem);
  },
  saveItem: async (item: Omit<Item, "id" | "createdAt">): Promise<Item> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado");

    const { data, error } = await supabase
      .from("items")
      .insert({
        user_id: user.id,
        type: item.type,
        category: item.category,
        title: item.title,
        content: item.content,
        description: item.description,
        tags: item.tags,
      })
      .select()
      .single();

    if (error) throw error;
    return mapRowToItem(data as ItemRow);
  },
  updateItem: async (
    id: string,
    updates: Partial<Omit<Item, "id" | "createdAt">>
  ): Promise<Item> => {
    const { data, error } = await supabase
      .from("items")
      .update({
        type: updates.type,
        category: updates.category,
        title: updates.title,
        content: updates.content,
        description: updates.description,
        tags: updates.tags,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapRowToItem(data as ItemRow);
  },
  deleteItem: async (id: string): Promise<void> => {
    const { error } = await supabase.from("items").delete().eq("id", id);

    if (error) throw error;
  },
  getAllCategories: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("name")
      .order("name", { ascending: true });

    if (error) throw error;
    return data.map((d) => d.name);
  },
  createCategory: async (name: string): Promise<string> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado");

    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("name", name)
      .single();

    if (existing) return name;

    const { error } = await supabase.from("categories").insert({
      user_id: user.id,
      name: name,
    });

    if (error) throw error;
    return name;
  },
};

// Facade Pattern: Elige entre Local o Remote según configuración
const useRemote = isSupabaseConfigured();

export const itemsService = {
  getAll: async () => {
    try {
      if (useRemote) return await remoteService.getAllItems();
    } catch (e) {
      console.warn("Fallo Supabase, usando local storage:", e);
    }
    return await localService.getAllItems();
  },
  create: async (item: Omit<Item, "id" | "createdAt">) => {
    if (useRemote) {
      try {
        return await remoteService.saveItem(item);
      } catch (e) {
        console.warn("Fallo Supabase save", e);
      }
    }
    return await localService.saveItem(item);
  },
  update: async (
    id: string,
    updates: Partial<Omit<Item, "id" | "createdAt">>
  ) => {
    if (useRemote) {
      try {
        return await remoteService.updateItem(id, updates);
      } catch (e) {
        console.warn("Fallo Supabase update", e);
      }
    }
    return await localService.updateItem(id, updates);
  },
  delete: async (id: string) => {
    if (useRemote) {
      try {
        return await remoteService.deleteItem(id);
      } catch (e) {
        console.warn("Fallo Supabase delete", e);
      }
    }
    return await localService.deleteItem(id);
  },
};

export const categoriesService = {
  getAll: async () => {
    try {
      if (useRemote) return await remoteService.getAllCategories();
    } catch (e) {
      console.warn("Fallo Supabase categories", e);
    }
    return await localService.getAllCategories();
  },
  create: async (name: string) => {
    if (useRemote) {
      try {
        return await remoteService.createCategory(name);
      } catch (e) {
        console.warn("Fallo Supabase create category", e);
      }
    }
    return await localService.createCategory(name);
  },
};

// Mapper Helper
function mapRowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    type: row.type as "prompt" | "command" | "snippet",
    category: row.category,
    title: row.title,
    content: row.content,
    description: row.description || undefined,
    tags: row.tags || [],
    createdAt: new Date(row.created_at).getTime(),
  };
}
