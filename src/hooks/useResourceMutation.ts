import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/query-keys';
import type { LoadedResource } from '../types/index';

export function useResourceCreate(def: LoadedResource) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: { payload?: any }) => {
      if (!def.resolvers.create) throw new Error(`Resource "${def.id}" has no resolvers.create`);
      return await def.resolvers.create(variables.payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resource(def.resolvers.queryKey) });
    },
  });
}

export function useResourceUpdate(def: LoadedResource) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: { entity?: any; payload?: any }) => {
      if (!def.resolvers.update) throw new Error(`Resource "${def.id}" has no resolvers.update`);
      await def.resolvers.update(variables.entity, variables.payload);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resource(def.resolvers.queryKey) });
      if (variables.entity) {
        const entityId = def.getId(variables.entity);
        queryClient.invalidateQueries({
          queryKey: queryKeys.resourceDetail(def.resolvers.queryKey, entityId),
        });
      }
    },
  });
}
