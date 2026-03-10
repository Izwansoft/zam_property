/**
 * Unit Tests — Permission Guards
 *
 * Tests usePermissions hook: canAccessPortal, isPlatformAdmin, isPartnerAdmin,
 * isVendorUser, isCustomer, and role-based access checks.
 *
 * Also tests the pure helper functions from auth/types: roleToPortal,
 * roleToDefaultPath, isRoleAtLeast.
 *
 * @see modules/auth/hooks/use-auth.ts
 * @see modules/auth/types/index.ts
 * @see docs/ai-prompt/part-18.md §18.3
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/modules/auth/context/auth-context';
import { usePermissions } from '@/modules/auth/hooks/use-auth';
import {
  Role,
  roleToPortal,
  roleToDefaultPath,
  isRoleAtLeast,
  PLATFORM_ROLES,
  PARTNER_ROLES,
  VENDOR_ROLES,
  CUSTOMER_ROLES,
  COMPANY_ADMIN_ROLES,
} from '@/modules/auth/types';
import { mockUser, mockAuthContext, createTestQueryClient } from '@/test/utils';

// ---------------------------------------------------------------------------
// Wrapper for renderHook — provides AuthContext + QueryClient
// ---------------------------------------------------------------------------

function createWrapper(role: Role) {
  const user = mockUser({ role });
  const auth = mockAuthContext({ user });

  return function Wrapper({ children }: { children: ReactNode }) {
    const qc = createTestQueryClient();
    return (
      <QueryClientProvider client={qc}>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// usePermissions — canAccessPortal
// ---------------------------------------------------------------------------

describe('usePermissions - canAccessPortal', () => {
  const portalAccessMatrix: Array<{
    role: Role;
    platform: boolean;
    partner: boolean;
    vendor: boolean;
    account: boolean;
    company: boolean;
  }> = [
    { role: Role.SUPER_ADMIN, platform: true, partner: true, vendor: false, account: true, company: false },
    { role: Role.PARTNER_ADMIN, platform: false, partner: true, vendor: false, account: true, company: false },
    { role: Role.VENDOR_ADMIN, platform: false, partner: false, vendor: true, account: true, company: false },
    { role: Role.VENDOR_STAFF, platform: false, partner: false, vendor: true, account: true, company: false },
    { role: Role.CUSTOMER, platform: false, partner: false, vendor: false, account: true, company: false },
    { role: Role.GUEST, platform: false, partner: false, vendor: false, account: true, company: false },
    { role: Role.COMPANY_ADMIN, platform: false, partner: false, vendor: false, account: true, company: true },
    { role: Role.AGENT, platform: false, partner: false, vendor: false, account: true, company: false },
  ];

  it.each(portalAccessMatrix)(
    '$role → platform=$platform, partner=$partner, vendor=$vendor, account=$account, company=$company',
    ({ role, platform, partner, vendor, account, company }) => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(role),
      });

      expect(result.current.canAccessPortal('platform')).toBe(platform);
      expect(result.current.canAccessPortal('partner')).toBe(partner);
      expect(result.current.canAccessPortal('vendor')).toBe(vendor);
      expect(result.current.canAccessPortal('account')).toBe(account);
      expect(result.current.canAccessPortal('company')).toBe(company);
    }
  );
});

// ---------------------------------------------------------------------------
// usePermissions — boolean flags
// ---------------------------------------------------------------------------

describe('usePermissions - boolean flags', () => {
  it('SUPER_ADMIN should be isPlatformAdmin', () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(Role.SUPER_ADMIN),
    });
    expect(result.current.isPlatformAdmin).toBe(true);
    expect(result.current.isPartnerAdmin).toBe(false);
    expect(result.current.isVendorUser).toBe(false);
    expect(result.current.isCustomer).toBe(false);
  });

  it('PARTNER_ADMIN should be isPartnerAdmin', () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(Role.PARTNER_ADMIN),
    });
    expect(result.current.isPlatformAdmin).toBe(false);
    expect(result.current.isPartnerAdmin).toBe(true);
  });

  it('VENDOR_ADMIN should be isVendorUser', () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(Role.VENDOR_ADMIN),
    });
    expect(result.current.isVendorUser).toBe(true);
  });

  it('VENDOR_STAFF should be isVendorUser', () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(Role.VENDOR_STAFF),
    });
    expect(result.current.isVendorUser).toBe(true);
  });

  it('CUSTOMER should be isCustomer', () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(Role.CUSTOMER),
    });
    expect(result.current.isCustomer).toBe(true);
  });

  it('COMPANY_ADMIN should be isCompanyAdmin', () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(Role.COMPANY_ADMIN),
    });
    expect(result.current.isCompanyAdmin).toBe(true);
    expect(result.current.isVendorUser).toBe(false);
  });

  it('should expose the current role', () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(Role.PARTNER_ADMIN),
    });
    expect(result.current.role).toBe(Role.PARTNER_ADMIN);
  });
});

// ---------------------------------------------------------------------------
// Pure helpers — roleToPortal, roleToDefaultPath
// ---------------------------------------------------------------------------

describe('roleToPortal', () => {
  it.each([
    [Role.SUPER_ADMIN, 'platform'],
    [Role.PARTNER_ADMIN, 'partner'],
    [Role.VENDOR_ADMIN, 'vendor'],
    [Role.VENDOR_STAFF, 'vendor'],
    [Role.CUSTOMER, 'account'],
    [Role.GUEST, 'account'],
    [Role.COMPANY_ADMIN, 'company'],
    [Role.AGENT, 'agent'],
  ] as const)('%s → %s', (role, portal) => {
    expect(roleToPortal(role)).toBe(portal);
  });
});

describe('roleToDefaultPath', () => {
  it.each([
    [Role.SUPER_ADMIN, '/dashboard/platform'],
    [Role.PARTNER_ADMIN, '/dashboard/partner'],
    [Role.VENDOR_ADMIN, '/dashboard/vendor'],
    [Role.VENDOR_STAFF, '/dashboard/vendor'],
    [Role.CUSTOMER, '/dashboard/account'],
    [Role.COMPANY_ADMIN, '/dashboard/company'],
    [Role.AGENT, '/dashboard/agent'],
  ] as const)('%s → %s', (role, path) => {
    expect(roleToDefaultPath(role)).toBe(path);
  });
});

// ---------------------------------------------------------------------------
// isRoleAtLeast
// ---------------------------------------------------------------------------

describe('isRoleAtLeast', () => {
  it('SUPER_ADMIN is at least any role', () => {
    expect(isRoleAtLeast(Role.SUPER_ADMIN, Role.GUEST)).toBe(true);
    expect(isRoleAtLeast(Role.SUPER_ADMIN, Role.SUPER_ADMIN)).toBe(true);
  });

  it('CUSTOMER is at least GUEST but not VENDOR_STAFF', () => {
    expect(isRoleAtLeast(Role.CUSTOMER, Role.GUEST)).toBe(true);
    expect(isRoleAtLeast(Role.CUSTOMER, Role.VENDOR_STAFF)).toBe(false);
  });

  it('GUEST is at least GUEST only', () => {
    expect(isRoleAtLeast(Role.GUEST, Role.GUEST)).toBe(true);
    expect(isRoleAtLeast(Role.GUEST, Role.CUSTOMER)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Role groupings
// ---------------------------------------------------------------------------

describe('role groupings', () => {
  it('PLATFORM_ROLES contains only SUPER_ADMIN', () => {
    expect(PLATFORM_ROLES).toContain(Role.SUPER_ADMIN);
    expect(PLATFORM_ROLES).toHaveLength(1);
  });

  it('PARTNER_ROLES contains only PARTNER_ADMIN', () => {
    expect(PARTNER_ROLES).toContain(Role.PARTNER_ADMIN);
    expect(PARTNER_ROLES).toHaveLength(1);
  });

  it('VENDOR_ROLES contains VENDOR_ADMIN and VENDOR_STAFF', () => {
    expect(VENDOR_ROLES).toContain(Role.VENDOR_ADMIN);
    expect(VENDOR_ROLES).toContain(Role.VENDOR_STAFF);
    expect(VENDOR_ROLES).toHaveLength(2);
  });

  it('CUSTOMER_ROLES contains only CUSTOMER', () => {
    expect(CUSTOMER_ROLES).toContain(Role.CUSTOMER);
    expect(CUSTOMER_ROLES).toHaveLength(1);
  });

  it('COMPANY_ADMIN_ROLES contains only COMPANY_ADMIN', () => {
    expect(COMPANY_ADMIN_ROLES).toContain(Role.COMPANY_ADMIN);
    expect(COMPANY_ADMIN_ROLES).toHaveLength(1);
  });
});
