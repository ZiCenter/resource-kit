import { type ReactNode, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CoreComponentSlots } from '../contracts/component-slots.types';
import { FormFieldProvider, type FormFieldSlots } from '@zicenter/form-kit';
import type { ResourceManifestEntry } from '../types/index';
import type { NotificationAdapter } from './NotificationProvider';
import type { SearchAdapter } from '../search/search.types';
import type { NavigationAdapter } from './NavigationProvider';

import { defaultNotificationAdapter } from './default-notification';
import { SlotProvider } from './SlotProvider';
import { ManifestProvider } from './ManifestProvider';
import { NotificationProvider } from './NotificationProvider';
import { NavigationProvider } from './NavigationProvider';
import { PermissionsProvider } from './PermissionsProvider';
import { SearchProvider } from '../search/SearchProvider';
import { UIProvider } from '../layouts/UIContext';

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface CoreProvidersConfig {
  // ── Required (truly app-specific) ──

  /** Concrete UI component implementations matching CoreComponentSlots */
  slots: CoreComponentSlots;
  /** Concrete form field implementations matching FormFieldSlots */
  formFieldSlots: FormFieldSlots;
  /** Resource manifest for navigation metadata */
  manifest: Record<string, ResourceManifestEntry>;
  /** Navigation adapter — bridges the consumer's router to core-engine hooks */
  navigation: NavigationAdapter;

  // ── Optional (have sensible defaults) ──

  /** Toast/notification adapter. Defaults to console.log/console.error. */
  notification?: NotificationAdapter;
  /** TanStack Query client. Defaults to standard config (5min staleTime, 1 retry). */
  queryClient?: QueryClient;
  /** Optional search adapter. If omitted, SearchProvider is skipped. */
  search?: SearchAdapter;
  /** Permissions for the current user. Defaults to [] if omitted. */
  permissions?: string[];
}

/**
 * Convenience wrapper that nests all core-engine providers in the correct order.
 *
 * `slots`, `formFieldSlots`, `manifest`, and `navigation` are required.
 * Everything else has sensible defaults that can be overridden.
 *
 * Provider ordering (outermost → innermost):
 * 1. QueryClientProvider — TanStack Query cache
 * 2. UIProvider — Global UI state (command palette, search dialog, active module)
 * 3. SlotProvider — UI component implementations
 * 4. FormFieldProvider — Form field slot implementations
 * 5. ManifestProvider — Resource navigation metadata
 * 6. NavigationProvider — Router bridge (URL params + navigate-to-* callbacks)
 * 7. NotificationProvider — Toast/notification interface (defaults to console)
 * 8. PermissionsProvider — Current user's permission strings
 * 9. SearchProvider — Search adapter (optional, only if `search` provided)
 *
 * Because `NavigationAdapter.useQueryParams` is a real React hook, this
 * component must be mounted **inside** the consumer's router context.
 *
 * Individual providers remain exported for advanced consumers who need
 * custom ordering or partial provider stacks.
 */
export function CoreProviders({
  config,
  children,
}: {
  config: CoreProvidersConfig;
  children: ReactNode;
}) {
  const notification = useMemo(
    () => config.notification ?? defaultNotificationAdapter,
    [config.notification],
  );
  const qc = useMemo(() => config.queryClient ?? defaultQueryClient, [config.queryClient]);

  let inner: ReactNode = children;

  if (config.search) {
    inner = <SearchProvider adapter={config.search}>{inner}</SearchProvider>;
  }

  inner = (
    <PermissionsProvider permissions={config.permissions ?? []}>
      {inner}
    </PermissionsProvider>
  );

  inner = <NotificationProvider adapter={notification}>{inner}</NotificationProvider>;

  inner = <NavigationProvider adapter={config.navigation}>{inner}</NavigationProvider>;

  inner = <ManifestProvider manifest={config.manifest}>{inner}</ManifestProvider>;

  inner = (
    <FormFieldProvider slots={config.formFieldSlots} StepperWrapper={config.slots.FormStepWrapper}>
      {inner}
    </FormFieldProvider>
  );

  inner = <SlotProvider slots={config.slots}>{inner}</SlotProvider>;

  inner = <UIProvider>{inner}</UIProvider>;

  inner = <QueryClientProvider client={qc}>{inner}</QueryClientProvider>;

  return inner;
}
