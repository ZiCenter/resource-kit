import { usePermissions } from '../providers/PermissionsProvider';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../auth/permissions';

export function usePermission() {
  const perms = usePermissions();

  return {
    has: (permission: string) => hasPermission(perms, permission),
    hasAny: (permissions: string[]) => hasAnyPermission(perms, permissions),
    hasAll: (permissions: string[]) => hasAllPermissions(perms, permissions),
  };
}
