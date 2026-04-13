import type { ComponentType, ReactNode } from 'react';
import type { PathsOf } from './utility.types';
import type { FieldDef, FieldGroupDef } from '@zicenter/form-kit';
import type { TabResolver } from './resolver.types';

// ── Column Definition ──
export interface ColumnDef<TEntity = any> {
  key: PathsOf<TEntity>;
  label: string;
  type?: 'text' | 'currency' | 'date' | 'boolean' | 'status' | 'badge' | 'link';
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: string[] | (() => Promise<string[]>);
  width?: string;
  render?: (value: unknown, row: TEntity) => ReactNode;
  hidden?: boolean;
}

// ── Tab Definitions ──
interface TabDefBase<TEntity> {
  id: string;
  label: string;
  icon?: string;
  visible?: (entity: TEntity) => boolean;
  permission?: string;
}

export interface TableTabDef<TEntity, TSubResource = any> extends TabDefBase<TEntity> {
  type: 'table';
  columns: ColumnDef<TSubResource>[];
  resolver: TabResolver<TSubResource, TEntity>;
  actions?: SubResourceActionDef<TSubResource, TEntity>[];
}

// ── Sub-Resource Actions (row / toolbar) ──
interface SubResourceActionBase<TSub, TParent> {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'danger' | 'default';
  placement: 'toolbar' | 'row';
  visibleWhen?: (row: TSub | null, parent: TParent) => boolean;
}

export interface SubResourceConfirmActionDef<
  TSub = any,
  TParent = any,
> extends SubResourceActionBase<TSub, TParent> {
  type: 'confirm';
  confirm?: boolean | string;
  resolver: (parent: TParent, row: TSub | null) => Promise<any>;
  successMessage?: string;
}

export interface SubResourceFormActionDef<TSub = any, TParent = any> extends SubResourceActionBase<
  TSub,
  TParent
> {
  type: 'form';
  fields: FieldDef[] | ((row: TSub | null, parent: TParent) => FieldDef[]);
  initialValues?: (row: TSub | null, parent: TParent) => Record<string, any>;
  resolver: (parent: TParent, row: TSub | null, payload: any) => Promise<any>;
  successMessage?: string;
}

export type SubResourceActionDef<TSub = any, TParent = any> =
  | SubResourceConfirmActionDef<TSub, TParent>
  | SubResourceFormActionDef<TSub, TParent>;

export interface FieldsTabDef<TEntity> extends TabDefBase<TEntity> {
  type: 'fields';
  fields: FieldGroupDef[];
}

export interface ComponentTabDef<TEntity> extends TabDefBase<TEntity> {
  type: 'component';
  component: ComponentType<{ entity: TEntity }>;
}

export type TabDef<TEntity, TSubResource = any> =
  | TableTabDef<TEntity, TSubResource>
  | FieldsTabDef<TEntity>
  | ComponentTabDef<TEntity>;

// ── Action Definitions ──
export type ActionScope = 'row' | 'selection' | 'table';

interface ActionDefBase<TEntity> {
  id: string;
  label: string;
  icon?: string;
  section?: string;
  variant?: 'primary' | 'danger' | 'default';
  visibleWhen?: (entity: TEntity) => boolean;
  permission?: string;
  // Where the action is presented. 'row' (default) operates on a single entity,
  // 'selection' on a multi-row selection, 'table' on the whole list (no entity context).
  scope?: ActionScope;
}

// Variant 1: confirmation-only (no form, no component)
export interface ConfirmActionDef<TEntity = any> extends ActionDefBase<TEntity> {
  type: 'confirm';
  resolver: (entity: TEntity, payload?: any) => Promise<any>;
  confirm?: boolean | string;
}

// Variant 2: form-based (fields required)
export interface FormActionDef<TEntity = any> extends ActionDefBase<TEntity> {
  type: 'form';
  resolver: (entity: TEntity, payload?: any) => Promise<any>;
  fields: FieldDef[] | ((entity: TEntity) => FieldDef[]);
  confirm?: string;
}

// Variant 3: fully custom component (self-contained)
export interface ComponentActionDef<TEntity = any> extends ActionDefBase<TEntity> {
  type: 'component';
  component: ComponentType<{ entity: TEntity; onSuccess: () => void }>;
}

export type ActionDef<TEntity = any> =
  | ConfirmActionDef<TEntity>
  | FormActionDef<TEntity>
  | ComponentActionDef<TEntity>;

// ── Filter Definition ──
export interface FilterDefinition {
  key: string;
  label: string;
  type: 'select' | 'date-range' | 'text';
  options?: { label: string; value: string | number | boolean }[];
  templateKey?: string;
}

// ── Tab Section Extension Point ──
export interface TabSectionProps {
  entity: any;
  entityId: string;
  activeTabId: string | undefined;
  onSelectTab: (id: string) => void;
  resourceQueryKey: string;
}

export interface TabSection {
  Nav: ComponentType<TabSectionProps>;
  Content: ComponentType<TabSectionProps>;
}
