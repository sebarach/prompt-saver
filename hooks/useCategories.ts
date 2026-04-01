import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { categoriesService } from '../services/categories.service';

// ─── Query: fetch all categories ────────────────────────
export function useCategories(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoriesService.getAll(),
    enabled: options?.enabled ?? true,
  });
}

// ─── Mutation: create category ──────────────────────────
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => categoriesService.create(name),
    onSuccess: (created) => {
      queryClient.setQueryData<string[]>(queryKeys.categories.all, (old) =>
        old && !old.includes(created) ? [...old, created].sort() : old ?? [created],
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
