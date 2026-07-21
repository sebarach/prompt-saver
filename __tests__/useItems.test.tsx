import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from './helpers';
import { useItems, useCreateItem, useUpdateItem, useDeleteItem } from '../hooks/useItems';
import type { Item } from '../types';

// ─── Mock the service layer ──────────────────────────────
const mockGetAll = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('../services/items.service', () => ({
  itemsService: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

const sampleItem: Item = {
  id: '123',
  type: 'prompt',
  categoryId: 'cat-1',
  categoryName: 'React',
  title: 'Test',
  content: 'Content',
  description: 'Desc',
  tags: ['tag1'],
  isDeprecated: false,
  createdAt: Date.now(),
};

describe('useItems hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── useItems ────────────────────────────────────────
  describe('useItems', () => {
    it('fetches items and returns data', async () => {
      mockGetAll.mockResolvedValueOnce([sampleItem]);

      const { result } = renderHookWithQuery(() => useItems());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([sampleItem]);
      expect(mockGetAll).toHaveBeenCalledTimes(1);
    });

    it('respects enabled: false', async () => {
      const { result } = renderHookWithQuery(() => useItems({ enabled: false }));

      // Should not fetch at all
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockGetAll).not.toHaveBeenCalled();
    });

    it('sets error state on failure', async () => {
      mockGetAll.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHookWithQuery(() => useItems());

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe('Network error');
    });
  });

  // ─── useCreateItem ──────────────────────────────────
  describe('useCreateItem', () => {
    it('calls itemsService.create and updates cache', async () => {
      const newItem = { ...sampleItem, id: '456' };
      mockCreate.mockResolvedValueOnce(newItem);
      // Pre-populate cache with initial fetch
      mockGetAll.mockResolvedValueOnce([sampleItem]);

      const { result, queryClient } = renderHookWithQuery(() => {
        const items = useItems();
        const create = useCreateItem();
        return { items, create };
      });

      // Wait for initial fetch
      await waitFor(() => expect(result.current.items.isSuccess).toBe(true));

      // Trigger mutation
      await result.current.create.mutateAsync({
        type: 'prompt',
        categoryId: 'cat-1',
        title: 'New',
        content: 'New content',
        tags: [],
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      // Cache should have been updated (prepend)
      const cached = queryClient.getQueryData<Item[]>(['items']);
      expect(cached).toBeDefined();
      expect(cached!.some((i) => i.id === '456')).toBe(true);
    });
  });

  // ─── useUpdateItem ──────────────────────────────────
  describe('useUpdateItem', () => {
    it('calls itemsService.update and patches cache', async () => {
      const updated = { ...sampleItem, title: 'Updated' };
      mockUpdate.mockResolvedValueOnce(updated);
      mockGetAll.mockResolvedValueOnce([sampleItem]);

      const { result, queryClient } = renderHookWithQuery(() => {
        const items = useItems();
        const update = useUpdateItem();
        return { items, update };
      });

      await waitFor(() => expect(result.current.items.isSuccess).toBe(true));

      await result.current.update.mutateAsync({
        id: sampleItem.id,
        updates: { title: 'Updated' },
      });

      expect(mockUpdate).toHaveBeenCalledWith(sampleItem.id, { title: 'Updated' });
      const cached = queryClient.getQueryData<Item[]>(['items']);
      expect(cached!.find((i) => i.id === sampleItem.id)?.title).toBe('Updated');
    });
  });

  // ─── useDeleteItem ──────────────────────────────────
  describe('useDeleteItem', () => {
    it('calls itemsService.delete and removes from cache', async () => {
      mockDelete.mockResolvedValueOnce(undefined);
      mockGetAll.mockResolvedValueOnce([sampleItem]);

      const { result, queryClient } = renderHookWithQuery(() => {
        const items = useItems();
        const del = useDeleteItem();
        return { items, del };
      });

      await waitFor(() => expect(result.current.items.isSuccess).toBe(true));

      await result.current.del.mutateAsync(sampleItem.id);

      expect(mockDelete).toHaveBeenCalledWith(sampleItem.id);
      const cached = queryClient.getQueryData<Item[]>(['items']);
      expect(cached!.find((i) => i.id === sampleItem.id)).toBeUndefined();
    });
  });
});
