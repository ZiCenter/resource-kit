// ── Types (re-exported from @zicenter/form-kit) ──
export type {
  FieldDef,
  FieldGroupDef,
  DetailFieldDef,
  FormDef,
  StepComponentProps,
  InferFormValues,
} from '@zicenter/form-kit';

export { defineFields } from '@zicenter/form-kit';

export type {
  ColumnDef,
  TabDef,
  TableTabDef,
  ActionDef,
  ConfirmActionDef,
  FormActionDef,
  SubResourceActionDef,
  SubResourceConfirmActionDef,
  SubResourceFormActionDef,
  TabSectionProps,
  TabSection,
} from './types/display.types';

export { defineTableTab, defineFieldsTab, defineComponentTab } from './types/display.helpers';

export type {
  ResourceManifestEntry,
  ResourceListDefinition,
  ResourceHeaderDefinition,
} from './types/resource.types';

export type {
  ResourceResolvers,
  TabResolver,
  ListParams,
  NormalizedList,
} from './types/resolver.types';

export { Resource, LoadedResource } from './resource';

// ── API ──
export { queryKeys } from './api/query-keys';

// ── Errors ──
export { AppError, ValidationError, AuthenticationError } from './errors/errors';

// ── Hooks ──
export { useResource } from './hooks/useResource';
export { useResourceCreate, useResourceUpdate } from './hooks/useResourceMutation';
export { useActionExecution } from './hooks/useActionExecution';
export { usePermission } from './hooks/usePermission';
export { useSearch, useSearchHelpers } from './hooks/useSearch';
export type { SearchParams, SearchResult } from './hooks/useSearch';
export { useFormEngine } from '@zicenter/form-kit';
export { useVisibleActions } from './hooks/useVisibleActions';
export { useDetailHeaderState } from './hooks/useDetailHeaderState';
export { useVisibleTabs } from './hooks/useVisibleTabs';
export { useSubResourceTable } from './hooks/useSubResourceTable';
export { useResourceListPage } from './hooks/useResourceListPage';
export { useResourceFormDef } from './hooks/useResourceFormDef';

// ── Providers ──
export { SlotProvider, useSlots } from './providers/SlotProvider';
export { useNotification } from './providers/NotificationProvider';
export type { NotificationAdapter } from './providers/NotificationProvider';
export { CoreProviders } from './providers/CoreProviders';

// ── Contracts / Slots ──
export type {
  StepperContract,
  CoreComponentSlots,
  ActionPanelProps,
} from './contracts/component-slots.types';
export type { FormFieldRenderProps, FormFieldSlots } from '@zicenter/form-kit';

// ── Auth ──
export { useAuth } from './auth/auth-context';
export type { CoreAuthUser, AuthAdapter, SessionStorage } from './auth/auth.types';

// ── Search ──
export type { SearchAdapter } from './search/search.types';

// ── Navigation ──
export { NavigationProvider, useNavigation } from './providers/NavigationProvider';
export type { NavigationAdapter } from './providers/NavigationProvider';

// ── Registry ──
export { registerGroupLabels } from './registry/registry';

// ── Formatters ──
export { formatDate, toApiDate } from './formatters/date';
export { formatCurrency } from './formatters/currency';
export { formatRelativeTime } from './formatters/relative-time';
export { resolveFieldValue } from './formatters/field-value';

// ── Resource Data Store ──
export { ResourceDataStore } from './resource-data-store';

// ── Layouts ──
export { UIProvider, useUI } from './layouts/UIContext';

// ── Form engine (re-exported from @zicenter/form-kit) ──
export { FormEngine, FieldRenderer, mapRawOptions } from '@zicenter/form-kit';
