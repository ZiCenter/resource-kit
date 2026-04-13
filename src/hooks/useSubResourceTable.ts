import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { PaginationState } from '@tanstack/react-table';
import { queryKeys } from '../api/query-keys';
import type { LoadedResource } from '../resource';
import type { TableTabDef } from '../types/display.types';
import type { NormalizedList } from '../types/resolver.types';

/**
 * Manages sub-resource table data: query, pagination, delete mutation,
 * and auto-injects a delete column if the tab resolver supports it.
 */
export function useSubResourceTable(def: LoadedResource, entity: any, tab: TableTabDef<any>) {
  const queryClient = useQueryClient();
  const entityId = def.getId(entity);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const listParams = {
    offset: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
  };

  const subQueryKey = [
    ...queryKeys.subResource(def.resolvers.queryKey, entityId, tab.id),
    listParams,
  ];

  const { data, isLoading } = useQuery({
    queryKey: subQueryKey,
    queryFn: () => tab.resolver.list(entity, listParams),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (row: any) => tab.resolver.delete!(entity, row),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subQueryKey }),
  });

  // Auto-detect paginated response
  const isPaginated = data != null && !Array.isArray(data) && 'totalCount' in data;
  const tableData = isPaginated ? (data as NormalizedList).data : Array.isArray(data) ? data : [];
  const totalCount = isPaginated ? (data as NormalizedList).totalCount : tableData.length;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  return {
    data: tableData,
    isLoading,
    pagination,
    onPaginationChange: setPagination,
    pageCount,
    totalCount,
    canDelete: !!tab.resolver.delete,
    deleteRow: (row: any) => deleteMutation.mutate(row),
    isDeleting: deleteMutation.isPending,
  };
}
