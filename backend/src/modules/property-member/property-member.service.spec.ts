/**
 * PropertyMemberService Unit Tests
 *
 * Tests property member CRUD, authorization, self-protection rules,
 * and my-properties queries.
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PropertyRole, Role } from '@prisma/client';
import { PropertyMemberService } from './property-member.service';

describe('PropertyMemberService', () => {
  let service: PropertyMemberService;
  let mockPrisma: any;
  let mockPartnerContext: any;

  const PARTNER_ID = 'partner-001';
  const LISTING_ID = 'listing-001';
  const USER_ID = 'user-001';
  const MEMBER_ID = 'member-001';

  const createMockMember = (overrides: Partial<any> = {}) => ({
    id: MEMBER_ID,
    partnerId: PARTNER_ID,
    listingId: LISTING_ID,
    userId: USER_ID,
    role: PropertyRole.PROPERTY_MANAGER,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    removedAt: null,
    user: {
      id: USER_ID,
      fullName: 'Ali Manager',
      email: 'ali@test.com',
      phone: '+60123456789',
    },
    ...overrides,
  });

  const createMockListing = (overrides: Partial<any> = {}) => ({
    id: LISTING_ID,
    partnerId: PARTNER_ID,
    deletedAt: null,
    vendor: { id: 'vendor-001' },
    ...overrides,
  });

  beforeEach(() => {
    mockPrisma = {
      propertyMember: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      listing: {
        findFirst: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      userVendor: {
        findUnique: jest.fn(),
      },
    };

    mockPartnerContext = {
      getContext: jest.fn().mockReturnValue({ partnerId: PARTNER_ID }),
    };

    service = new PropertyMemberService(mockPrisma, mockPartnerContext);
  });

  // ========================================
  // addMember
  // ========================================

  describe('addMember', () => {
    const dto = {
      userId: 'user-002',
      role: PropertyRole.LEASING_MANAGER,
      notes: 'Handles leasing',
    };

    it('should add a new member to a property (SUPER_ADMIN)', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-002', partnerId: PARTNER_ID });
      mockPrisma.propertyMember.findFirst.mockResolvedValue(null); // no duplicate
      const mockMember = createMockMember({ userId: 'user-002', role: PropertyRole.LEASING_MANAGER });
      mockPrisma.propertyMember.create.mockResolvedValue(mockMember);

      const result = await service.addMember(LISTING_ID, dto, 'admin-001', Role.SUPER_ADMIN);

      expect(result).toEqual(mockMember);
      expect(mockPrisma.propertyMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            partnerId: PARTNER_ID,
            listingId: LISTING_ID,
            userId: 'user-002',
            role: PropertyRole.LEASING_MANAGER,
          }),
        }),
      );
    });

    it('should add a member as PROPERTY_ADMIN of the listing', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      // assertCanManageMembers: not admin/partner/vendor, check PropertyMember
      mockPrisma.propertyMember.findFirst
        .mockResolvedValueOnce(createMockMember({ role: PropertyRole.PROPERTY_ADMIN })) // auth check
        .mockResolvedValueOnce(null); // no duplicate for new user
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-002', partnerId: PARTNER_ID });
      const mockMember = createMockMember({ userId: 'user-002' });
      mockPrisma.propertyMember.create.mockResolvedValue(mockMember);

      const result = await service.addMember(LISTING_ID, dto, USER_ID, Role.VENDOR_STAFF);

      expect(result).toEqual(mockMember);
    });

    it('should throw NotFoundException if listing not found', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(null);

      await expect(
        service.addMember(LISTING_ID, dto, 'admin-001', Role.SUPER_ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.addMember(LISTING_ID, dto, 'admin-001', Role.SUPER_ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for duplicate member', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-002', partnerId: PARTNER_ID });
      mockPrisma.propertyMember.findFirst.mockResolvedValue(createMockMember()); // exists

      await expect(
        service.addMember(LISTING_ID, dto, 'admin-001', Role.SUPER_ADMIN),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if VENDOR_STAFF without PROPERTY_ADMIN role', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-002', partnerId: PARTNER_ID });
      mockPrisma.propertyMember.findFirst.mockResolvedValue(null); // no PROPERTY_ADMIN

      await expect(
        service.addMember(LISTING_ID, dto, 'staff-001', Role.VENDOR_STAFF),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ========================================
  // listMembers
  // ========================================

  describe('listMembers', () => {
    it('should return paginated list of members', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      const members = [createMockMember()];
      mockPrisma.propertyMember.findMany.mockResolvedValue(members);
      mockPrisma.propertyMember.count.mockResolvedValue(1);

      const result = await service.listMembers(LISTING_ID, { page: 1, limit: 20 });

      expect(result.data).toEqual(members);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should apply role filter', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      mockPrisma.propertyMember.findMany.mockResolvedValue([]);
      mockPrisma.propertyMember.count.mockResolvedValue(0);

      await service.listMembers(LISTING_ID, {
        role: PropertyRole.MAINTENANCE_STAFF,
        page: 1,
        limit: 20,
      });

      expect(mockPrisma.propertyMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: PropertyRole.MAINTENANCE_STAFF,
          }),
        }),
      );
    });

    it('should throw NotFoundException if listing not found', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(null);

      await expect(
        service.listMembers('nonexistent', { page: 1, limit: 20 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ========================================
  // updateMember
  // ========================================

  describe('updateMember', () => {
    it('should update member role', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      mockPrisma.propertyMember.findFirst.mockResolvedValue(
        createMockMember({ userId: 'user-002' }), // different user
      );
      const updated = createMockMember({ userId: 'user-002', role: PropertyRole.PROPERTY_STAFF });
      mockPrisma.propertyMember.update.mockResolvedValue(updated);

      const result = await service.updateMember(
        LISTING_ID,
        MEMBER_ID,
        { role: PropertyRole.PROPERTY_STAFF },
        'admin-001',
        Role.SUPER_ADMIN,
      );

      expect(result.role).toBe(PropertyRole.PROPERTY_STAFF);
    });

    it('should throw BadRequestException when changing own role', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      mockPrisma.propertyMember.findFirst.mockResolvedValue(
        createMockMember({ userId: 'admin-001' }), // same as requester
      );

      await expect(
        service.updateMember(
          LISTING_ID,
          MEMBER_ID,
          { role: PropertyRole.PROPERTY_ADMIN },
          'admin-001',
          Role.SUPER_ADMIN,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if member not found', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      mockPrisma.propertyMember.findFirst.mockResolvedValue(null);

      await expect(
        service.updateMember(
          LISTING_ID,
          'nonexistent',
          { role: PropertyRole.PROPERTY_STAFF },
          'admin-001',
          Role.SUPER_ADMIN,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ========================================
  // removeMember
  // ========================================

  describe('removeMember', () => {
    it('should soft-delete a member', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      mockPrisma.propertyMember.findFirst.mockResolvedValue(
        createMockMember({ userId: 'user-002' }),
      );
      mockPrisma.propertyMember.update.mockResolvedValue({});

      await service.removeMember(LISTING_ID, MEMBER_ID, 'admin-001', Role.SUPER_ADMIN);

      expect(mockPrisma.propertyMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: MEMBER_ID },
          data: { removedAt: expect.any(Date) },
        }),
      );
    });

    it('should throw BadRequestException when removing only PROPERTY_ADMIN (self)', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      mockPrisma.propertyMember.findFirst.mockResolvedValue(
        createMockMember({
          userId: 'admin-001',
          role: PropertyRole.PROPERTY_ADMIN,
        }),
      );
      mockPrisma.propertyMember.count.mockResolvedValue(0); // no other admins

      await expect(
        service.removeMember(LISTING_ID, MEMBER_ID, 'admin-001', Role.SUPER_ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow removing self as PROPERTY_ADMIN if another admin exists', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      mockPrisma.propertyMember.findFirst.mockResolvedValue(
        createMockMember({
          userId: 'admin-001',
          role: PropertyRole.PROPERTY_ADMIN,
        }),
      );
      mockPrisma.propertyMember.count.mockResolvedValue(1); // another admin exists
      mockPrisma.propertyMember.update.mockResolvedValue({});

      await service.removeMember(LISTING_ID, MEMBER_ID, 'admin-001', Role.SUPER_ADMIN);

      expect(mockPrisma.propertyMember.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if member not found', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      mockPrisma.propertyMember.findFirst.mockResolvedValue(null);

      await expect(
        service.removeMember(LISTING_ID, 'nonexistent', 'admin-001', Role.SUPER_ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ========================================
  // getMyProperties
  // ========================================

  describe('getMyProperties', () => {
    it('should return properties assigned to the user', async () => {
      const properties = [
        {
          id: 'pm-001',
          listingId: LISTING_ID,
          role: PropertyRole.PROPERTY_MANAGER,
          listing: {
            id: LISTING_ID,
            title: 'Condo A',
            status: 'PUBLISHED',
            price: 500000,
            vendor: { id: 'vendor-001', companyName: 'ABC Realty' },
          },
        },
      ];
      mockPrisma.propertyMember.findMany.mockResolvedValue(properties);

      const result = await service.getMyProperties(USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe(PropertyRole.PROPERTY_MANAGER);
    });
  });

  // ========================================
  // getMyRole
  // ========================================

  describe('getMyRole', () => {
    it('should return role for assigned property', async () => {
      mockPrisma.propertyMember.findFirst.mockResolvedValue(
        createMockMember({ role: PropertyRole.LEASING_MANAGER }),
      );

      const result = await service.getMyRole(LISTING_ID, USER_ID);

      expect(result).toEqual({ role: PropertyRole.LEASING_MANAGER });
    });

    it('should return null if not assigned', async () => {
      mockPrisma.propertyMember.findFirst.mockResolvedValue(null);

      const result = await service.getMyRole(LISTING_ID, USER_ID);

      expect(result).toBeNull();
    });
  });

  // ========================================
  // assertCanManageMembers (via addMember)
  // ========================================

  describe('authorization', () => {
    const dto = { userId: 'user-002', role: PropertyRole.PROPERTY_STAFF };

    it('SUPER_ADMIN should always have access', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-002', partnerId: PARTNER_ID });
      mockPrisma.propertyMember.findFirst.mockResolvedValue(null);
      mockPrisma.propertyMember.create.mockResolvedValue(createMockMember());

      await expect(
        service.addMember(LISTING_ID, dto, 'admin-001', Role.SUPER_ADMIN),
      ).resolves.toBeDefined();
    });

    it('PARTNER_ADMIN should always have access', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-002', partnerId: PARTNER_ID });
      mockPrisma.propertyMember.findFirst.mockResolvedValue(null);
      mockPrisma.propertyMember.create.mockResolvedValue(createMockMember());

      await expect(
        service.addMember(LISTING_ID, dto, 'partner-admin', Role.PARTNER_ADMIN),
      ).resolves.toBeDefined();
    });

    it('VENDOR_ADMIN should have access to own vendor listings', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      mockPrisma.userVendor.findUnique.mockResolvedValue({ userId: 'vendor-admin-001', vendorId: 'vendor-001', role: 'OWNER', isPrimary: true }); // auth check via UserVendor
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-002', partnerId: PARTNER_ID }); // user lookup
      mockPrisma.propertyMember.findFirst.mockResolvedValue(null);
      mockPrisma.propertyMember.create.mockResolvedValue(createMockMember());

      await expect(
        service.addMember(LISTING_ID, dto, 'vendor-admin-001', Role.VENDOR_ADMIN),
      ).resolves.toBeDefined();
    });

    it('VENDOR_STAFF without PROPERTY_ADMIN should be rejected', async () => {
      mockPrisma.listing.findFirst.mockResolvedValue(createMockListing());
      mockPrisma.propertyMember.findFirst.mockResolvedValue(null); // no PROPERTY_ADMIN role

      await expect(
        service.addMember(LISTING_ID, dto, 'staff-001', Role.VENDOR_STAFF),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
