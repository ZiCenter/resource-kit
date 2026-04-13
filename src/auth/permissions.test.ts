import { describe, it, expect } from 'vitest';
import { hasPermission, hasAnyPermission, hasAllPermissions } from './permissions';

describe('permissions', () => {
  const perms = ['READ_CLIENT', 'CREATE_CLIENT', 'READ_OFFICE'];

  it('checks single permission', () => {
    expect(hasPermission(perms, 'READ_CLIENT')).toBe(true);
    expect(hasPermission(perms, 'DELETE_CLIENT')).toBe(false);
  });

  it('ALL_FUNCTIONS bypasses all checks', () => {
    expect(hasPermission(['ALL_FUNCTIONS'], 'ANYTHING')).toBe(true);
    expect(hasAnyPermission(['ALL_FUNCTIONS'], ['A', 'B'])).toBe(true);
    expect(hasAllPermissions(['ALL_FUNCTIONS'], ['A', 'B'])).toBe(true);
  });

  it('checks any permission', () => {
    expect(hasAnyPermission(perms, ['READ_CLIENT', 'DELETE_CLIENT'])).toBe(true);
    expect(hasAnyPermission(perms, ['DELETE_CLIENT', 'UPDATE_CLIENT'])).toBe(false);
  });

  it('checks all permissions', () => {
    expect(hasAllPermissions(perms, ['READ_CLIENT', 'READ_OFFICE'])).toBe(true);
    expect(hasAllPermissions(perms, ['READ_CLIENT', 'DELETE_CLIENT'])).toBe(false);
  });
});
