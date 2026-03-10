/**
 * Test Utilities — Render with Providers
 *
 * Custom render function that wraps components with all necessary providers
 * (QueryClient, AuthContext, Router) for testing.
 *
 * @example
 * ```tsx
 * import { renderWithProviders, mockUser } from '@/test/utils';
 *
 * test('renders listing card', () => {
 *   const { getByText } = renderWithProviders(<ListingCard listing={mockListing} />, {
 *     user: mockUser({ role: Role.VENDOR_ADMIN }),
 *   });
 *   expect(getByText('My Listing')).toBeInTheDocument();
 * });
 * ```
 *
 * @see docs/ai-prompt/part-18.md §18.3-18.4
 */

import React, { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, type AuthContextValue } from '@/modules/auth/context/auth-context';
import { Role, UserStatus, type User } from '@/modules/auth/types';

// ---------------------------------------------------------------------------
// Mock User Factory
// ---------------------------------------------------------------------------

export function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-001',
    email: 'test@example.com',
    fullName: 'Test User',
    phone: '+60123456789',
    role: Role.VENDOR_ADMIN,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    partnerId: 'tenant-001',
    primaryVendorId: 'vendor-001',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock Auth Context
// ---------------------------------------------------------------------------

export function mockAuthContext(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  const user = overrides.user !== undefined ? overrides.user : mockUser();
  return {
    user,
    status: user ? 'authenticated' : 'unauthenticated',
    isAuthenticated: !!user,
    isLoading: false,
    accessToken: user ? 'mock-access-token' : null,
    expiresAt: user ? Date.now() + 3600_000 : null,
    login: vi.fn().mockResolvedValue(user),
    register: vi.fn().mockResolvedValue(user),
    logout: vi.fn().mockResolvedValue(undefined),
    refreshSession: vi.fn().mockResolvedValue(true),
    hasRole: (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    hasPermission: vi.fn().mockReturnValue(true),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Query Client for Tests
// ---------------------------------------------------------------------------

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// AllProviders wrapper
// ---------------------------------------------------------------------------

interface ProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  authContext?: Partial<AuthContextValue>;
}

function AllProviders({ children, queryClient, authContext }: ProvidersProps) {
  const qc = queryClient ?? createTestQueryClient();
  const auth = mockAuthContext(authContext);

  return (
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Custom render
// ---------------------------------------------------------------------------

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  user?: User | null;
  authContext?: Partial<AuthContextValue>;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const { queryClient: qc, user, authContext, ...renderOptions } = options;
  const queryClient = qc ?? createTestQueryClient();

  // Build auth overrides
  const authOverrides: Partial<AuthContextValue> = { ...authContext };
  if (user !== undefined) {
    authOverrides.user = user;
  }

  const result = render(ui, {
    wrapper: ({ children }) => (
      <AllProviders queryClient={queryClient} authContext={authOverrides}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });

  return { ...result, queryClient };
}

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export { render, screen, waitFor, within, act } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
