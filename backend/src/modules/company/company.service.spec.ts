/**
 * CompanyService Unit Tests
 * Session 8.1 - Company Module
 *
 * Tests company registration, verification, suspension,
 * admin management, and listing/query functionality.
 */

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CompanyStatus, CompanyAdminRole, CompanyType } from '@prisma/client';
import { CompanyService } from './company.service';

describe('CompanyService', () => {
  let service: CompanyService;
  let mockPrisma: any;
  let mockPartnerContext: any;
  let mockEventEmitter: any;

  // Helper: create a mock company
  const createMockCompany = (overrides: Partial<any> = {}) => ({
    id: 'company-001',
    partnerId: 'partner-001',
    name: 'ABC Properties Sdn Bhd',
    registrationNo: 'SSM-12345',
    type: CompanyType.PROPERTY_COMPANY,
    email: 'info@abcproperties.com',
    phone: '+60123456789',
    address: '123 Jalan Bukit Bintang, KL',
    businessLicense: null,
    ssmDocument: null,
    status: CompanyStatus.PENDING,
    verifiedAt: null,
    verifiedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    admins: [
      {
        id: 'admin-001',
        companyId: 'company-001',
        userId: 'user-001',
        role: CompanyAdminRole.ADMIN,
        isOwner: true,
        createdAt: new Date(),
        user: {
          id: 'user-001',
          fullName: 'Ali Owner',
          email: 'ali@test.com',
          phone: '+60123456789',
        },
      },
    ],
    ...overrides,
  });

  // Helper: create a mock company admin
  const createMockAdmin = (overrides: Partial<any> = {}) => ({
    id: 'admin-002',
    companyId: 'company-001',
    userId: 'user-002',
    role: CompanyAdminRole.ADMIN,
    isOwner: false,
    createdAt: new Date(),
    user: {
      id: 'user-002',
      fullName: 'Bob Admin',
      email: 'bob@test.com',
      phone: '+60198765432',
    },
    ...overrides,
  });

  beforeEach(() => {
    mockPrisma = {
      company: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      companyAdmin: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(2),
      },
      user: {
        findFirst: jest.fn(),
      },
    };

    mockPartnerContext = {
      getContext: jest.fn().mockReturnValue({ partnerId: 'partner-001' }),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    service = new CompanyService(
      mockPrisma,
      mockPartnerContext,
      mockEventEmitter,
    );
  });

  // ========================================
  // registerCompany
  // ========================================

  describe('registerCompany', () => {
    const dto = {
      name: 'ABC Properties Sdn Bhd',
      registrationNo: 'SSM-12345',
      type: CompanyType.PROPERTY_COMPANY,
      email: 'info@abcproperties.com',
      phone: '+60123456789',
      address: '123 Jalan Bukit Bintang, KL',
    };

    it('should register a new company and add creator as owner admin', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(null); // no duplicate
      const mockCompany = createMockCompany();
      mockPrisma.company.create.mockResolvedValue(mockCompany);

      const result = await service.registerCompany(dto, 'user-001');

      expect(result).toEqual(mockCompany);
      expect(mockPrisma.company.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            partnerId: 'partner-001',
            name: dto.name,
            registrationNo: dto.registrationNo,
            type: dto.type,
            email: dto.email,
            phone: dto.phone,
            status: CompanyStatus.PENDING,
            admins: {
              create: {
                userId: 'user-001',
                role: CompanyAdminRole.ADMIN,
                isOwner: true,
              },
            },
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'company.registered',
        expect.objectContaining({
          companyId: 'company-001',
          partnerId: 'partner-001',
        }),
      );
    });

    it('should throw ConflictException for duplicate registration number', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(createMockCompany());

      await expect(service.registerCompany(dto, 'user-001')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ========================================
  // getCompany
  // ========================================

  describe('getCompany', () => {
    it('should return company by ID within partner scope', async () => {
      const mockCompany = createMockCompany();
      mockPrisma.company.findFirst.mockResolvedValue(mockCompany);

      const result = await service.getCompany('company-001');

      expect(result).toEqual(mockCompany);
      expect(mockPrisma.company.findFirst).toHaveBeenCalledWith({
        where: { id: 'company-001', partnerId: 'partner-001', deletedAt: null },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if company not found', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(null);

      await expect(service.getCompany('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ========================================
  // listCompanies
  // ========================================

  describe('listCompanies', () => {
    it('should return paginated list of companies', async () => {
      const companies = [createMockCompany()];
      mockPrisma.company.findMany.mockResolvedValue(companies);
      mockPrisma.company.count.mockResolvedValue(1);

      const result = await service.listCompanies({ page: 1, limit: 20 });

      expect(result.data).toEqual(companies);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should apply type filter', async () => {
      mockPrisma.company.findMany.mockResolvedValue([]);
      mockPrisma.company.count.mockResolvedValue(0);

      await service.listCompanies({
        type: CompanyType.AGENCY,
        page: 1,
        limit: 20,
      });

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: CompanyType.AGENCY,
          }),
        }),
      );
    });

    it('should apply status filter', async () => {
      mockPrisma.company.findMany.mockResolvedValue([]);
      mockPrisma.company.count.mockResolvedValue(0);

      await service.listCompanies({
        status: CompanyStatus.ACTIVE,
        page: 1,
        limit: 20,
      });

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: CompanyStatus.ACTIVE,
          }),
        }),
      );
    });

    it('should apply search filter on name and registrationNo', async () => {
      mockPrisma.company.findMany.mockResolvedValue([]);
      mockPrisma.company.count.mockResolvedValue(0);

      await service.listCompanies({ search: 'ABC', page: 1, limit: 20 });

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'ABC', mode: 'insensitive' } },
              { registrationNo: { contains: 'ABC', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });

  // ========================================
  // updateCompany
  // ========================================

  describe('updateCompany', () => {
    it('should update company fields', async () => {
      const mockCompany = createMockCompany();
      mockPrisma.company.findFirst.mockResolvedValue(mockCompany);
      const updated = createMockCompany({ name: 'Updated Name' });
      mockPrisma.company.update.mockResolvedValue(updated);

      const result = await service.updateCompany('company-001', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(mockPrisma.company.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'company-001' },
          data: expect.objectContaining({ name: 'Updated Name' }),
        }),
      );
    });

    it('should throw NotFoundException if company not found', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(null);

      await expect(
        service.updateCompany('nonexistent', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ========================================
  // verifyCompany
  // ========================================

  describe('verifyCompany', () => {
    it('should verify a PENDING company', async () => {
      const pendingCompany = createMockCompany({ status: CompanyStatus.PENDING });
      mockPrisma.company.findFirst.mockResolvedValue(pendingCompany);
      const verifiedCompany = createMockCompany({
        status: CompanyStatus.ACTIVE,
        verifiedAt: new Date(),
        verifiedBy: 'admin-user',
      });
      mockPrisma.company.update.mockResolvedValue(verifiedCompany);

      const result = await service.verifyCompany('company-001', 'admin-user');

      expect(result.status).toBe(CompanyStatus.ACTIVE);
      expect(mockPrisma.company.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: CompanyStatus.ACTIVE,
            verifiedBy: 'admin-user',
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'company.verified',
        expect.objectContaining({
          companyId: 'company-001',
          verifiedBy: 'admin-user',
        }),
      );
    });

    it('should throw BadRequestException if already verified', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(
        createMockCompany({ status: CompanyStatus.ACTIVE }),
      );

      await expect(
        service.verifyCompany('company-001', 'admin-user'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if company is suspended', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(
        createMockCompany({ status: CompanyStatus.SUSPENDED }),
      );

      await expect(
        service.verifyCompany('company-001', 'admin-user'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if company not found', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyCompany('nonexistent', 'admin-user'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ========================================
  // suspendCompany
  // ========================================

  describe('suspendCompany', () => {
    it('should suspend an active company', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(
        createMockCompany({ status: CompanyStatus.ACTIVE }),
      );
      mockPrisma.company.update.mockResolvedValue(
        createMockCompany({ status: CompanyStatus.SUSPENDED }),
      );

      const result = await service.suspendCompany('company-001');

      expect(result.status).toBe(CompanyStatus.SUSPENDED);
    });

    it('should throw BadRequestException if already suspended', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(
        createMockCompany({ status: CompanyStatus.SUSPENDED }),
      );

      await expect(service.suspendCompany('company-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if company not found', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(null);

      await expect(service.suspendCompany('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ========================================
  // addAdmin
  // ========================================

  describe('addAdmin', () => {
    const dto = {
      userId: 'user-002',
      role: CompanyAdminRole.ADMIN as any,
      isOwner: false,
    };

    it('should add a new admin to the company', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(createMockCompany());
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-002',
        partnerId: 'partner-001',
        fullName: 'Bob Admin',
      });
      mockPrisma.companyAdmin.findUnique.mockResolvedValue(null); // no duplicate
      const mockAdmin = createMockAdmin();
      mockPrisma.companyAdmin.create.mockResolvedValue(mockAdmin);

      const result = await service.addAdmin('company-001', dto);

      expect(result).toEqual(mockAdmin);
      expect(mockPrisma.companyAdmin.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: 'company-001',
            userId: 'user-002',
            role: CompanyAdminRole.ADMIN,
            isOwner: false,
          }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'company.admin.added',
        expect.objectContaining({
          companyId: 'company-001',
          userId: 'user-002',
        }),
      );
    });

    it('should throw NotFoundException if company not found', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(null);

      await expect(service.addAdmin('nonexistent', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(createMockCompany());
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.addAdmin('company-001', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if user is already an admin', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(createMockCompany());
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-002',
        partnerId: 'partner-001',
      });
      mockPrisma.companyAdmin.findUnique.mockResolvedValue(createMockAdmin());

      await expect(service.addAdmin('company-001', dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ========================================
  // removeAdmin
  // ========================================

  describe('removeAdmin', () => {
    it('should remove a non-owner admin', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(createMockCompany());
      mockPrisma.companyAdmin.findUnique.mockResolvedValue(
        createMockAdmin({ isOwner: false }),
      );
      mockPrisma.companyAdmin.count.mockResolvedValue(2);
      mockPrisma.companyAdmin.delete.mockResolvedValue({});

      await service.removeAdmin('company-001', 'user-002');

      expect(mockPrisma.companyAdmin.delete).toHaveBeenCalledWith({
        where: { id: 'admin-002' },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'company.admin.removed',
        expect.objectContaining({
          companyId: 'company-001',
          userId: 'user-002',
        }),
      );
    });

    it('should throw NotFoundException if company not found', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(null);

      await expect(
        service.removeAdmin('nonexistent', 'user-002'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if admin not found', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(createMockCompany());
      mockPrisma.companyAdmin.findUnique.mockResolvedValue(null);

      await expect(
        service.removeAdmin('company-001', 'user-999'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if trying to remove owner', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(createMockCompany());
      mockPrisma.companyAdmin.findUnique.mockResolvedValue(
        createMockAdmin({ isOwner: true }),
      );

      await expect(
        service.removeAdmin('company-001', 'user-002'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if trying to remove last admin', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(createMockCompany());
      mockPrisma.companyAdmin.findUnique.mockResolvedValue(
        createMockAdmin({ isOwner: false }),
      );
      mockPrisma.companyAdmin.count.mockResolvedValue(1);

      await expect(
        service.removeAdmin('company-001', 'user-002'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ========================================
  // getAdmins
  // ========================================

  describe('getAdmins', () => {
    it('should return all admins for a company', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(createMockCompany());
      const admins = [
        createMockAdmin({ id: 'admin-001', userId: 'user-001', isOwner: true }),
        createMockAdmin({ id: 'admin-002', userId: 'user-002', isOwner: false }),
      ];
      mockPrisma.companyAdmin.findMany.mockResolvedValue(admins);

      const result = await service.getAdmins('company-001');

      expect(result).toHaveLength(2);
      expect(mockPrisma.companyAdmin.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: 'company-001' },
        }),
      );
    });

    it('should throw NotFoundException if company not found', async () => {
      mockPrisma.company.findFirst.mockResolvedValue(null);

      await expect(service.getAdmins('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
