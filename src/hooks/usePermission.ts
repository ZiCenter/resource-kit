import { useAuth } from '../auth/auth-context';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../auth/permissions';

export function usePermission() {
  const { user } = useAuth();
  const perms = user?.permissions ?? [];

  return {
    has: (permission: string) => hasPermission(perms, permission),
    hasAny: (permissions: string[]) => hasAnyPermission(perms, permissions),
    hasAll: (permissions: string[]) => hasAllPermissions(perms, permissions),
  };
}
