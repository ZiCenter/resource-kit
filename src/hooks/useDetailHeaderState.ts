import { useMemo } from 'react';
import { usePermission } from './usePermission';
import { useResourceDef } from '../providers/ResourceProvider';

export function useDetailHeaderState(entity: any) {
  const def = useResourceDef();
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
