export function hasPermission(userPermissions: string[], required: string): boolean {
  if (userPermissions.includes('ALL_FUNCTIONS')) return true;
  return userPermissions.includes(required);
}

export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  if (userPermissions.includes('ALL_FUNCTIONS')) return true;
  return required.some((p) => userPermissions.includes(p));
}

export function hasAllPermissions(userPermissions: string[], required: string[]): boolean {
  if (userPermissions.includes('ALL_FUNCTIONS')) return true;
  return required.every((p) => userPermissions.includes(p));
}
