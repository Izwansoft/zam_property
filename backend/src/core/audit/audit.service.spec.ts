/**
 * AuditService Unit Tests
 * Session 4.5 - Testing & E2E
 *
 * Unit tests for audit logging service with mocked Prisma.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuditActorType } from '@prisma/client';

import { AuditService } from './audit.service';
import { PrismaService } from '@infrastructure/database';
import { AuditActionType, AuditTargetType, AuditLogFilters } from './types/audit.types';

describe('AuditService', () => {
  let service: AuditService;
  let prismaService: {
    auditLog: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
    };
  };

  const mockAuditLog = {
    id: 'audit-123',
    partnerId: 'partner-123',
    actorType: AuditActorType.USER,
    actorId: 'user-123',
    actorEmail: 'test@example.com',
    actionType: AuditActionType.USER_CREATED,
    targetType: AuditTargetType.USER,
    targetId: 'target-user-123',
    oldValue: null,
    newValue: { email: 'new@example.com', fullName: 'New User' },
    metadata: null,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    requestId: 'req-123',
    timestamp: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(async () => {
    prismaService = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logSync', () => {
    it('should create an audit log entry', async () => {
      prismaService.auditLog.create.mockResolvedValue(mockAuditLog);

      const result = await service.logSync({
        partnerId: 'partner-123',
        actorType: AuditActorType.USER,
        actorId: 'user-123',
        actorEmail: 'test@example.com',
        actionType: AuditActionType.USER_CREATED,
        targetType: AuditTargetType.USER,
        targetId: 'target-user-123',
        newValue: { email: 'new@example.com', fullName: 'New User' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        requestId: 'req-123',
      });

      expect(result).toHaveProperty('id', 'audit-123');
      expect(result).toHaveProperty('actionType', AuditActionType.USER_CREATED);
      expect(result).toHaveProperty('targetType', AuditTargetType.USER);
      expect(prismaService.auditLog.create).toHaveBeenCalledTimes(1);
    });

    it('should mask sensitive data in newValue', async () => {
      prismaService.auditLog.create.mockResolvedValue({
        ...mockAuditLog,
        newValue: { email: 'new@example.com', password: '[REDACTED]' },
      });

      await service.logSync({
        partnerId: 'partner-123',
        actorType: AuditActorType.USER,
        actorId: 'user-123',
        actionType: AuditActionType.USER_CREATED,
        targetType: AuditTargetType.USER,
        targetId: 'target-user-123',
        newValue: { email: 'new@example.com', password: 'secret123' },
      });

      // Check that create was called with masked data
      const createCall = prismaService.auditLog.create.mock.calls[0][0];
      expect(createCall.data.newValue.password).toBe('***REDACTED***');
    });

    it('should handle null values gracefully', async () => {
      prismaService.auditLog.create.mockResolvedValue({
        ...mockAuditLog,
        oldValue: null,
        newValue: null,
        metadata: null,
      });

      const result = await service.logSync({
        partnerId: 'partner-123',
        actorType: AuditActorType.SYSTEM,
        actionType: AuditActionType.SYSTEM_ERROR,
        targetType: AuditTargetType.SYSTEM,
      });

      expect(result).toBeDefined();
      expect(prismaService.auditLog.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('logCreate', () => {
    it('should create audit log for entity creation', async () => {
      prismaService.auditLog.create.mockResolvedValue(mockAuditLog);

      await service.logCreate(
        'partner-123',
        AuditActorType.USER,
        'user-123',
        AuditTargetType.USER,
        'new-user-123',
        { email: 'new@example.com', fullName: 'New User' },
        { actorEmail: 'admin@example.com', ipAddress: '192.168.1.1' },
      );

      // Give time for the async log to execute
      await new Promise((resolve) => setImmediate(resolve));

      expect(prismaService.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('logUpdate', () => {
    it('should create audit log for entity update with changed fields only', async () => {
      prismaService.auditLog.create.mockResolvedValue({
        ...mockAuditLog,
        actionType: 'user.updated',
        oldValue: { fullName: 'Old Name' },
        newValue: { fullName: 'New Name' },
      });

      await service.logUpdate(
        'partner-123',
        AuditActorType.USER,
        'user-123',
        AuditTargetType.USER,
        'target-user-123',
        { email: 'test@example.com', fullName: 'Old Name' },
        { email: 'test@example.com', fullName: 'New Name' },
        { actorEmail: 'admin@example.com' },
      );

      // Give time for the async log to execute
      await new Promise((resolve) => setImmediate(resolve));

      expect(prismaService.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      prismaService.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      prismaService.auditLog.count.mockResolvedValue(1);

      const filters: AuditLogFilters = {};
      const result = await service.findAll(filters, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      });
    });

    it('should filter by actorId', async () => {
      prismaService.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      prismaService.auditLog.count.mockResolvedValue(1);

      const filters: AuditLogFilters = { actorId: 'user-123' };
      await service.findAll(filters, 1, 20);

      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            actorId: 'user-123',
          }),
        }),
      );
    });

    it('should filter by date range', async () => {
      prismaService.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      prismaService.auditLog.count.mockResolvedValue(1);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const filters: AuditLogFilters = { startDate, endDate };
      await service.findAll(filters, 1, 20);

      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: {
              gte: startDate,
              lte: endDate,
            },
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return audit log by ID', async () => {
      prismaService.auditLog.findFirst.mockResolvedValue(mockAuditLog);

      const result = await service.findById('audit-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('audit-123');
      expect(prismaService.auditLog.findFirst).toHaveBeenCalled();
    });

    it('should return null for non-existent ID', async () => {
      prismaService.auditLog.findFirst.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getActionTypes', () => {
    it('should return distinct action types', async () => {
      prismaService.auditLog.findMany.mockResolvedValue([
        { actionType: AuditActionType.USER_CREATED },
        { actionType: AuditActionType.USER_UPDATED },
        { actionType: AuditActionType.AUTH_LOGIN },
      ]);

      const result = await service.getActionTypes();

      expect(result).toHaveLength(3);
      expect(result).toContain(AuditActionType.USER_CREATED);
      expect(result).toContain(AuditActionType.USER_UPDATED);
      expect(result).toContain(AuditActionType.AUTH_LOGIN);
    });
  });
});
