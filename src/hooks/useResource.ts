import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../api/query-keys';
import type { LoadedResource } from '../types/index';

export function useResource(def: LoadedResource, id: string) {
  return useQuery({
    queryKey: def ? queryKeys.resourceDetail(def.resolvers.queryKey, id) : ['__invalid__'],
    queryFn: () => def.resolvers.get(id),
    enabled: !!def && !!id,
  });
}
