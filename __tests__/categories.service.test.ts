import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categoriesService } from '../services/categories.service';

// ─── Mock supabase client ────────────────────────────────
const mockRpc = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

describe('categoriesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── getAll ──────────────────────────────────────────
  describe('getAll', () => {
    it('returns category names on success', async () => {
      const rows = [
        { id: '1', user_id: 'u1', name: 'Azure', created_at: '2024-01-01T00:00:00Z' },
        { id: '2', user_id: 'u1', name: 'Docker', created_at: '2024-01-02T00:00:00Z' },
      ];
      mockRpc.mockResolvedValueOnce({ data: rows, error: null });

      const names = await categoriesService.getAll();

      expect(mockRpc).toHaveBeenCalledWith('get_categories');
      expect(names).toEqual(['Azure', 'Docker']);
    });

    it('throws on supabase error', async () => {
      const err = { message: 'RLS denied', code: '42501' };
      mockRpc.mockResolvedValueOnce({ data: null, error: err });

      await expect(categoriesService.getAll()).rejects.toEqual(err);
    });
  });

  // ─── create ──────────────────────────────────────────
  describe('create', () => {
    it('calls create_category RPC and returns the name', async () => {
      const row = { id: '3', user_id: 'u1', name: 'Kubernetes', created_at: '2024-06-01T00:00:00Z' };
      mockRpc.mockResolvedValueOnce({ data: row, error: null });

      const name = await categoriesService.create('Kubernetes');

      expect(mockRpc).toHaveBeenCalledWith('create_category', { p_name: 'Kubernetes' });
      expect(name).toBe('Kubernetes');
    });

    it('throws on duplicate', async () => {
      const err = { message: 'Category already exists', code: 'P0003' };
      mockRpc.mockResolvedValueOnce({ data: null, error: err });

      await expect(categoriesService.create('Azure')).rejects.toEqual(err);
    });
  });
});
