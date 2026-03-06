/**
 * ReminderService Unit Tests
 * Session 6.5 - Payment Reminder System
 *
 * Tests reminder business logic: sendReminder, scheduleReminders,
 * escalateToLegal, listReminders, and event-driven processing.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RentBillingStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import {
  ReminderService,
  REMINDER_SCHEDULE,
} from './reminder.service';

describe('ReminderService', () => {
  let service: ReminderService;
  let mockPrisma: any;
  let mockPartnerContext: any;
  let mockEventEmitter: any;

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  const createMockBilling = (overrides: Partial<any> = {}) => ({
    id: 'bill-001',
    tenancyId: 'tenancy-001',
    billNumber: 'BILL-202603-0001',
    billingPeriod: new Date('2026-03-01'),
    status: RentBillingStatus.OVERDUE,
    rentAmount: new Decimal(2500),
    totalAmount: new Decimal(2500),
    paidAmount: new Decimal(0),
    balanceDue: new Decimal(2500),
    issueDate: new Date('2026-03-01'),
    dueDate: new Date('2026-03-08'),
    tenancy: {
      tenant: {
        user: { fullName: 'Jane Doe', email: 'jane@test.com' },
      },
      listing: { id: 'listing-001', title: 'Unit 101' },
    },
    reminders: [],
    ...overrides,
  });

  const createMockReminder = (overrides: Partial<any> = {}) => ({
    id: 'rem-001',
    billingId: 'bill-001',
    partnerId: 'partner-001',
    sequence: 1,
    type: 'EMAIL',
    status: 'SENT',
    sentAt: new Date(),
    sentTo: 'jane@test.com',
    response: null,
    respondedAt: null,
    escalatedAt: null,
    escalatedTo: null,
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    mockPrisma = {
      rentBilling: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      rentBillingReminder: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    mockPartnerContext = {
      partnerId: 'partner-001',
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    service = new ReminderService(mockPrisma, mockPartnerContext, mockEventEmitter);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // REMINDER_SCHEDULE constants
  // ─────────────────────────────────────────────────────────────────────────

  describe('REMINDER_SCHEDULE', () => {
    it('should have 4 tiers', () => {
      expect(REMINDER_SCHEDULE).toHaveLength(4);
    });

    it('should have correct sequence order', () => {
      const sequences = REMINDER_SCHEDULE.map((r) => r.sequence);
      expect(sequences).toEqual([1, 2, 3, 4]);
    });

    it('should have correct day offsets', () => {
      const offsets = REMINDER_SCHEDULE.map((r) => r.dayOffset);
      expect(offsets).toEqual([-3, 0, 7, 14]);
    });

    it('should mark only sequence 4 for escalation', () => {
      const escalations = REMINDER_SCHEDULE.map((r) => r.escalate);
      expect(escalations).toEqual([false, false, false, true]);
    });

    it('should use LEGAL_NOTICE channel for sequence 4', () => {
      const seq4 = REMINDER_SCHEDULE.find((r) => r.sequence === 4);
      expect(seq4?.channel).toBe('LEGAL_NOTICE');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // sendReminder
  // ─────────────────────────────────────────────────────────────────────────

  describe('sendReminder', () => {
    it('should send a reminder at the next sequence', async () => {
      const billing = createMockBilling();
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBillingReminder.findFirst.mockResolvedValue(null);
      mockPrisma.rentBillingReminder.create.mockResolvedValue(
        createMockReminder(),
      );

      const result = await service.sendReminder('bill-001');

      expect(result).toEqual(
        expect.objectContaining({
          reminderId: 'rem-001',
          billingId: 'bill-001',
          billNumber: 'BILL-202603-0001',
          sequence: 1,
          channel: 'EMAIL',
          sentTo: 'jane@test.com',
          escalated: false,
        }),
      );

      // Should emit billing.reminder.sent event
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'billing.reminder.sent',
        expect.objectContaining({
          billingId: 'bill-001',
          sequence: 1,
          channel: 'EMAIL',
        }),
      );
    });

    it('should send reminder at specific sequence when provided', async () => {
      const billing = createMockBilling({
        reminders: [createMockReminder({ sequence: 1 })],
      });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBillingReminder.findFirst.mockResolvedValue(null);
      mockPrisma.rentBillingReminder.create.mockResolvedValue(
        createMockReminder({ id: 'rem-002', sequence: 2 }),
      );

      const result = await service.sendReminder('bill-001', 2);

      expect(result.sequence).toBe(2);
      expect(result.channel).toBe('EMAIL');
    });

    it('should throw NotFoundException when billing not found', async () => {
      mockPrisma.rentBilling.findFirst.mockResolvedValue(null);

      await expect(service.sendReminder('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for non-eligible status (PAID)', async () => {
      const billing = createMockBilling({
        status: RentBillingStatus.PAID,
      });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);

      await expect(service.sendReminder('bill-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for non-eligible status (WRITTEN_OFF)', async () => {
      const billing = createMockBilling({
        status: RentBillingStatus.WRITTEN_OFF,
      });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);

      await expect(service.sendReminder('bill-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for duplicate sequence', async () => {
      const billing = createMockBilling();
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBillingReminder.findFirst.mockResolvedValue(
        createMockReminder({ sequence: 1 }),
      );

      await expect(service.sendReminder('bill-001', 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for sequence out of range', async () => {
      const billing = createMockBilling();
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);

      await expect(service.sendReminder('bill-001', 5)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when tenant email is not available', async () => {
      const billing = createMockBilling({
        tenancy: {
          tenant: { user: { fullName: 'Jane', email: '' } },
          listing: { id: 'l1', title: 'Unit 101' },
        },
      });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBillingReminder.findFirst.mockResolvedValue(null);

      await expect(service.sendReminder('bill-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should trigger legal escalation at sequence 4', async () => {
      const billing = createMockBilling({
        reminders: [createMockReminder({ sequence: 3 })],
      });
      mockPrisma.rentBilling.findFirst.mockResolvedValue(billing);
      mockPrisma.rentBillingReminder.findFirst.mockResolvedValue(null);
      mockPrisma.rentBillingReminder.create.mockResolvedValue(
        createMockReminder({
          id: 'rem-004',
          sequence: 4,
          type: 'LEGAL_NOTICE',
          escalatedAt: new Date(),
          escalatedTo: 'Legal Team',
        }),
      );

      const result = await service.sendReminder('bill-001', 4);

      expect(result.escalated).toBe(true);
      expect(result.channel).toBe('LEGAL_NOTICE');

      // Should emit both reminder.sent and reminder.escalated events
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'billing.reminder.sent',
        expect.objectContaining({ isLegalNotice: true }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'billing.escalated.legal',
        expect.objectContaining({
          billingId: 'bill-001',
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // scheduleReminders
  // ─────────────────────────────────────────────────────────────────────────

  describe('scheduleReminders', () => {
    it('should skip billing when no reminder is due yet', async () => {
      // Due date is far in the future, so no reminder trigger date has passed
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      mockPrisma.rentBilling.findMany.mockResolvedValue([
        createMockBilling({ dueDate: futureDate }),
      ]);

      const result = await service.scheduleReminders('partner-001');

      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.sent).toBe(0);
    });

    it('should send reminder when trigger date has passed', async () => {
      // Due date was 10 days ago → sequence 3 (7 days overdue) should trigger
      const pastDueDate = new Date();
      pastDueDate.setDate(pastDueDate.getDate() - 10);

      const billing = createMockBilling({
        dueDate: pastDueDate,
        reminders: [], // No reminders sent yet
      });

      mockPrisma.rentBilling.findMany.mockResolvedValue([billing]);
      mockPrisma.rentBillingReminder.create.mockResolvedValue(
        createMockReminder({ sequence: 1 }),
      );

      const result = await service.scheduleReminders('partner-001');

      expect(result.processed).toBe(1);
      expect(result.sent).toBe(1);
      expect(mockPrisma.rentBillingReminder.create).toHaveBeenCalled();
    });

    it('should handle billings with no tenant email', async () => {
      const pastDueDate = new Date();
      pastDueDate.setDate(pastDueDate.getDate() - 10);

      const billing = createMockBilling({
        dueDate: pastDueDate,
        tenancy: {
          tenant: { user: { fullName: 'No Email', email: null } },
          listing: { id: 'l1', title: 'Unit 101' },
        },
      });

      mockPrisma.rentBilling.findMany.mockResolvedValue([billing]);

      const result = await service.scheduleReminders('partner-001');

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.details[0].action).toBe('FAILED');
    });

    it('should return empty result when no unpaid billings exist', async () => {
      mockPrisma.rentBilling.findMany.mockResolvedValue([]);

      const result = await service.scheduleReminders('partner-001');

      expect(result.processed).toBe(0);
      expect(result.sent).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('should escalate when sequence 4 is due', async () => {
      // Due date was 20 days ago → 14 days overdue threshold passed
      const pastDueDate = new Date();
      pastDueDate.setDate(pastDueDate.getDate() - 20);

      const billing = createMockBilling({
        dueDate: pastDueDate,
        reminders: [
          createMockReminder({ sequence: 3 }),
          createMockReminder({ sequence: 2 }),
          createMockReminder({ sequence: 1 }),
        ],
      });

      mockPrisma.rentBilling.findMany.mockResolvedValue([billing]);
      mockPrisma.rentBillingReminder.create.mockResolvedValue(
        createMockReminder({
          sequence: 4,
          type: 'LEGAL_NOTICE',
          escalatedAt: new Date(),
          escalatedTo: 'Legal Team',
        }),
      );

      const result = await service.scheduleReminders('partner-001');

      expect(result.processed).toBe(1);
      expect(result.escalated).toBe(1);
      expect(result.details[0].action).toBe('ESCALATED');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'billing.escalated.legal',
        expect.objectContaining({ partnerId: 'partner-001' }),
      );
    });

    it('should handle errors during individual billing processing', async () => {
      const pastDueDate = new Date();
      pastDueDate.setDate(pastDueDate.getDate() - 10);

      const billing = createMockBilling({ dueDate: pastDueDate });

      mockPrisma.rentBilling.findMany.mockResolvedValue([billing]);
      mockPrisma.rentBillingReminder.create.mockRejectedValue(
        new Error('DB constraint error'),
      );

      const result = await service.scheduleReminders('partner-001');

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.details[0].action).toBe('FAILED');
      expect(result.details[0].reason).toContain('DB constraint error');
    });

    it('should process multiple billings in order', async () => {
      const pastDueDate1 = new Date();
      pastDueDate1.setDate(pastDueDate1.getDate() - 5);
      const pastDueDate2 = new Date();
      pastDueDate2.setDate(pastDueDate2.getDate() - 1);

      const billings = [
        createMockBilling({
          id: 'bill-001',
          billNumber: 'BILL-001',
          dueDate: pastDueDate1,
        }),
        createMockBilling({
          id: 'bill-002',
          billNumber: 'BILL-002',
          dueDate: pastDueDate2,
        }),
      ];

      mockPrisma.rentBilling.findMany.mockResolvedValue(billings);
      mockPrisma.rentBillingReminder.create
        .mockResolvedValueOnce(createMockReminder({ id: 'rem-a', sequence: 1 }))
        .mockResolvedValueOnce(createMockReminder({ id: 'rem-b', sequence: 1 }));

      const result = await service.scheduleReminders('partner-001');

      expect(result.processed).toBe(2);
      expect(result.sent).toBe(2);
      expect(mockPrisma.rentBillingReminder.create).toHaveBeenCalledTimes(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // escalateToLegal
  // ─────────────────────────────────────────────────────────────────────────

  describe('escalateToLegal', () => {
    it('should throw NotFoundException when billing not found', async () => {
      mockPrisma.rentBilling.findFirst.mockResolvedValue(null);

      await expect(service.escalateToLegal('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when already escalated', async () => {
      mockPrisma.rentBilling.findFirst.mockResolvedValue({
        ...createMockBilling(),
        reminders: [createMockReminder({ sequence: 4 })],
      });

      await expect(service.escalateToLegal('bill-001')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should send sequence 4 legal notice', async () => {
      // First call: escalateToLegal checks for existing seq-4
      mockPrisma.rentBilling.findFirst
        .mockResolvedValueOnce({
          ...createMockBilling(),
          reminders: [], // No seq-4 yet
        })
        // Second call: sendReminder fetches billing again
        .mockResolvedValueOnce(createMockBilling());

      mockPrisma.rentBillingReminder.findFirst.mockResolvedValue(null);
      mockPrisma.rentBillingReminder.create.mockResolvedValue(
        createMockReminder({
          id: 'rem-legal',
          sequence: 4,
          type: 'LEGAL_NOTICE',
          escalatedAt: new Date(),
          escalatedTo: 'Legal Team',
        }),
      );

      const result = await service.escalateToLegal('bill-001');

      expect(result.sequence).toBe(4);
      expect(result.escalated).toBe(true);
      expect(result.channel).toBe('LEGAL_NOTICE');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // listReminders
  // ─────────────────────────────────────────────────────────────────────────

  describe('listReminders', () => {
    it('should return reminders ordered by sequence', async () => {
      mockPrisma.rentBilling.findFirst.mockResolvedValue(createMockBilling());
      mockPrisma.rentBillingReminder.findMany.mockResolvedValue([
        createMockReminder({ id: 'rem-1', sequence: 1 }),
        createMockReminder({ id: 'rem-2', sequence: 2 }),
        createMockReminder({ id: 'rem-3', sequence: 3 }),
      ]);

      const result = await service.listReminders('bill-001');

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('rem-1');
      expect(result[0].sequence).toBe(1);
      expect(result[2].sequence).toBe(3);
    });

    it('should return empty array when no reminders exist', async () => {
      mockPrisma.rentBilling.findFirst.mockResolvedValue(createMockBilling());
      mockPrisma.rentBillingReminder.findMany.mockResolvedValue([]);

      const result = await service.listReminders('bill-001');

      expect(result).toHaveLength(0);
    });

    it('should throw NotFoundException when billing not found', async () => {
      mockPrisma.rentBilling.findFirst.mockResolvedValue(null);

      await expect(service.listReminders('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // handleProcessRemindersEvent (event listener)
  // ─────────────────────────────────────────────────────────────────────────

  describe('handleProcessRemindersEvent', () => {
    it('should call scheduleReminders with the partnerId from event', async () => {
      mockPrisma.rentBilling.findMany.mockResolvedValue([]);

      await service.handleProcessRemindersEvent({ partnerId: 'partner-001' });

      expect(mockPrisma.rentBilling.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenancy: { partnerId: 'partner-001' },
          }),
        }),
      );
    });

    it('should not throw on errors (logs instead)', async () => {
      mockPrisma.rentBilling.findMany.mockRejectedValue(
        new Error('DB connection failed'),
      );

      // Should not throw — event listener catches errors
      await expect(
        service.handleProcessRemindersEvent({ partnerId: 'partner-001' }),
      ).resolves.toBeUndefined();
    });
  });
});
