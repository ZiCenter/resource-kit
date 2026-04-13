import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/query-keys';
import type { LoadedResource, ConfirmActionDef, FormActionDef } from '../types/index';

export function useResourceAction(def: LoadedResource, action: ConfirmActionDef | FormActionDef) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entity, payload }: { entity: any; payload?: any }) => {
      return action.resolver(entity, payload);
    },
    onSuccess: (_data, variables) => {
      const entityId = def.getId(variables.entity);
      queryClient.invalidateQueries({
        queryKey: queryKeys.resourceDetail(def.resolvers.queryKey, entityId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.resource(def.resolvers.queryKey) });
    },
  });
}
