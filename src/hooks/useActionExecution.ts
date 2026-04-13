import { useResourceAction } from './useResourceAction';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/query-keys';
import { useNotification } from '../providers/NotificationProvider';
import { AppError } from '../errors/errors';
import type { LoadedResource, ConfirmActionDef, FormActionDef } from '../types/index';

interface UseActionExecutionOptions {
  onSuccess?: () => void;
  onError?: (err: any) => void;
  onNavigateAway?: () => void;
}

export function useActionExecution(
  def: LoadedResource,
  action: ConfirmActionDef | FormActionDef,
  entity: any,
  options: UseActionExecutionOptions = {},
) {
  const mutation = useResourceAction(def, action);
  const queryClient = useQueryClient();
  const notification = useNotification();

  const execute = async (payload: any = {}) => {
    try {
      await mutation.mutateAsync({ entity, payload });
      const entityId = def.getId(entity);
      if (action.id === '_delete' && options.onNavigateAway) {
        options.onNavigateAway();
      } else {
        notification.success(`${action.label} completed`);
        queryClient.invalidateQueries({
          queryKey: queryKeys.resourceDetail(def.resolvers.queryKey, entityId),
        });
        options.onSuccess?.();
      }
    } catch (err: any) {
      const appError =
        err instanceof AppError ? err : new AppError(`Failed to ${action.label}`, { cause: err });
      notification.error(appError);
      options.onError?.(err);
    }
  };

  return { execute, isPending: mutation.isPending };
}
