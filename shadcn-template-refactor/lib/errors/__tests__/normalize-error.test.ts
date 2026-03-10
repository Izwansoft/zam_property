/**
 * Unit Tests — Error Normalization
 *
 * Validates normalizeError() converts thrown values into AppError shape.
 * Covers AxiosError (with/without response), generic Error, and fallback.
 *
 * @see lib/errors/index.ts
 * @see docs/ai-prompt/part-18.md §18.3
 */

import { describe, it, expect } from 'vitest';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import {
  normalizeError,
  isAppError,
  extractFieldErrors,
  isAuthError,
  isRetryableError,
  type AppError,
  type FieldError,
} from '@/lib/errors';

// ---------------------------------------------------------------------------
// Helpers — create realistic AxiosError instances
// ---------------------------------------------------------------------------

function makeAxiosError(
  status: number,
  data?: unknown,
  message = 'Request failed'
): AxiosError {
  const config = { url: '/api/test' } as InternalAxiosRequestConfig;
  const response = {
    status,
    statusText: 'Error',
    data,
    headers: {},
    config,
  } as AxiosResponse;

  const err = new AxiosError(message, 'ERR_BAD_REQUEST', config, {}, response);
  return err;
}

function makeNetworkAxiosError(): AxiosError {
  const config = { url: '/api/test' } as InternalAxiosRequestConfig;
  return new AxiosError(
    'Network Error',
    'ERR_NETWORK',
    config,
    {},
    undefined // no response
  );
}

// ---------------------------------------------------------------------------
// normalizeError
// ---------------------------------------------------------------------------

describe('normalizeError', () => {
  describe('AxiosError with backend response body', () => {
    it('should extract code, message, kind from standard backend shape', () => {
      const err = makeAxiosError(422, {
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
        meta: { requestId: 'req-123', timestamp: new Date().toISOString() },
      });

      const result = normalizeError(err);

      expect(result.kind).toBe('validation');
      expect(result.code).toBe('VALIDATION_ERROR');
      expect(result.message).toBe('Invalid input');
      expect(result.status).toBe(422);
      expect(result.requestId).toBe('req-123');
    });

    it('should extract field errors from details', () => {
      const fieldErrors: FieldError[] = [
        { field: 'email', code: 'invalid_email', message: 'Invalid email format' },
        { field: 'password', code: 'too_short', message: 'Password too short' },
      ];

      const err = makeAxiosError(422, {
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: fieldErrors },
        meta: { requestId: 'req-456', timestamp: new Date().toISOString() },
      });

      const result = normalizeError(err);
      expect(result.fieldErrors).toEqual(fieldErrors);
    });

    it('should map AUTH_ codes to "auth" kind', () => {
      const err = makeAxiosError(401, {
        error: { code: 'AUTH_SESSION_EXPIRED', message: 'Session expired' },
        meta: { requestId: 'req-789', timestamp: new Date().toISOString() },
      });

      expect(normalizeError(err).kind).toBe('auth');
    });

    it('should map UNAUTHORIZED code to "auth" kind', () => {
      const err = makeAxiosError(401, {
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        meta: { requestId: 'req-x', timestamp: new Date().toISOString() },
      });

      expect(normalizeError(err).kind).toBe('auth');
    });

    it('should map FORBIDDEN code to "forbidden" kind', () => {
      const err = makeAxiosError(403, {
        error: { code: 'FORBIDDEN', message: 'Access denied' },
        meta: { requestId: 'req-y', timestamp: new Date().toISOString() },
      });

      expect(normalizeError(err).kind).toBe('forbidden');
    });

    it('should map PARTNER_ACCESS_DENIED to "forbidden" kind', () => {
      const err = makeAxiosError(403, {
        error: { code: 'PARTNER_ACCESS_DENIED', message: 'Partner mismatch' },
        meta: { requestId: 'req-z', timestamp: new Date().toISOString() },
      });

      expect(normalizeError(err).kind).toBe('forbidden');
    });

    it('should map _NOT_FOUND suffix to "not_found" kind', () => {
      const err = makeAxiosError(404, {
        error: { code: 'LISTING_NOT_FOUND', message: 'Listing not found' },
        meta: { requestId: 'req-nf', timestamp: new Date().toISOString() },
      });

      expect(normalizeError(err).kind).toBe('not_found');
    });

    it('should map RATE_LIMIT_ prefix to "rate_limit" kind', () => {
      const err = makeAxiosError(429, {
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
        meta: { requestId: 'req-rl', timestamp: new Date().toISOString() },
      });

      expect(normalizeError(err).kind).toBe('rate_limit');
    });

    it('should map INTERNAL_ERROR to "server" kind', () => {
      const err = makeAxiosError(500, {
        error: { code: 'INTERNAL_ERROR', message: 'Server error' },
        meta: { requestId: 'req-se', timestamp: new Date().toISOString() },
      });

      expect(normalizeError(err).kind).toBe('server');
    });

    it('should fallback to HTTP_{status} when body has no error shape', () => {
      const err = makeAxiosError(502, { html: '<html>Bad Gateway</html>' });

      const result = normalizeError(err);
      expect(result.kind).toBe('server');
      expect(result.code).toBe('HTTP_502');
      expect(result.status).toBe(502);
    });
  });

  describe('AxiosError without response (network error)', () => {
    it('should return network kind', () => {
      const err = makeNetworkAxiosError();
      const result = normalizeError(err);

      expect(result.kind).toBe('network');
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.message).toContain('connect');
    });
  });

  describe('generic Error', () => {
    it('should return unknown kind with error message', () => {
      const err = new Error('Something went wrong');
      const result = normalizeError(err);

      expect(result.kind).toBe('unknown');
      expect(result.code).toBe('UNKNOWN');
      expect(result.message).toBe('Something went wrong');
    });
  });

  describe('non-Error values', () => {
    it('should handle a plain string', () => {
      const result = normalizeError('oops');
      expect(result.kind).toBe('unknown');
      expect(result.code).toBe('UNKNOWN');
      expect(result.message).toBe('oops');
    });

    it('should handle null', () => {
      const result = normalizeError(null);
      expect(result.kind).toBe('unknown');
      expect(result.message).toBe('null');
    });

    it('should handle undefined', () => {
      const result = normalizeError(undefined);
      expect(result.kind).toBe('unknown');
      expect(result.message).toBe('undefined');
    });
  });

  describe('already an AppError', () => {
    it('should return the AppError unchanged', () => {
      const appError: AppError = {
        kind: 'validation',
        code: 'VALIDATION_ERROR',
        message: 'Bad input',
        status: 422,
      };

      const result = normalizeError(appError);
      expect(result).toBe(appError); // same reference
    });
  });
});

// ---------------------------------------------------------------------------
// isAppError
// ---------------------------------------------------------------------------

describe('isAppError', () => {
  it('should return true for a valid AppError', () => {
    expect(isAppError({ kind: 'auth', code: 'UNAUTHORIZED', message: 'No' })).toBe(true);
  });

  it('should return false for a plain object missing fields', () => {
    expect(isAppError({ kind: 'auth' })).toBe(false);
    expect(isAppError({})).toBe(false);
  });

  it('should return false for non-object values', () => {
    expect(isAppError(null)).toBe(false);
    expect(isAppError('string')).toBe(false);
    expect(isAppError(42)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// extractFieldErrors
// ---------------------------------------------------------------------------

describe('extractFieldErrors', () => {
  it('should convert fieldErrors to Record<string, string>', () => {
    const error: AppError = {
      kind: 'validation',
      code: 'VALIDATION_ERROR',
      message: 'Bad input',
      fieldErrors: [
        { field: 'email', code: 'format', message: 'Must be a valid email' },
        { field: 'name', code: 'required', message: 'Name is required' },
      ],
    };

    const result = extractFieldErrors(error);
    expect(result).toEqual({
      email: 'Must be a valid email',
      name: 'Name is required',
    });
  });

  it('should take the first message for duplicate fields', () => {
    const error: AppError = {
      kind: 'validation',
      code: 'VALIDATION_ERROR',
      message: 'Bad input',
      fieldErrors: [
        { field: 'email', code: 'format', message: 'Invalid format' },
        { field: 'email', code: 'taken', message: 'Already taken' },
      ],
    };

    const result = extractFieldErrors(error);
    expect(result).toEqual({ email: 'Invalid format' });
  });

  it('should return null when there are no field errors', () => {
    const error: AppError = {
      kind: 'server',
      code: 'INTERNAL_ERROR',
      message: 'Boom',
    };
    expect(extractFieldErrors(error)).toBeNull();
  });

  it('should return null for empty fieldErrors array', () => {
    const error: AppError = {
      kind: 'validation',
      code: 'VALIDATION_ERROR',
      message: 'Bad input',
      fieldErrors: [],
    };
    expect(extractFieldErrors(error)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isAuthError
// ---------------------------------------------------------------------------

describe('isAuthError', () => {
  it('should return true for auth kind', () => {
    expect(isAuthError({ kind: 'auth', code: 'UNAUTHORIZED', message: 'x' })).toBe(true);
  });

  it('should return false for other kinds', () => {
    expect(isAuthError({ kind: 'validation', code: 'VALIDATION_ERROR', message: 'x' })).toBe(false);
    expect(isAuthError({ kind: 'forbidden', code: 'FORBIDDEN', message: 'x' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isRetryableError
// ---------------------------------------------------------------------------

describe('isRetryableError', () => {
  it.each([
    ['server', true],
    ['network', true],
    ['rate_limit', true],
    ['auth', false],
    ['forbidden', false],
    ['validation', false],
    ['not_found', false],
    ['unknown', false],
  ] as const)('kind=%s → retryable=%s', (kind, expected) => {
    expect(isRetryableError({ kind, code: 'TEST', message: 'x' })).toBe(expected);
  });
});
