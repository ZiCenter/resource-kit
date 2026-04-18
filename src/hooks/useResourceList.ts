import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '../api/query-keys';
import type { ListParams } from '../types/index';
import { useResourceDef } from '../providers/ResourceProvider';

interface UseResourceListParams extends ListParams {
  search?: string;
}

export function useResourceList(params?: UseResourceListParams) {
  const def = useResourceDef();
  return useQuery({
    queryKey: queryKeys.resourceList(def.resolvers.queryKey, params),
    queryFn: () => def.resolvers.list(params),
    placeholderData: keepPreviousData,
  });
}
