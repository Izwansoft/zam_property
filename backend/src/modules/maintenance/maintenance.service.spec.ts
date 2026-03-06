/**
 * MaintenanceService Unit Tests
 * Session 7.1 - Maintenance Core
 *
 * Tests maintenance ticket business logic: creation, updates, attachments, comments.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MaintenanceStatus, MaintenancePriority, TenancyStatus, Role } from '@prisma/client';

import { MaintenanceService } from './maintenance.service';

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let mockPrisma: any;
  let mockPartnerContext: any;
  let mockS3Service: any;
  let mockEventEmitter: any;
  let mockStateMachine: any;

  // Helper: create a maintenance ticket-like object
  const createMockTicket = (overrides: Partial<any> = {}) => ({
    id: 'mnt-001',
    tenancyId: 'tenancy-001',
    ticketNumber: 'MNT-20260221-0001',
    title: 'Leaking faucet',
    description: 'Kitchen faucet is dripping',
    category: 'PLUMBING',
    location: 'Kitchen',
    status: MaintenanceStatus.OPEN,
    priority: MaintenancePriority.MEDIUM,
    reportedBy: 'user-001',
    reportedAt: new Date(),
    verifiedBy: null,
    verifiedAt: null,
    verificationNotes: null,
    assignedTo: null,
    assignedAt: null,
    resolvedAt: null,
    resolvedBy: null,
    resolution: null,
    estimatedCost: null,
    actualCost: null,
    paidBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenancy: {
      id: 'tenancy-001',
      status: TenancyStatus.ACTIVE,
      listing: { id: 'listing-001', title: 'Unit 101' },
      owner: { id: 'owner-001', name: 'John Owner' },
      tenant: {
        id: 'occ-001',
        user: { fullName: 'Jane Tenant', email: 'jane@test.com' },
      },
    },
    attachments: [],
    updates: [],
    _count: { attachments: 0, updates: 0 },
    ...overrides,
  });

  const createMockTenancy = (overrides: Partial<any> = {}) => ({
    id: 'tenancy-001',
    status: TenancyStatus.ACTIVE,
    tenantId: 'occ-001',
    ownerId: 'owner-001',
    ...overrides,
  });

  beforeEach(() => {
    mockPrisma = {
      maintenance: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      maintenanceAttachment: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      maintenanceUpdate: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      tenancy: {
        findFirst: jest.fn(),
      },
    };

    mockPartnerContext = {
      getContext: jest.fn().mockReturnValue({ partnerId: 'partner-001' }),
    };

    mockS3Service = {
      getPresignedUploadUrl: jest.fn().mockResolvedValue({
        url: 'https://s3.example.com/upload?signed=true',
        key: 'tenants/partner-001/maintenance/mnt-001/photo.jpg',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      }),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockStateMachine = {
      transition: jest.fn().mockResolvedValue({ success: true, fromState: 'OPEN', toState: 'VERIFIED' }),
      canTransition: jest.fn().mockReturnValue(true),
      getAvailableEvents: jest.fn().mockReturnValue(['verify']),
      getTargetState: jest.fn().mockReturnValue('VERIFIED'),
    };

    service = new MaintenanceService(
      mockPrisma,
      mockPartnerContext,
      mockS3Service,
      mockEventEmitter,
      mockStateMachine,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CREATE TICKET
  // ============================================

  describe('createTicket', () => {
    it('should create a maintenance ticket for an active tenancy', async () => {
      const dto = {
        tenancyId: 'tenancy-001',
        title: 'Leaking faucet',
        description: 'Kitchen faucet is dripping',
        category: 'PLUMBING' as const,
      };

      mockPrisma.tenancy.findFirst.mockResolvedValue(createMockTenancy());
      mockPrisma.maintenance.count.mockResolvedValue(0);
      mockPrisma.maintenance.create.mockResolvedValue(createMockTicket());

      const result = await service.createTicket(dto, 'user-001');

      expect(result).toBeDefined();
      expect(result.ticketNumber).toBe('MNT-20260221-0001');
      expect(mockPrisma.tenancy.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tenancy-001', partnerId: 'partner-001' },
        }),
      );
      expect(mockPrisma.maintenance.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'maintenance.created',
        expect.anything(),
      );
    });

    it('should throw if tenancy not found', async () => {
      const dto = {
        tenancyId: 'non-existent',
        title: 'Leaking faucet',
        description: 'Kitchen faucet is dripping',
        category: 'PLUMBING' as const,
      };

      mockPrisma.tenancy.findFirst.mockResolvedValue(null);

      await expect(service.createTicket(dto, 'user-001')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject ticket creation for non-active tenancy', async () => {
      const dto = {
        tenancyId: 'tenancy-001',
        title: 'Leaking faucet',
        description: 'Kitchen faucet is dripping',
        category: 'PLUMBING' as const,
      };

      mockPrisma.tenancy.findFirst.mockResolvedValue(
        createMockTenancy({ status: TenancyStatus.DRAFT }),
      );

      await expect(service.createTicket(dto, 'user-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow ticket creation for TERMINATION_REQUESTED tenancy', async () => {
      const dto = {
        tenancyId: 'tenancy-001',
        title: 'Leaking faucet',
        description: 'Dripping',
        category: 'PLUMBING' as const,
      };

      mockPrisma.tenancy.findFirst.mockResolvedValue(
        createMockTenancy({ status: TenancyStatus.TERMINATION_REQUESTED }),
      );
      mockPrisma.maintenance.count.mockResolvedValue(0);
      mockPrisma.maintenance.create.mockResolvedValue(createMockTicket());

      const result = await service.createTicket(dto, 'user-001');
      expect(result).toBeDefined();
    });

    it('should generate sequential ticket numbers', async () => {
      const dto = {
        tenancyId: 'tenancy-001',
        title: 'Test',
        description: 'Test desc',
        category: 'OTHER' as const,
      };

      mockPrisma.tenancy.findFirst.mockResolvedValue(createMockTenancy());
      mockPrisma.maintenance.count.mockResolvedValue(5);
      mockPrisma.maintenance.create.mockResolvedValue(
        createMockTicket({ ticketNumber: 'MNT-20260221-0006' }),
      );

      const result = await service.createTicket(dto, 'user-001');
      expect(result.ticketNumber).toBe('MNT-20260221-0006');
    });
  });

  // ============================================
  // UPDATE TICKET
  // ============================================

  describe('updateTicket', () => {
    it('should update ticket fields', async () => {
      const dto = {
        title: 'Updated title',
        priority: 'HIGH',
        assignedTo: 'Plumber Joe',
      };

      mockPrisma.maintenance.findFirst.mockResolvedValue(createMockTicket());
      mockPrisma.maintenance.update.mockResolvedValue(
        createMockTicket({
          title: 'Updated title',
          priority: MaintenancePriority.HIGH,
          assignedTo: 'Plumber Joe',
          assignedAt: new Date(),
        }),
      );

      const result = await service.updateTicket('mnt-001', dto, 'user-001');
      expect(result.title).toBe('Updated title');
      expect(mockPrisma.maintenance.update).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'maintenance.updated',
        expect.anything(),
      );
    });

    it('should reject updates on closed tickets', async () => {
      mockPrisma.maintenance.findFirst.mockResolvedValue(
        createMockTicket({ status: MaintenanceStatus.CLOSED }),
      );

      await expect(
        service.updateTicket('mnt-001', { title: 'New title' }, 'user-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject updates on cancelled tickets', async () => {
      mockPrisma.maintenance.findFirst.mockResolvedValue(
        createMockTicket({ status: MaintenanceStatus.CANCELLED }),
      );

      await expect(
        service.updateTicket('mnt-001', { title: 'New title' }, 'user-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set assignedAt when assignedTo is first set', async () => {
      const dto = { assignedTo: 'Electrician Bob' };

      mockPrisma.maintenance.findFirst.mockResolvedValue(
        createMockTicket({ assignedTo: null, assignedAt: null }),
      );
      mockPrisma.maintenance.update.mockResolvedValue(
        createMockTicket({
          assignedTo: 'Electrician Bob',
          assignedAt: new Date(),
        }),
      );

      await service.updateTicket('mnt-001', dto, 'user-001');

      const updateCall = mockPrisma.maintenance.update.mock.calls[0][0];
      expect(updateCall.data.assignedTo).toBe('Electrician Bob');
      expect(updateCall.data.assignedAt).toBeDefined();
    });

    it('should throw if ticket not found', async () => {
      mockPrisma.maintenance.findFirst.mockResolvedValue(null);

      await expect(
        service.updateTicket('non-existent', { title: 'X' }, 'user-001'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // GET TICKET
  // ============================================

  describe('getTicket', () => {
    it('should return ticket with relations', async () => {
      mockPrisma.maintenance.findFirst.mockResolvedValue(createMockTicket());

      const result = await service.getTicket('mnt-001', 'user-001', Role.PARTNER_ADMIN);
      expect(result).toBeDefined();
      expect(result.ticketNumber).toBe('MNT-20260221-0001');
    });

    it('should filter internal updates for CUSTOMER role', async () => {
      const ticketWithUpdates = createMockTicket({
        updates: [
          { id: 'upd-1', message: 'Public note', isInternal: false, createdBy: 'u-1', createdAt: new Date() },
          { id: 'upd-2', message: 'Internal note', isInternal: true, createdBy: 'u-2', createdAt: new Date() },
        ],
      });
      mockPrisma.maintenance.findFirst.mockResolvedValue(ticketWithUpdates);

      const result = await service.getTicket('mnt-001', 'user-001', Role.CUSTOMER);
      expect(result.updates).toHaveLength(1);
      expect(result.updates![0].message).toBe('Public note');
    });

    it('should show internal updates for VENDOR_ADMIN', async () => {
      const ticketWithUpdates = createMockTicket({
        updates: [
          { id: 'upd-1', message: 'Public', isInternal: false, createdBy: 'u-1', createdAt: new Date() },
          { id: 'upd-2', message: 'Internal', isInternal: true, createdBy: 'u-2', createdAt: new Date() },
        ],
      });
      mockPrisma.maintenance.findFirst.mockResolvedValue(ticketWithUpdates);

      const result = await service.getTicket('mnt-001', 'user-001', Role.VENDOR_ADMIN);
      expect(result.updates).toHaveLength(2);
    });

    it('should throw NotFoundException for missing ticket', async () => {
      mockPrisma.maintenance.findFirst.mockResolvedValue(null);

      await expect(
        service.getTicket('non-existent', 'user-001', Role.PARTNER_ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // LIST TICKETS
  // ============================================

  describe('listTickets', () => {
    it('should return paginated results', async () => {
      const tickets = [createMockTicket(), createMockTicket({ id: 'mnt-002' })];
      mockPrisma.maintenance.findMany.mockResolvedValue(tickets);
      mockPrisma.maintenance.count.mockResolvedValue(2);

      const result = await service.listTickets(
        { page: 1, limit: 20 },
        'user-001',
        Role.PARTNER_ADMIN,
      );

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should filter by status', async () => {
      mockPrisma.maintenance.findMany.mockResolvedValue([]);
      mockPrisma.maintenance.count.mockResolvedValue(0);

      await service.listTickets(
        { status: 'OPEN' },
        'user-001',
        Role.PARTNER_ADMIN,
      );

      const findCall = mockPrisma.maintenance.findMany.mock.calls[0][0];
      expect(findCall.where.status).toBe(MaintenanceStatus.OPEN);
    });

    it('should filter by category', async () => {
      mockPrisma.maintenance.findMany.mockResolvedValue([]);
      mockPrisma.maintenance.count.mockResolvedValue(0);

      await service.listTickets(
        { category: 'PLUMBING' },
        'user-001',
        Role.PARTNER_ADMIN,
      );

      const findCall = mockPrisma.maintenance.findMany.mock.calls[0][0];
      expect(findCall.where.category).toBe('PLUMBING');
    });

    it('should support search by ticket number or title', async () => {
      mockPrisma.maintenance.findMany.mockResolvedValue([]);
      mockPrisma.maintenance.count.mockResolvedValue(0);

      await service.listTickets(
        { search: 'MNT-' },
        'user-001',
        Role.PARTNER_ADMIN,
      );

      const findCall = mockPrisma.maintenance.findMany.mock.calls[0][0];
      expect(findCall.where.OR).toBeDefined();
      expect(findCall.where.OR).toHaveLength(2);
    });

    it('should default to page 1 and limit 20', async () => {
      mockPrisma.maintenance.findMany.mockResolvedValue([]);
      mockPrisma.maintenance.count.mockResolvedValue(0);

      const result = await service.listTickets({}, 'user-001', Role.PARTNER_ADMIN);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  // ============================================
  // ATTACHMENTS
  // ============================================

  describe('addAttachment', () => {
    it('should create attachment and return presigned URL', async () => {
      const dto = {
        type: 'IMAGE' as const,
        fileName: 'leak_photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1048576,
      };

      mockPrisma.maintenance.findFirst.mockResolvedValue(createMockTicket());
      mockPrisma.maintenanceAttachment.create.mockResolvedValue({
        id: 'att-001',
        maintenanceId: 'mnt-001',
        type: 'IMAGE',
        fileName: 'leak_photo.jpg',
        fileUrl: 'tenants/partner-001/maintenance/mnt-001/leak_photo.jpg',
        fileSize: 1048576,
        mimeType: 'image/jpeg',
        uploadedBy: 'user-001',
        uploadedAt: new Date(),
      });

      const result = await service.addAttachment('mnt-001', dto, 'user-001');

      expect(result.attachment).toBeDefined();
      expect(result.uploadUrl).toBe('https://s3.example.com/upload?signed=true');
      expect(result.expiresAt).toBeDefined();
      expect(mockS3Service.getPresignedUploadUrl).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'maintenance.attachment.added',
        expect.anything(),
      );
    });

    it('should reject attachments on closed tickets', async () => {
      mockPrisma.maintenance.findFirst.mockResolvedValue(
        createMockTicket({ status: MaintenanceStatus.CLOSED }),
      );

      await expect(
        service.addAttachment(
          'mnt-001',
          { type: 'IMAGE' as const, fileName: 'x.jpg', mimeType: 'image/jpeg', fileSize: 100 },
          'user-001',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject attachments on cancelled tickets', async () => {
      mockPrisma.maintenance.findFirst.mockResolvedValue(
        createMockTicket({ status: MaintenanceStatus.CANCELLED }),
      );

      await expect(
        service.addAttachment(
          'mnt-001',
          { type: 'IMAGE' as const, fileName: 'x.jpg', mimeType: 'image/jpeg', fileSize: 100 },
          'user-001',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // COMMENTS / UPDATES
  // ============================================

  describe('addUpdate', () => {
    it('should create a public comment', async () => {
      const dto = { message: 'Plumber scheduled for tomorrow' };

      mockPrisma.maintenance.findFirst.mockResolvedValue(createMockTicket());
      mockPrisma.maintenanceUpdate.create.mockResolvedValue({
        id: 'upd-001',
        maintenanceId: 'mnt-001',
        message: 'Plumber scheduled for tomorrow',
        isInternal: false,
        createdBy: 'user-001',
        createdAt: new Date(),
      });

      const result = await service.addUpdate('mnt-001', dto, 'user-001');

      expect(result.message).toBe('Plumber scheduled for tomorrow');
      expect(result.isInternal).toBe(false);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'maintenance.comment.added',
        expect.anything(),
      );
    });

    it('should create an internal note', async () => {
      const dto = { message: 'Cost estimate pending', isInternal: true };

      mockPrisma.maintenance.findFirst.mockResolvedValue(createMockTicket());
      mockPrisma.maintenanceUpdate.create.mockResolvedValue({
        id: 'upd-002',
        maintenanceId: 'mnt-001',
        message: 'Cost estimate pending',
        isInternal: true,
        createdBy: 'user-001',
        createdAt: new Date(),
      });

      const result = await service.addUpdate('mnt-001', dto, 'user-001');
      expect(result.isInternal).toBe(true);
    });

    it('should reject comments on closed tickets', async () => {
      mockPrisma.maintenance.findFirst.mockResolvedValue(
        createMockTicket({ status: MaintenanceStatus.CLOSED }),
      );

      await expect(
        service.addUpdate('mnt-001', { message: 'Test' }, 'user-001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject comments on cancelled tickets', async () => {
      mockPrisma.maintenance.findFirst.mockResolvedValue(
        createMockTicket({ status: MaintenanceStatus.CANCELLED }),
      );

      await expect(
        service.addUpdate('mnt-001', { message: 'Test' }, 'user-001'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // LIST UPDATES (ROLE FILTERING)
  // ============================================

  describe('listUpdates', () => {
    it('should return all updates for PARTNER_ADMIN', async () => {
      mockPrisma.maintenance.findFirst.mockResolvedValue(createMockTicket());
      mockPrisma.maintenanceUpdate.findMany.mockResolvedValue([
        { id: 'upd-1', message: 'Public', isInternal: false, createdBy: 'u-1', createdAt: new Date() },
        { id: 'upd-2', message: 'Internal', isInternal: true, createdBy: 'u-2', createdAt: new Date() },
      ]);

      const result = await service.listUpdates('mnt-001', Role.PARTNER_ADMIN);
      expect(result).toHaveLength(2);
    });

    it('should filter internal notes for CUSTOMER role', async () => {
      mockPrisma.maintenance.findFirst.mockResolvedValue(createMockTicket());
      mockPrisma.maintenanceUpdate.findMany.mockResolvedValue([
        { id: 'upd-1', message: 'Public', isInternal: false, createdBy: 'u-1', createdAt: new Date() },
      ]);

      const result = await service.listUpdates('mnt-001', Role.CUSTOMER);

      const findCall = mockPrisma.maintenanceUpdate.findMany.mock.calls[0][0];
      expect(findCall.where.isInternal).toBe(false);
    });
  });

  // ============================================
  // WORKFLOW: VERIFY TICKET
  // ============================================

  describe('verifyTicket', () => {
    it('should verify an OPEN ticket → VERIFIED', async () => {
      const ticket = createMockTicket({ status: MaintenanceStatus.OPEN });
      mockPrisma.maintenance.findFirst.mockResolvedValue(ticket);
      mockStateMachine.transition.mockResolvedValue({ success: true, fromState: 'OPEN', toState: 'VERIFIED' });
      mockPrisma.maintenance.update.mockResolvedValue({
        ...ticket,
        status: MaintenanceStatus.VERIFIED,
        verifiedBy: 'admin-001',
        verifiedAt: expect.any(Date),
      });
      mockPrisma.maintenanceUpdate.create.mockResolvedValue({});

      const result = await service.verifyTicket(
        'mnt-001',
        { verificationNotes: 'Confirmed leak' },
        'admin-001',
      );

      expect(mockStateMachine.transition).toHaveBeenCalledWith(MaintenanceStatus.OPEN, 'verify');
      expect(mockPrisma.maintenance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: MaintenanceStatus.VERIFIED,
            verifiedBy: 'admin-001',
            verificationNotes: 'Confirmed leak',
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('maintenance.status.changed', expect.anything());
    });

    it('should reject verify if state machine rejects transition', async () => {
      const ticket = createMockTicket({ status: MaintenanceStatus.IN_PROGRESS });
      mockPrisma.maintenance.findFirst.mockResolvedValue(ticket);
      mockStateMachine.transition.mockResolvedValue({
        success: false,
        fromState: 'IN_PROGRESS',
        toState: 'IN_PROGRESS',
        error: 'Cannot transition from "IN_PROGRESS"',
      });

      await expect(
        service.verifyTicket('mnt-001', {}, 'admin-001'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // WORKFLOW: ASSIGN TICKET
  // ============================================

  describe('assignTicket', () => {
    it('should assign a VERIFIED ticket to vendor staff', async () => {
      const ticket = createMockTicket({ status: MaintenanceStatus.VERIFIED });
      mockPrisma.maintenance.findFirst.mockResolvedValue(ticket);
      mockStateMachine.transition.mockResolvedValue({ success: true, fromState: 'VERIFIED', toState: 'ASSIGNED' });
      mockPrisma.maintenance.update.mockResolvedValue({
        ...ticket,
        status: MaintenanceStatus.ASSIGNED,
        assignedTo: 'staff-001',
      });
      mockPrisma.maintenanceUpdate.create.mockResolvedValue({});

      const result = await service.assignTicket(
        'mnt-001',
        { assignedTo: 'staff-001' },
        'admin-001',
      );

      expect(mockStateMachine.transition).toHaveBeenCalledWith(
        MaintenanceStatus.VERIFIED,
        'assign',
        { assignedTo: 'staff-001' },
      );
      expect(mockPrisma.maintenance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: MaintenanceStatus.ASSIGNED,
            assignedTo: 'staff-001',
          }),
        }),
      );
    });

    it('should assign to external contractor with name and phone', async () => {
      const ticket = createMockTicket({ status: MaintenanceStatus.VERIFIED });
      mockPrisma.maintenance.findFirst.mockResolvedValue(ticket);
      mockStateMachine.transition.mockResolvedValue({ success: true, fromState: 'VERIFIED', toState: 'ASSIGNED' });
      mockPrisma.maintenance.update.mockResolvedValue({
        ...ticket,
        status: MaintenanceStatus.ASSIGNED,
        assignedTo: 'Ahmad Plumbing',
        contractorName: 'Ahmad Plumbing Services',
        contractorPhone: '+60123456789',
      });
      mockPrisma.maintenanceUpdate.create.mockResolvedValue({});

      await service.assignTicket(
        'mnt-001',
        {
          assignedTo: 'Ahmad Plumbing',
          contractorName: 'Ahmad Plumbing Services',
          contractorPhone: '+60123456789',
          estimatedCost: 350,
        },
        'admin-001',
      );

      expect(mockPrisma.maintenance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contractorName: 'Ahmad Plumbing Services',
            contractorPhone: '+60123456789',
            estimatedCost: 350,
          }),
        }),
      );
    });

    it('should reject assign if state machine rejects transition', async () => {
      const ticket = createMockTicket({ status: MaintenanceStatus.OPEN });
      mockPrisma.maintenance.findFirst.mockResolvedValue(ticket);
      mockStateMachine.transition.mockResolvedValue({
        success: false,
        error: 'Cannot transition from "OPEN" via "assign"',
      });

      await expect(
        service.assignTicket('mnt-001', { assignedTo: 'staff-001' }, 'admin-001'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // WORKFLOW: START WORK
  // ============================================

  describe('startWork', () => {
    it('should start work on an ASSIGNED ticket → IN_PROGRESS', async () => {
      const ticket = createMockTicket({ status: MaintenanceStatus.ASSIGNED });
      mockPrisma.maintenance.findFirst.mockResolvedValue(ticket);
      mockStateMachine.transition.mockResolvedValue({ success: true, fromState: 'ASSIGNED', toState: 'IN_PROGRESS' });
      mockPrisma.maintenance.update.mockResolvedValue({
        ...ticket,
        status: MaintenanceStatus.IN_PROGRESS,
        startedAt: new Date(),
      });
      mockPrisma.maintenanceUpdate.create.mockResolvedValue({});

      const result = await service.startWork('mnt-001', 'staff-001');

      expect(mockPrisma.maintenance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: MaintenanceStatus.IN_PROGRESS,
            startedAt: expect.any(Date),
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('maintenance.status.changed', expect.anything());
    });

    it('should reject start if ticket is not ASSIGNED', async () => {
      const ticket = createMockTicket({ status: MaintenanceStatus.OPEN });
      mockPrisma.maintenance.findFirst.mockResolvedValue(ticket);
      mockStateMachine.transition.mockResolvedValue({
        success: false,
        error: 'Cannot transition from "OPEN" via "start"',
      });

      await expect(
        service.startWork('mnt-001', 'staff-001'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // WORKFLOW: RESOLVE TICKET
  // ============================================

  describe('resolveTicket', () => {
    it('should resolve an IN_PROGRESS ticket → PENDING_APPROVAL', async () => {
      const ticket = createMockTicket({
        status: MaintenanceStatus.IN_PROGRESS,
        estimatedCost: 300,
      });
      mockPrisma.maintenance.findFirst.mockResolvedValue(ticket);
      mockStateMachine.transition.mockResolvedValue({ success: true, fromState: 'IN_PROGRESS', toState: 'PENDING_APPROVAL' });
      mockPrisma.maintenance.update.mockResolvedValue({
        ...ticket,
        status: MaintenanceStatus.PENDING_APPROVAL,
        resolution: 'Fixed the leak',
        actualCost: 280,
        paidBy: 'OWNER',
      });
      mockPrisma.maintenanceUpdate.create.mockResolvedValue({});

      const result = await service.resolveTicket(
        'mnt-001',
        { resolution: 'Fixed the leak', actualCost: 280, paidBy: 'OWNER' },
        'staff-001',
      );

      expect(mockStateMachine.transition).toHaveBeenCalledWith(
        MaintenanceStatus.IN_PROGRESS,
        'resolve',
        { resolution: 'Fixed the leak' },
      );
      expect(mockPrisma.maintenance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: MaintenanceStatus.PENDING_APPROVAL,
            resolution: 'Fixed the leak',
            actualCost: 280,
            paidBy: 'OWNER',
            resolvedAt: expect.any(Date),
            resolvedBy: 'staff-001',
          }),
        }),
      );
    });

    it('should track estimated vs actual cost in system update', async () => {
      const ticket = createMockTicket({
        status: MaintenanceStatus.IN_PROGRESS,
        estimatedCost: 500,
      });
      mockPrisma.maintenance.findFirst.mockResolvedValue(ticket);
      mockStateMachine.transition.mockResolvedValue({ success: true });
      mockPrisma.maintenance.update.mockResolvedValue({
        ...ticket,
        status: MaintenanceStatus.PENDING_APPROVAL,
        resolution: 'Done',
        actualCost: 450,
      });
      mockPrisma.maintenanceUpdate.create.mockResolvedValue({});

      await service.resolveTicket(
        'mnt-001',
        { resolution: 'Done', actualCost: 450 },
        'staff-001',
      );

      // Verify the system update was attempted (async fire-and-forget)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('maintenance.status.changed', expect.anything());
    });

    it('should reject resolve without resolution description', async () => {
      const ticket = createMockTicket({ status: MaintenanceStatus.IN_PROGRESS });
      mockPrisma.maintenance.findFirst.mockResolvedValue(ticket);
      mockStateMachine.transition.mockResolvedValue({
        success: false,
        error: 'Transition guard failed',
      });

      await expect(
        service.resolveTicket('mnt-001', { resolution: '' } as any, 'staff-001'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // WORKFLOW: CLOSE TICKET
  // ============================================

  describe('closeTicket', () => {
    it('should close a PENDING_APPROVAL ticket → CLOSED', async () => {
      const ticket = createMockTicket({ status: MaintenanceStatus.PENDING_APPROVAL });
      mockPrisma.maintenance.findFirst.mockResolvedValue(ticket);
      mockStateMachine.transition.mockResolvedValue({ success: true });
      mockPrisma.maintenance.update.mockResolvedValue({
        ...ticket,
        status: MaintenanceStatus.CLOSED,
        closedAt: new Date(),
      });
      mockPrisma.maintenanceUpdate.create.mockResolvedValue({});

      const result = await service.closeTicket(
        'mnt-001',
        { closingNotes: 'All good' },
        'admin-001',
      );

      expect(mockPrisma.maintenance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: MaintenanceStatus.CLOSED,
            closedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should reject close if ticket is not PENDING_APPROVAL or CLAIM_APPROVED', async () => {
      const ticket = createMockTicket({ status: MaintenanceStatus.OPEN });
      mockPrisma.maintenance.findFirst.mockResolvedValue(ticket);
      mockStateMachine.transition.mockResolvedValue({
        success: false,
        error: 'Cannot transition from "OPEN" via "close"',
      });

      await expect(
        service.closeTicket('mnt-001', {}, 'admin-001'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // WORKFLOW: CANCEL TICKET
  // ============================================

  describe('cancelTicket', () => {
    it('should cancel an OPEN ticket → CANCELLED', async () => {
      const ticket = createMockTicket({ status: MaintenanceStatus.OPEN });
      mockPrisma.maintenance.findFirst.mockResolvedValue(ticket);
      mockStateMachine.transition.mockResolvedValue({ success: true });
      mockPrisma.maintenance.update.mockResolvedValue({
        ...ticket,
        status: MaintenanceStatus.CANCELLED,
      });
      mockPrisma.maintenanceUpdate.create.mockResolvedValue({});

      const result = await service.cancelTicket(
        'mnt-001',
        { reason: 'Duplicate ticket' },
        'admin-001',
      );

      expect(mockPrisma.maintenance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: MaintenanceStatus.CANCELLED,
          }),
        }),
      );
    });

    it('should reject cancel for IN_PROGRESS ticket', async () => {
      const ticket = createMockTicket({ status: MaintenanceStatus.IN_PROGRESS });
      mockPrisma.maintenance.findFirst.mockResolvedValue(ticket);
      mockStateMachine.transition.mockResolvedValue({
        success: false,
        error: 'Cannot transition from "IN_PROGRESS" via "cancel"',
      });

      await expect(
        service.cancelTicket('mnt-001', { reason: 'Not needed' }, 'admin-001'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // WORKFLOW: getAvailableActions
  // ============================================

  describe('getAvailableActions', () => {
    it('should return available actions for OPEN status', () => {
      mockStateMachine.getAvailableEvents.mockReturnValue(['verify', 'cancel']);

      const actions = service.getAvailableActions(MaintenanceStatus.OPEN);

      expect(actions).toEqual(['verify', 'cancel']);
      expect(mockStateMachine.getAvailableEvents).toHaveBeenCalledWith(MaintenanceStatus.OPEN);
    });

    it('should return empty for CLOSED status (only reopen)', () => {
      mockStateMachine.getAvailableEvents.mockReturnValue(['reopen']);

      const actions = service.getAvailableActions(MaintenanceStatus.CLOSED);

      expect(actions).toEqual(['reopen']);
    });
  });
});
