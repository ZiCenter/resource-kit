import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '../api/query-keys';
import type { LoadedResource, ListParams } from '../types/index';

interface UseResourceListParams extends ListParams {
  search?: string;
}

export function useResourceList(def: LoadedResource, params?: UseResourceListParams) {
  return useQuery({
    queryKey: def ? queryKeys.resourceList(def.resolvers.queryKey, params) : ['__invalid__'],
    queryFn: () => def.resolvers.list(params),
    enabled: !!def,
    placeholderData: keepPreviousData,
  });
}
