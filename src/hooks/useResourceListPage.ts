import { useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import { useResourceList } from './useResourceList';
import { usePermission } from './usePermission';
import type { LoadedResource } from '../resource';

/**
 * Wraps useResourceList with pagination state management and permission checks.
 */
export function useResourceListPage(def: LoadedResource) {
  const { has } = usePermission();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const listParams = {
    offset: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
  };

  const { data, isLoading, error } = useResourceList(def, listParams);

  const canCreate = !!def.createForm && (!def.permissions?.create || has(def.permissions.create));

  const totalCount = data?.totalCount ?? 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  return {
    data: data?.data ?? [],
    isLoading,
    error: error as Error | null,
    totalCount,
    pagination,
    onPaginationChange: setPagination,
    pageCount,
    canCreate,
  };
}
