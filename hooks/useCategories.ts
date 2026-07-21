import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { categoriesService } from '../services/categories.service';
import type { Category } from '../types';

export function useCategories(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoriesService.getAll(),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => categoriesService.create(name),
    onSuccess: (created) => {
      queryClient.setQueryData<Category[]>(queryKeys.categories.all, (old) =>
        old && !old.some((c) => c.id === created.id)
          ? [...old, created].sort((a, b) => a.name.localeCompare(b.name))
          : old ?? [created],
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
