import { useQuery } from '@tanstack/react-query';
import { useSearchAdapter } from '../search/SearchProvider';
import type { SearchParams, SearchResult } from '../search/search.types';

export type { SearchResult, SearchParams };

export function useSearch(params: SearchParams) {
  const adapter = useSearchAdapter();

  return useQuery({
    queryKey: ['search', params.query, params.resource, params.exactMatch],
    queryFn: () => adapter.search(params),
    enabled: params.query.length >= 2,
    staleTime: 30_000,
  });
}

export function useSearchHelpers() {
  const adapter = useSearchAdapter();

  const defaultGroupResults = (results: SearchResult[]): Record<string, SearchResult[]> => {
    const groups: Record<string, SearchResult[]> = {};
    for (const r of results) {
      const key = r.type ?? 'Other';
      (groups[key] ??= []).push(r);
    }
    return groups;
  };

  return {
    getEntityRoute: adapter.getEntityRoute.bind(adapter),
    getEntityTypeLabel: adapter.getEntityTypeLabel.bind(adapter),
    getEntityIcon: adapter.getEntityIcon?.bind(adapter) ?? (() => undefined),
    getResultSubtitle: adapter.getResultSubtitle?.bind(adapter) ?? (() => ''),
    groupResults: adapter.groupResults?.bind(adapter) ?? defaultGroupResults,
  };
}
