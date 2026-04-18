import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../api/query-keys';
import { useResourceDef } from '../providers/ResourceProvider';

export function useResource(id: string) {
  const def = useResourceDef();
  return useQuery({
    queryKey: queryKeys.resourceDetail(def.resolvers.queryKey, id),
    queryFn: () => def.resolvers.get(id),
    enabled: !!id,
  });
}
