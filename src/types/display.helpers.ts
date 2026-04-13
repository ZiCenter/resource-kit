import type { TableTabDef, FieldsTabDef, ComponentTabDef } from './display.types';

export function defineTableTab<TEntity, TSubResource>(
  tab: Omit<TableTabDef<TEntity, TSubResource>, 'type'>,
): TableTabDef<TEntity, TSubResource> {
  return { ...tab, type: 'table' };
}

export function defineFieldsTab<TEntity>(
  tab: Omit<FieldsTabDef<TEntity>, 'type'>,
): FieldsTabDef<TEntity> {
  return { ...tab, type: 'fields' };
}

export function defineComponentTab<TEntity>(
  tab: Omit<ComponentTabDef<TEntity>, 'type'>,
): ComponentTabDef<TEntity> {
  return { ...tab, type: 'component' };
}
