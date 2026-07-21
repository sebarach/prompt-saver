import { describe, it, expect, vi, beforeEach } from 'vitest';
import { itemsService } from '../services/items.service';

// ─── Mock supabase client ────────────────────────────────
const mockRpc = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

// ─── Sample data ─────────────────────────────────────────
const sampleRow = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: 'user-1',
  type: 'prompt' as const,
  category_id: 'cat-uuid-1',
  category_name: 'React',
  title: 'useEffect cleanup',
  content: 'Always return a cleanup function',
  description: 'Best practice for useEffect',
  tags: ['react', 'hooks'],
  is_deprecated: false,
  created_at: '2024-06-01T12:00:00Z',
};

describe('itemsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── getAll ──────────────────────────────────────────
  describe('getAll', () => {
    it('returns mapped items on success', async () => {
      mockRpc.mockResolvedValueOnce({ data: [sampleRow], error: null });

      const items = await itemsService.getAll();

      expect(mockRpc).toHaveBeenCalledWith('get_items');
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual({
        id: sampleRow.id,
        type: 'prompt',
        categoryId: 'cat-uuid-1',
        categoryName: 'React',
        title: 'useEffect cleanup',
        content: 'Always return a cleanup function',
        description: 'Best practice for useEffect',
        tags: ['react', 'hooks'],
        isDeprecated: false,
        createdAt: new Date('2024-06-01T12:00:00Z').getTime(),
      });
    });

    it('throws on supabase error', async () => {
      const err = { message: 'RLS denied', code: '42501' };
      mockRpc.mockResolvedValueOnce({ data: null, error: err });

      await expect(itemsService.getAll()).rejects.toEqual(err);
    });
  });

  // ─── create ──────────────────────────────────────────
  describe('create', () => {
    it('calls create_item RPC with correct params and returns mapped item', async () => {
      mockRpc.mockResolvedValueOnce({ data: sampleRow, error: null });

      const result = await itemsService.create({
        type: 'prompt',
        categoryId: 'cat-uuid-1',
        title: 'useEffect cleanup',
        content: 'Always return a cleanup function',
        description: 'Best practice for useEffect',
        tags: ['react', 'hooks'],
      });

      expect(mockRpc).toHaveBeenCalledWith('create_item', {
        p_type: 'prompt',
        p_title: 'useEffect cleanup',
        p_content: 'Always return a cleanup function',
        p_description: 'Best practice for useEffect',
        p_category_id: 'cat-uuid-1',
        p_tags: ['react', 'hooks'],
      });
      expect(result.id).toBe(sampleRow.id);
      expect(result.title).toBe('useEffect cleanup');
    });

    it('throws on supabase error', async () => {
      const err = { message: 'Validation failed', code: 'P0001' };
      mockRpc.mockResolvedValueOnce({ data: null, error: err });

      await expect(
        itemsService.create({
          type: 'prompt',
          categoryId: 'cat-uuid-1',
          title: '',
          content: 'x',
          tags: [],
        }),
      ).rejects.toEqual(err);
    });
  });

  // ─── update ──────────────────────────────────────────
  describe('update', () => {
    it('calls update_item RPC with correct params', async () => {
      const updatedRow = { ...sampleRow, title: 'Updated title' };
      mockRpc.mockResolvedValueOnce({ data: updatedRow, error: null });

      const result = await itemsService.update(sampleRow.id, { title: 'Updated title' });

      expect(mockRpc).toHaveBeenCalledWith('update_item', {
        p_id: sampleRow.id,
        p_title: 'Updated title',
        p_content: undefined,
        p_description: undefined,
        p_category_id: undefined,
        p_tags: undefined,
        p_is_deprecated: undefined,
      });
      expect(result.title).toBe('Updated title');
    });
  });

  // ─── delete ──────────────────────────────────────────
  describe('delete', () => {
    it('calls delete_item RPC', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });

      await itemsService.delete(sampleRow.id);

      expect(mockRpc).toHaveBeenCalledWith('delete_item', { p_id: sampleRow.id });
    });

    it('throws on not found', async () => {
      const err = { message: 'Item not found', code: 'P0002' };
      mockRpc.mockResolvedValueOnce({ data: null, error: err });

      await expect(itemsService.delete('non-existent')).rejects.toEqual(err);
    });
  });
});
