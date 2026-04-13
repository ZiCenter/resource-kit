import { useMemo } from 'react';
import { usePermission } from './usePermission';
import type { LoadedResource } from '../resource';

/**
 * Computes detail header display state from a resource definition and entity.
 * Extracts title, subtitle, status, image and resolves edit/delete permissions.
 */
export function useDetailHeaderState(def: LoadedResource, entity: any) {
  const { has } = usePermission();

  return useMemo(() => {
    const title = def.header?.title(entity) ?? 'Untitled';
    const subtitle = def.header?.subtitle?.(entity) ?? null;
    const status = def.header?.status?.(entity) ?? null;
    const imageUrl = def.header?.image?.(entity) ?? null;

    const canEdit =
      !!(def.editForm || def.createForm) &&
      (!def.permissions?.update || has(def.permissions.update));

    const canDelete = !def.permissions?.delete || has(def.permissions.delete);

    return { title, subtitle, status, imageUrl, canEdit, canDelete };
  }, [def, entity, has]);
}
