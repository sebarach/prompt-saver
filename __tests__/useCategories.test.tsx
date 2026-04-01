import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from './helpers';
import { useCategories, useCreateCategory } from '../hooks/useCategories';

// ─── Mock the service layer ──────────────────────────────
const mockGetAll = vi.fn();
const mockCreate = vi.fn();

vi.mock('../services/categories.service', () => ({
  categoriesService: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
    create: (...args: unknown[]) => mockCreate(...args),
  },
}));

describe('useCategories hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── useCategories ──────────────────────────────────
  describe('useCategories', () => {
    it('fetches categories and returns string array', async () => {
      mockGetAll.mockResolvedValueOnce(['Azure', 'Docker', 'React']);

      const { result } = renderHookWithQuery(() => useCategories());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(['Azure', 'Docker', 'React']);
      expect(mockGetAll).toHaveBeenCalledTimes(1);
    });

    it('respects enabled: false', async () => {
      const { result } = renderHookWithQuery(() => useCategories({ enabled: false }));

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockGetAll).not.toHaveBeenCalled();
    });

    it('sets error state on failure', async () => {
      mockGetAll.mockRejectedValueOnce(new Error('Connection refused'));

      const { result } = renderHookWithQuery(() => useCategories());

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe('Connection refused');
    });
  });

  // ─── useCreateCategory ──────────────────────────────
  describe('useCreateCategory', () => {
    it('calls categoriesService.create and updates cache', async () => {
      mockCreate.mockResolvedValueOnce('Kubernetes');
      mockGetAll.mockResolvedValueOnce(['Azure', 'Docker']);

      const { result, queryClient } = renderHookWithQuery(() => {
        const categories = useCategories();
        const create = useCreateCategory();
        return { categories, create };
      });

      await waitFor(() => expect(result.current.categories.isSuccess).toBe(true));

      await result.current.create.mutateAsync('Kubernetes');

      expect(mockCreate).toHaveBeenCalledWith('Kubernetes');

      const cached = queryClient.getQueryData<string[]>(['categories']);
      expect(cached).toBeDefined();
      expect(cached).toContain('Kubernetes');
    });

    it('does not duplicate existing category in cache', async () => {
      mockCreate.mockResolvedValueOnce('Azure');
      mockGetAll.mockResolvedValueOnce(['Azure', 'Docker']);

      const { result, queryClient } = renderHookWithQuery(() => {
        const categories = useCategories();
        const create = useCreateCategory();
        return { categories, create };
      });

      await waitFor(() => expect(result.current.categories.isSuccess).toBe(true));

      await result.current.create.mutateAsync('Azure');

      const cached = queryClient.getQueryData<string[]>(['categories']);
      const azureCount = cached!.filter((c) => c === 'Azure').length;
      expect(azureCount).toBe(1);
    });
  });
});
