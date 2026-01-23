/**
 * Test Helpers & Utilities
 * Session 4.5 - Testing & E2E
 *
 * Shared utilities for testing across the application.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '@/app.module';
import { PrismaService } from '@infrastructure/database/prisma.service';

/**
 * Test constants
 */
export const TEST_TENANT = {
  id: 'test-tenant-id',
  slug: 'test-tenant',
  name: 'Test Tenant',
  subdomain: 'test',
};

export const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  fullName: 'Test User',
};

export const TEST_ADMIN = {
  email: 'admin@example.com',
  password: 'AdminPassword123!',
  fullName: 'Admin User',
};

/**
 * Create a test application with all configurations
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Apply same pipes as production
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Set global prefix
  app.setGlobalPrefix('api/v1');

  await app.init();

  return app;
}

/**
 * Clean up test database
 */
export async function cleanupDatabase(prisma: PrismaService): Promise<void> {
  // Delete in order to respect foreign key constraints
  const tablesToClean = [
    'audit_logs',
    'notification_preferences',
    'notifications',
    'notification_templates',
    'charge_events',
    'pricing_rules',
    'pricing_configs',
    'usage_counters',
    'entitlement_snapshots',
    'payment_events',
    'payment_methods',
    'invoices',
    'subscriptions',
    'plans',
    'reviews',
    'interaction_messages',
    'interactions',
    'listing_stats',
    'vendor_stats',
    'listing_media',
    'listings',
    'media',
    'vendor_profiles',
    'vendor_settings',
    'vendors',
    'users',
    'tenant_verticals',
    'tenant_domains',
    'tenant_settings',
    // Don't delete tenants or vertical_definitions as they're seeded
  ];

  for (const table of tablesToClean) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
    } catch {
      // Table might not exist or have no data
    }
  }
}

/**
 * Create a test request with tenant header
 */
export function testRequest(app: INestApplication, tenantId?: string) {
  const agent = request(app.getHttpServer());

  return {
    get: (url: string) => {
      const req = agent.get(`/api/v1${url}`);
      if (tenantId) {
        req.set('X-Tenant-ID', tenantId);
      }
      return req;
    },
    post: (url: string) => {
      const req = agent.post(`/api/v1${url}`);
      if (tenantId) {
        req.set('X-Tenant-ID', tenantId);
      }
      return req;
    },
    patch: (url: string) => {
      const req = agent.patch(`/api/v1${url}`);
      if (tenantId) {
        req.set('X-Tenant-ID', tenantId);
      }
      return req;
    },
    delete: (url: string) => {
      const req = agent.delete(`/api/v1${url}`);
      if (tenantId) {
        req.set('X-Tenant-ID', tenantId);
      }
      return req;
    },
  };
}

/**
 * Authenticated request helper
 */
export function authRequest(app: INestApplication, accessToken: string, tenantId?: string) {
  const base = testRequest(app, tenantId);

  return {
    get: (url: string) => base.get(url).set('Authorization', `Bearer ${accessToken}`),
    post: (url: string) => base.post(url).set('Authorization', `Bearer ${accessToken}`),
    patch: (url: string) => base.patch(url).set('Authorization', `Bearer ${accessToken}`),
    delete: (url: string) => base.delete(url).set('Authorization', `Bearer ${accessToken}`),
  };
}

/**
 * Generate random email for testing
 */
export function randomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate random string
 */
export function randomString(length: number = 8): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

/**
 * Wait for async operations
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract data from standard API response
 */
export function extractData<T>(response: request.Response): T {
  return response.body.data || response.body;
}

/**
 * Assert standard error response
 */
export function assertErrorResponse(
  response: request.Response,
  expectedStatus: number,
  expectedCode?: string,
): void {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('statusCode', expectedStatus);
  if (expectedCode) {
    expect(response.body).toHaveProperty('code', expectedCode);
  }
}

/**
 * Assert paginated response structure
 */
export function assertPaginatedResponse(response: request.Response): void {
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('data');
  expect(Array.isArray(response.body.data)).toBe(true);
  expect(response.body).toHaveProperty('meta');
  expect(response.body.meta).toHaveProperty('page');
  expect(response.body.meta).toHaveProperty('pageSize');
  expect(response.body.meta).toHaveProperty('totalItems');
  expect(response.body.meta).toHaveProperty('totalPages');
}
