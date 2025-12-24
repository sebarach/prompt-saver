import { useState, useEffect, useCallback } from 'react';
import { Item } from '../types';
import { itemsService, categoriesService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useData() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [fetchedItems, fetchedCategories] = await Promise.all([
        itemsService.getAll(),
        categoriesService.getAll()
      ]);
      setItems(fetchedItems);
      // Combinamos las categorias por defecto + las de BD + las de los items para asegurar consistencia
      const uniqueCategories = Array.from(new Set([
        'General', 'Azure', 'AWS', 'React', 'NPM', 'Docker', 'Git',
        ...fetchedCategories,
        ...fetchedItems.map(i => i.category)
      ]));
      setCategories(uniqueCategories);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addItem = async (newItem: Omit<Item, 'id' | 'createdAt'>) => {
    try {
      const created = await itemsService.create(newItem);
      setItems(prev => [created, ...prev]);
      // Si es categoría nueva, añadirla localmente
      if (!categories.includes(newItem.category)) {
        setCategories(prev => [...prev, newItem.category]);
      }
      return created;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<Omit<Item, 'id' | 'createdAt'>>) => {
    try {
      const updated = await itemsService.update(id, updates);
      setItems(prev => prev.map(i => i.id === id ? updated : i));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await itemsService.delete(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const addCategory = async (name: string, colorKey?: string) => {
    try {
      await categoriesService.create(name);
      if (colorKey) {
        const { saveCustomColor } = await import('../lib/colors');
        saveCustomColor(name, colorKey);
      }
      if (!categories.includes(name)) {
        setCategories(prev => [...prev, name]);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    items,
    categories,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    addCategory,
    refresh: fetchData
  };
}