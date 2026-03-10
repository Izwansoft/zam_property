/**
 * Integration Tests — Auth Flow
 *
 * Tests login, token refresh, and user profile fetching through
 * the auth API module, with MSW intercepting network calls.
 *
 * These are "integration" tests because they exercise the API module →
 * axios client → MSW pipeline end-to-end inside Node/jsdom.
 *
 * @see modules/auth/api/auth-api.ts
 * @see lib/mocks/handlers/auth.ts
 * @see docs/ai-prompt/part-18.md §18.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/lib/mocks/server';
import { loginApi, refreshTokenApi, fetchCurrentUser, registerApi } from '@/modules/auth/api/auth-api';
import { normalizeError, isAuthError } from '@/lib/errors';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

// ---------------------------------------------------------------------------
// Login flow
// ---------------------------------------------------------------------------

describe('Auth API — login', () => {
  it('should return user and tokens on valid login', async () => {
    const result = await loginApi({
      email: 'vendor@zamproperty.com',
      password: 'any-password',
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('vendor@zamproperty.com');
    expect(result.user.role).toBe('VENDOR_ADMIN');
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.expiresIn).toBe(3600);
  });

  it('should throw on invalid credentials', async () => {
    try {
      await loginApi({
        email: 'nonexistent@example.com',
        password: 'wrong',
      });
      expect.fail('Should have thrown');
    } catch (err) {
      const appError = normalizeError(err);
      expect(appError.kind).toBe('auth');
      expect(appError.code).toBe('INVALID_CREDENTIALS');
      expect(isAuthError(appError)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Token refresh flow
// ---------------------------------------------------------------------------

describe('Auth API — token refresh', () => {
  it('should return new tokens on valid refresh', async () => {
    const result = await refreshTokenApi('mock-refresh-token-user-003');

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.expiresIn).toBe(3600);
  });

  it('should throw on invalid refresh token', async () => {
    try {
      await refreshTokenApi('invalid-token');
      expect.fail('Should have thrown');
    } catch (err) {
      const appError = normalizeError(err);
      expect(appError.kind).toBe('auth');
      expect(appError.code).toBe('TOKEN_INVALID');
    }
  });
});

// ---------------------------------------------------------------------------
// Register flow
// ---------------------------------------------------------------------------

describe('Auth API — register', () => {
  it('should create a new user', async () => {
    const user = await registerApi({
      email: 'new-user@example.com',
      password: 'StrongPass123!',
      fullName: 'New User',
      phone: '+60123456799',
    });

    expect(user.email).toBe('new-user@example.com');
    expect(user.fullName).toBe('New User');
    expect(user.role).toBe('CUSTOMER');
  });

  it('should throw on duplicate email', async () => {
    try {
      await registerApi({
        email: 'admin@zamproperty.com', // already exists in MSW mock
        password: 'StrongPass123!',
        fullName: 'Duplicate User',
      });
      expect.fail('Should have thrown');
    } catch (err) {
      const appError = normalizeError(err);
      expect(appError.code).toBe('CONFLICT');
    }
  });
});

// ---------------------------------------------------------------------------
// Server error handling
// ---------------------------------------------------------------------------

describe('Auth API — server error handling', () => {
  it('should normalize a 500 server error', async () => {
    server.use(
      http.post(`${API_BASE}/auth/login`, () => {
        return HttpResponse.json(
          {
            error: { code: 'INTERNAL_ERROR', message: 'Database down' },
            meta: { requestId: 'err-500', timestamp: new Date().toISOString() },
          },
          { status: 500 }
        );
      })
    );

    try {
      await loginApi({ email: 'any@test.com', password: 'x' });
      expect.fail('Should have thrown');
    } catch (err) {
      const appError = normalizeError(err);
      expect(appError.kind).toBe('server');
      expect(appError.code).toBe('INTERNAL_ERROR');
      expect(appError.requestId).toBe('err-500');
    }
  });

  it('should normalize a network error', async () => {
    server.use(
      http.post(`${API_BASE}/auth/login`, () => {
        return HttpResponse.error();
      })
    );

    try {
      await loginApi({ email: 'any@test.com', password: 'x' });
      expect.fail('Should have thrown');
    } catch (err) {
      const appError = normalizeError(err);
      expect(appError.kind).toBe('network');
      expect(appError.code).toBe('NETWORK_ERROR');
    }
  });

  it('should handle rate limiting', async () => {
    server.use(
      http.post(`${API_BASE}/auth/login`, () => {
        return HttpResponse.json(
          {
            error: { code: 'RATE_LIMIT_LOGIN', message: 'Too many login attempts' },
            meta: { requestId: 'err-429', timestamp: new Date().toISOString() },
          },
          { status: 429 }
        );
      })
    );

    try {
      await loginApi({ email: 'any@test.com', password: 'x' });
      expect.fail('Should have thrown');
    } catch (err) {
      const appError = normalizeError(err);
      expect(appError.kind).toBe('rate_limit');
      expect(appError.code).toBe('RATE_LIMIT_LOGIN');
    }
  });
});
