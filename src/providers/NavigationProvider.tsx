import { createContext, useContext, type ReactNode } from 'react';

/**
 * Contract the consumer implements to let core-engine read/write URL state
 * and trigger navigation to resource pages, without depending on any specific
 * router. All URL-shape knowledge stays in the consumer.
 */
export interface NavigationAdapter {
  /**
   * Hook that returns the current query params plus a setter. Must be
   * implemented as a real React hook (it will be called from inside
   * core-engine hooks). Typical implementation wraps react-router-dom's
   * `useSearchParams`.
   */
  useQueryParams: () => [
    URLSearchParams,
    (next: Record<string, string>, opts?: { replace?: boolean }) => void,
  ];

  /** Navigate to a resource listing page. */
  navigateToList: (resourceId: string) => void;
  /** Navigate to a resource detail page. */
  navigateToDetail: (resourceId: string, entityId: string) => void;
  /** Navigate to a resource create page. */
  navigateToCreate: (resourceId: string) => void;
  /** Navigate to a resource edit page. */
  navigateToEdit: (resourceId: string, entityId: string) => void;
}

const NavigationContext = createContext<NavigationAdapter | null>(null);

export function NavigationProvider({
  adapter,
  children,
}: {
  adapter: NavigationAdapter;
  children: ReactNode;
}) {
  return <NavigationContext.Provider value={adapter}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationAdapter {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error(
      'useNavigation must be used within NavigationProvider. ' +
        'Pass a `navigation` adapter to <CoreProviders>.',
    );
  }
  return ctx;
}
