/**
 * AuthService Unit Tests
 * Session 4.5 - Testing & E2E
 *
 * Unit tests for authentication service with mocked dependencies.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';

import { AuthService } from './auth.service';
import { PartnerContextService } from '@core/partner-context';
import { UserRepository } from '@core/user';
import { PrismaService } from '@infrastructure/database';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let _PartnerContextService: jest.Mocked<PartnerContextService>;
  let userRepository: jest.Mocked<UserRepository>;

  const mockUser = {
    id: 'user-123',
    partnerId: 'partner-123',
    email: 'test@example.com',
    passwordHash: '$2b$10$testhashedpassword',
    fullName: 'Test User',
    role: Role.CUSTOMER,
    status: UserStatus.ACTIVE,
    avatarUrl: null,
    phone: null,
    preferences: {},
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    // Set required environment variables
    process.env.JWT_ACCESS_TOKEN_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_TOKEN_SECRET = 'test-refresh-secret';
    process.env.JWT_ACCESS_TOKEN_TTL = '15m';
    process.env.JWT_REFRESH_TOKEN_TTL = '7d';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: PartnerContextService,
          useValue: {
            partnerId: 'partner-123',
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            userVendor: {
              findFirst: jest.fn().mockResolvedValue(null),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    _PartnerContextService = module.get(PartnerContextService);
    userRepository = module.get(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      // Mock bcrypt compare to return true
      const bcrypt = await import('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      userRepository.findByEmail.mockResolvedValue(mockUser);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(result).toHaveProperty('expiresIn');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const bcrypt = await import('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException for inactive user', async () => {
      userRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        status: UserStatus.SUSPENDED,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should normalize email to lowercase', async () => {
      const bcrypt = await import('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      userRepository.findByEmail.mockResolvedValue(mockUser);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      await service.login({
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      });

      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should include correct JWT payload', async () => {
      const bcrypt = await import('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      userRepository.findByEmail.mockResolvedValue(mockUser);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Check access token payload
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          partnerId: 'partner-123',
          role: mockUser.role,
          tokenType: 'access',
        }),
        expect.any(Object),
      );

      // Check refresh token payload
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          partnerId: 'partner-123',
          role: mockUser.role,
          tokenType: 'refresh',
        }),
        expect.any(Object),
      );
    });
  });

  describe('refresh', () => {
    const validPayload = {
      sub: 'user-123',
      partnerId: 'partner-123',
      role: Role.CUSTOMER,
      tokenType: 'refresh',
    };

    it('should return new access token for valid refresh token', async () => {
      jwtService.verifyAsync.mockResolvedValue(validPayload);
      jwtService.signAsync.mockResolvedValue('new-access-token');

      const result = await service.refresh({ refreshToken: 'valid-refresh-token' });

      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('expiresIn');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refresh({ refreshToken: 'invalid-token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for access token used as refresh', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        ...validPayload,
        tokenType: 'access', // Wrong token type
      });

      await expect(service.refresh({ refreshToken: 'access-token-as-refresh' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException for cross-partner token', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        ...validPayload,
        partnerId: 'different-partner', // Different partner
      });

      await expect(service.refresh({ refreshToken: 'cross-partner-token' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
