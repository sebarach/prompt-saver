import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { itemsService } from '../services/items.service';
import type { Item } from '../types';

export function useItems(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.items.all,
    queryFn: () => itemsService.getAll(),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newItem: Omit<Item, 'id' | 'createdAt' | 'categoryName'>) =>
      itemsService.create(newItem),
    onSuccess: (created) => {
      queryClient.setQueryData<Item[]>(queryKeys.items.all, (old) =>
        old ? [created, ...old] : [created],
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Item, 'id' | 'createdAt' | 'categoryName'>> }) =>
      itemsService.update(id, updates),
    onSuccess: (updated) => {
      queryClient.setQueryData<Item[]>(queryKeys.items.all, (old) =>
        old ? old.map((i) => (i.id === updated.id ? updated : i)) : [],
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itemsService.delete(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Item[]>(queryKeys.items.all, (old) =>
        old ? old.filter((i) => i.id !== id) : [],
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
    },
  });
}
