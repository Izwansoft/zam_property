import type { Role } from '@prisma/client';

const WILDCARD_ALL = '*:*';

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: [WILDCARD_ALL],
  TENANT_ADMIN: [
    'admin:*',
    'feature-flag:*',
    'tenant:*',
    'user:*',
    'vendor:*',
    'listing:*',
    'media:*',
    'interaction:*',
    'review:*',
    'subscription:*',
    'notification:*',
    'analytics:*',
    'search:*',
    'jobs:*',
  ],
  VENDOR_ADMIN: ['vendor:read', 'vendor:update', 'listing:*', 'media:*', 'interaction:*'],
  VENDOR_STAFF: [
    'vendor:read',
    'listing:read',
    'listing:create',
    'listing:update',
    'media:*',
    'interaction:*',
  ],
  CUSTOMER: [
    'listing:read',
    'search:read',
    'interaction:create',
    'review:create',
    'user:read',
    'user:update',
  ],
  GUEST: ['listing:read', 'search:read', 'vendor:read'],
};

export function getPermissionsForRole(role: Role): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

function isWildcardPermission(permission: string): boolean {
  return permission === '*' || permission === WILDCARD_ALL;
}

function matchesWildcard(granted: string, required: string): boolean {
  if (isWildcardPermission(granted)) {
    return true;
  }

  const [grantedResource, grantedAction] = granted.split(':', 2);
  const [requiredResource, requiredAction] = required.split(':', 2);

  if (!grantedResource || !grantedAction || !requiredResource || !requiredAction) {
    return false;
  }

  if (grantedResource === '*' && grantedAction === '*') {
    return true;
  }

  if (grantedResource === requiredResource && grantedAction === '*') {
    return true;
  }

  return false;
}

export function hasPermission(grantedPermissions: string[], requiredPermission: string): boolean {
  if (!requiredPermission || requiredPermission.trim().length === 0) {
    return true;
  }

  const required = requiredPermission.trim();

  for (const granted of grantedPermissions) {
    if (granted === required) {
      return true;
    }

    if (matchesWildcard(granted, required)) {
      return true;
    }
  }

  return false;
}
