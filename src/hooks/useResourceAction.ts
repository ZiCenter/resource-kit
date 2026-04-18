import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/query-keys';
import { useResourceDef } from '../providers/ResourceProvider';
import type { ConfirmActionDef, FormActionDef } from '../types/index';

export function useResourceAction(action: ConfirmActionDef | FormActionDef) {
  const def = useResourceDef();
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
