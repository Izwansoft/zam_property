/**
 * Auth E2E Tests
 * Session 4.5 - Testing & E2E
 *
 * End-to-end tests for authentication flows including login, token refresh, and user info.
 *
 * Note: API returns standardized response format: { data: {...}, meta: {...} }
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { Role, UserStatus } from '@prisma/client';

import { AppModule } from '@/app.module';
import { PrismaService } from '@infrastructure/database';

/**
 * Helper to extract data from standardized API response
 * API returns: { data: {...}, meta: {...} } or just the data object for non-wrapped responses
 */
function getResponseData(body: unknown): Record<string, unknown> {
  if (typeof body === 'object' && body !== null && 'data' in body) {
    return (body as { data: Record<string, unknown> }).data;
  }
  return body as Record<string, unknown>;
}

describe('Auth E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testpartnerId: string;
  const testUserEmail = `e2e-auth-${Date.now()}@example.com`;
  const testUserPassword = 'TestPassword123!';
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

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

    app.setGlobalPrefix('api/v1');

    await app.init();

    prisma = app.get(PrismaService);

    // Create test partner - let DB generate UUID
    const partner = await prisma.partner.create({
      data: {
        name: 'E2E Auth Test Partner',
        slug: `e2e-auth-${Date.now()}`,
        enabledVerticals: ['real_estate'],
        settings: {
          create: {},
        },
      },
    });
    testpartnerId = partner.id;

    // Create test user
    const hashedPassword = await bcrypt.hash(testUserPassword, 10);
    const user = await prisma.user.create({
      data: {
        partnerId: testpartnerId,
        email: testUserEmail,
        passwordHash: hashedPassword,
        fullName: 'E2E Auth Test User',
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await prisma.user.deleteMany({ where: { partnerId: testpartnerId } });
      await prisma.partnerSettings.deleteMany({ where: { partnerId: testpartnerId } });
      await prisma.partner.delete({ where: { id: testpartnerId } });
    } catch {
      // Ignore cleanup errors
    }

    await app.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Partner-ID', testpartnerId)
        .send({
          email: testUserEmail,
          password: testUserPassword,
        });

      expect(response.status).toBe(200);
      const data = getResponseData(response.body);
      expect(data).toHaveProperty('accessToken');
      expect(data).toHaveProperty('refreshToken');
      expect(data).toHaveProperty('expiresIn');
      expect(data).toHaveProperty('user');
      expect((data.user as { email: string }).email).toBe(testUserEmail);
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Partner-ID', testpartnerId)
        .send({
          email: 'nonexistent@example.com',
          password: testUserPassword,
        });

      expect(response.status).toBe(401);
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Partner-ID', testpartnerId)
        .send({
          email: testUserEmail,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Partner-ID', testpartnerId)
        .send({
          password: testUserPassword,
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Partner-ID', testpartnerId)
        .send({
          email: testUserEmail,
        });

      expect(response.status).toBe(400);
    });

    it('should return 403 for suspended user', async () => {
      // Create suspended user
      const suspendedEmail = `suspended-${Date.now()}@example.com`;
      const hashedPassword = await bcrypt.hash(testUserPassword, 10);

      await prisma.user.create({
        data: {
          partnerId: testpartnerId,
          email: suspendedEmail,
          passwordHash: hashedPassword,
          fullName: 'Suspended User',
          role: Role.CUSTOMER,
          status: UserStatus.SUSPENDED,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Partner-ID', testpartnerId)
        .send({
          email: suspendedEmail,
          password: testUserPassword,
        });

      expect(response.status).toBe(403);
    });

    it('should normalize email to lowercase', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Partner-ID', testpartnerId)
        .send({
          email: testUserEmail.toUpperCase(),
          password: testUserPassword,
        });

      expect(response.status).toBe(200);
      const data = getResponseData(response.body);
      expect(data).toHaveProperty('accessToken');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // First login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Partner-ID', testpartnerId)
        .send({
          email: testUserEmail,
          password: testUserPassword,
        });

      const loginData = getResponseData(loginResponse.body);
      const refreshToken = loginData.refreshToken as string;

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('X-Partner-ID', testpartnerId)
        .send({
          refreshToken: refreshToken,
        });

      expect(response.status).toBe(200);
      const data = getResponseData(response.body);
      expect(data).toHaveProperty('accessToken');
      expect(data).toHaveProperty('expiresIn');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('X-Partner-ID', testpartnerId)
        .send({
          refreshToken: 'invalid-token',
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('X-Partner-ID', testpartnerId)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 401 when using access token as refresh token', async () => {
      // First login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Partner-ID', testpartnerId)
        .send({
          email: testUserEmail,
          password: testUserPassword,
        });

      const loginData = getResponseData(loginResponse.body);
      const accessToken = loginData.accessToken as string;

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('X-Partner-ID', testpartnerId)
        .send({
          refreshToken: accessToken, // Wrong token type
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/users/me', () => {
    it('should return current user with valid token', async () => {
      // Login first
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Partner-ID', testpartnerId)
        .send({
          email: testUserEmail,
          password: testUserPassword,
        });

      const loginData = getResponseData(loginResponse.body);
      const accessToken = loginData.accessToken as string;

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const data = getResponseData(response.body);
      expect(data).toHaveProperty('id', testUserId);
      expect(data).toHaveProperty('email', testUserEmail);
      expect(data).toHaveProperty('fullName');
    });

    it('should return 401 without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('X-Partner-ID', testpartnerId);

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should return 401 with malformed authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('X-Partner-ID', testpartnerId)
        .set('Authorization', 'invalid-format');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const newUserEmail = `new-user-${Date.now()}@example.com`;

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('X-Partner-ID', testpartnerId)
        .send({
          email: newUserEmail,
          password: 'NewUserPassword123!',
          fullName: 'New Test User',
        });

      expect(response.status).toBe(201);
      const data = getResponseData(response.body);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('email', newUserEmail);
    });

    it('should return 409 for duplicate email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('X-Partner-ID', testpartnerId)
        .send({
          email: testUserEmail,
          password: 'SomePassword123!',
          fullName: 'Duplicate User',
        });

      expect(response.status).toBe(409);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('X-Partner-ID', testpartnerId)
        .send({
          email: 'invalid-email',
          password: 'SomePassword123!',
          fullName: 'Test User',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('X-Partner-ID', testpartnerId)
        .send({
          email: 'test@example.com',
          // Missing password and fullName
        });

      expect(response.status).toBe(400);
    });
  });
});
