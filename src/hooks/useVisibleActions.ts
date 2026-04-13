import { useMemo } from 'react';
import { usePermission } from './usePermission';
import type { LoadedResource } from '../resource';
import type { ActionDef } from '../types/display.types';

/**
 * Filters actions by visibility + permissions and synthesizes a delete action
 * if the resource has a delete resolver.
 */
export function useVisibleActions(def: LoadedResource, entity: any) {
  const { has } = usePermission();

  const actions = useMemo(() => {
    const visible: ActionDef[] =
      def.actions?.filter((a) => {
        if (a.visibleWhen && (!entity || !a.visibleWhen(entity))) return false;
        if (a.permission && !has(a.permission)) return false;
        return true;
      }) ?? [];

    const canDelete =
      !!def.resolvers.delete && (!def.permissions?.delete || has(def.permissions.delete));

    if (canDelete) {
      visible.push({
        type: 'confirm' as const,
        id: '_delete',
        label: 'Delete',
        variant: 'danger',
        icon: 'trash-2',
        section: 'Danger Zone',
        confirm: 'Are you sure? This action cannot be undone.',
        resolver: (entity: any) => def.resolvers.delete!(entity),
      });
    }

    return visible;
  }, [def, entity, has]);

  const deleteAction = useMemo(() => actions.find((a) => a.id === '_delete') ?? null, [actions]);

  const canDelete = deleteAction !== null;

  return { actions, canDelete, deleteAction };
}
