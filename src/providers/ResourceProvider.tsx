import { createContext, useContext, type ReactNode } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { LoadedResource } from '../resource';

type ResourceLoader = (resourceId: string) => Promise<LoadedResource>;

export const ResourceLoaderContext = createContext<ResourceLoader>(() => {
  throw new Error('No loadResource function provided — wrap your app in CoreProviders');
});

const ResourceContext = createContext<LoadedResource | null>(null);

export function ResourceProvider({
  resourceId,
  children,
}: {
  resourceId: string;
  children: ReactNode;
}) {
  const loadResource = useContext(ResourceLoaderContext);
  const { data: def } = useSuspenseQuery({
    queryKey: ['__resource-def__', resourceId],
    queryFn: () => loadResource(resourceId),
    staleTime: Infinity,
  });
  return <ResourceContext.Provider value={def}>{children}</ResourceContext.Provider>;
}

export function useResourceDef(): LoadedResource {
  const def = useContext(ResourceContext);
  if (!def) throw new Error('useResourceDef must be called inside a ResourceProvider');
  return def;
}
