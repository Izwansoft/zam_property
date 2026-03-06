/**
 * TenancyStateMachine Unit Tests
 * Session 5.8 - Phase 5 Testing & Integration
 *
 * Tests all valid and invalid state transitions in the tenancy lifecycle.
 */

import { TenancyStatus } from '@prisma/client';

import { TenancyStateMachine, TenancyEvent } from './tenancy.state-machine';

describe('TenancyStateMachine', () => {
  let stateMachine: TenancyStateMachine;

  beforeEach(() => {
    stateMachine = new TenancyStateMachine();
  });

  // ─────────────────────────────────────────────────────────
  // Valid Transitions
  // ─────────────────────────────────────────────────────────

  describe('Valid Transitions', () => {
    const validTransitions: Array<{
      from: TenancyStatus;
      event: TenancyEvent;
      to: TenancyStatus;
      description: string;
    }> = [
      {
        from: TenancyStatus.DRAFT,
        event: 'confirm_booking',
        to: TenancyStatus.BOOKED,
        description: 'DRAFT → BOOKED (confirm booking)',
      },
      {
        from: TenancyStatus.DRAFT,
        event: 'cancel',
        to: TenancyStatus.TERMINATED,
        description: 'DRAFT → TERMINATED (cancel application)',
      },
      {
        from: TenancyStatus.BOOKED,
        event: 'confirm_deposit',
        to: TenancyStatus.DEPOSIT_PAID,
        description: 'BOOKED → DEPOSIT_PAID (deposit received)',
      },
      {
        from: TenancyStatus.BOOKED,
        event: 'cancel',
        to: TenancyStatus.TERMINATED,
        description: 'BOOKED → TERMINATED (cancel booking)',
      },
      {
        from: TenancyStatus.DEPOSIT_PAID,
        event: 'submit_contract',
        to: TenancyStatus.CONTRACT_PENDING,
        description: 'DEPOSIT_PAID → CONTRACT_PENDING (contract submitted)',
      },
      {
        from: TenancyStatus.CONTRACT_PENDING,
        event: 'activate',
        to: TenancyStatus.ACTIVE,
        description: 'CONTRACT_PENDING → ACTIVE (contract signed)',
      },
      {
        from: TenancyStatus.ACTIVE,
        event: 'request_termination',
        to: TenancyStatus.TERMINATION_REQUESTED,
        description: 'ACTIVE → TERMINATION_REQUESTED (notice given)',
      },
      {
        from: TenancyStatus.ACTIVE,
        event: 'extend',
        to: TenancyStatus.EXTENDED,
        description: 'ACTIVE → EXTENDED (lease renewed)',
      },
      {
        from: TenancyStatus.ACTIVE,
        event: 'hold_maintenance',
        to: TenancyStatus.MAINTENANCE_HOLD,
        description: 'ACTIVE → MAINTENANCE_HOLD (maintenance issue)',
      },
      {
        from: TenancyStatus.MAINTENANCE_HOLD,
        event: 'resume_from_hold',
        to: TenancyStatus.ACTIVE,
        description: 'MAINTENANCE_HOLD → ACTIVE (issue resolved)',
      },
      {
        from: TenancyStatus.TERMINATION_REQUESTED,
        event: 'terminate',
        to: TenancyStatus.TERMINATED,
        description: 'TERMINATION_REQUESTED → TERMINATED (move out)',
      },
      {
        from: TenancyStatus.EXTENDED,
        event: 'activate',
        to: TenancyStatus.ACTIVE,
        description: 'EXTENDED → ACTIVE (renewal processed)',
      },
    ];

    it.each(validTransitions)(
      'should allow: $description',
      async ({ from, event, to }) => {
        const result = await stateMachine.transition(from, event);

        expect(result.success).toBe(true);
        expect(result.fromState).toBe(from);
        expect(result.toState).toBe(to);
        expect(result.error).toBeUndefined();
      },
    );
  });

  // ─────────────────────────────────────────────────────────
  // Invalid Transitions
  // ─────────────────────────────────────────────────────────

  describe('Invalid Transitions', () => {
    const invalidTransitions: Array<{
      from: TenancyStatus;
      event: TenancyEvent;
      description: string;
    }> = [
      {
        from: TenancyStatus.DRAFT,
        event: 'activate',
        description: 'DRAFT cannot activate directly',
      },
      {
        from: TenancyStatus.DRAFT,
        event: 'terminate',
        description: 'DRAFT cannot terminate directly',
      },
      {
        from: TenancyStatus.BOOKED,
        event: 'activate',
        description: 'BOOKED cannot activate without contract',
      },
      {
        from: TenancyStatus.DEPOSIT_PAID,
        event: 'activate',
        description: 'DEPOSIT_PAID cannot activate without contract submission',
      },
      {
        from: TenancyStatus.ACTIVE,
        event: 'confirm_booking',
        description: 'ACTIVE cannot confirm booking again',
      },
      {
        from: TenancyStatus.ACTIVE,
        event: 'confirm_deposit',
        description: 'ACTIVE cannot confirm deposit',
      },
      {
        from: TenancyStatus.TERMINATED,
        event: 'activate',
        description: 'TERMINATED cannot be activated',
      },
      {
        from: TenancyStatus.TERMINATED,
        event: 'extend',
        description: 'TERMINATED cannot be extended',
      },
      {
        from: TenancyStatus.TERMINATED,
        event: 'confirm_booking',
        description: 'TERMINATED cannot be booked again',
      },
      {
        from: TenancyStatus.CONTRACT_PENDING,
        event: 'extend',
        description: 'CONTRACT_PENDING cannot extend',
      },
      {
        from: TenancyStatus.MAINTENANCE_HOLD,
        event: 'terminate',
        description: 'MAINTENANCE_HOLD cannot terminate directly',
      },
    ];

    it.each(invalidTransitions)(
      'should reject: $description',
      async ({ from, event }) => {
        const result = await stateMachine.transition(from, event);

        expect(result.success).toBe(false);
        expect(result.fromState).toBe(from);
        expect(result.toState).toBe(from); // stays in same state
        expect(result.error).toBeDefined();
      },
    );
  });

  // ─────────────────────────────────────────────────────────
  // canTransition
  // ─────────────────────────────────────────────────────────

  describe('canTransition', () => {
    it('should return true for valid transitions', () => {
      expect(stateMachine.canTransition(TenancyStatus.DRAFT, 'confirm_booking')).toBe(true);
      expect(stateMachine.canTransition(TenancyStatus.BOOKED, 'confirm_deposit')).toBe(true);
      expect(stateMachine.canTransition(TenancyStatus.ACTIVE, 'request_termination')).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      expect(stateMachine.canTransition(TenancyStatus.DRAFT, 'activate')).toBe(false);
      expect(stateMachine.canTransition(TenancyStatus.TERMINATED, 'activate')).toBe(false);
      expect(stateMachine.canTransition(TenancyStatus.ACTIVE, 'confirm_booking')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────
  // getAvailableEvents
  // ─────────────────────────────────────────────────────────

  describe('getAvailableEvents', () => {
    it('should return confirm_booking and cancel for DRAFT', () => {
      const events = stateMachine.getAvailableEvents(TenancyStatus.DRAFT);
      expect(events).toContain('confirm_booking');
      expect(events).toContain('cancel');
      expect(events).not.toContain('activate');
    });

    it('should return confirm_deposit and cancel for BOOKED', () => {
      const events = stateMachine.getAvailableEvents(TenancyStatus.BOOKED);
      expect(events).toContain('confirm_deposit');
      expect(events).toContain('cancel');
    });

    it('should return request_termination, extend, hold_maintenance for ACTIVE', () => {
      const events = stateMachine.getAvailableEvents(TenancyStatus.ACTIVE);
      expect(events).toContain('request_termination');
      expect(events).toContain('extend');
      expect(events).toContain('hold_maintenance');
      expect(events).not.toContain('confirm_booking');
    });

    it('should return empty for TERMINATED', () => {
      const events = stateMachine.getAvailableEvents(TenancyStatus.TERMINATED);
      expect(events).toHaveLength(0);
    });

    it('should return submit_contract for DEPOSIT_PAID', () => {
      const events = stateMachine.getAvailableEvents(TenancyStatus.DEPOSIT_PAID);
      expect(events).toContain('submit_contract');
    });

    it('should return activate for CONTRACT_PENDING', () => {
      const events = stateMachine.getAvailableEvents(TenancyStatus.CONTRACT_PENDING);
      expect(events).toContain('activate');
    });

    it('should return terminate for TERMINATION_REQUESTED', () => {
      const events = stateMachine.getAvailableEvents(TenancyStatus.TERMINATION_REQUESTED);
      expect(events).toContain('terminate');
    });

    it('should return resume_from_hold for MAINTENANCE_HOLD', () => {
      const events = stateMachine.getAvailableEvents(TenancyStatus.MAINTENANCE_HOLD);
      expect(events).toContain('resume_from_hold');
    });
  });

  // ─────────────────────────────────────────────────────────
  // getTargetState
  // ─────────────────────────────────────────────────────────

  describe('getTargetState', () => {
    it('should return BOOKED for DRAFT + confirm_booking', () => {
      expect(stateMachine.getTargetState(TenancyStatus.DRAFT, 'confirm_booking')).toBe(
        TenancyStatus.BOOKED,
      );
    });

    it('should return ACTIVE for CONTRACT_PENDING + activate', () => {
      expect(stateMachine.getTargetState(TenancyStatus.CONTRACT_PENDING, 'activate')).toBe(
        TenancyStatus.ACTIVE,
      );
    });

    it('should return null for invalid transition', () => {
      expect(stateMachine.getTargetState(TenancyStatus.DRAFT, 'activate')).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────
  // Full Lifecycle
  // ─────────────────────────────────────────────────────────

  describe('Full Lifecycle: DRAFT → TERMINATED', () => {
    it('should transition through the complete happy path', async () => {
      let currentState: TenancyStatus = TenancyStatus.DRAFT;

      // DRAFT → BOOKED
      let result = await stateMachine.transition(currentState, 'confirm_booking');
      expect(result.success).toBe(true);
      currentState = result.toState as TenancyStatus;
      expect(currentState).toBe(TenancyStatus.BOOKED);

      // BOOKED → DEPOSIT_PAID
      result = await stateMachine.transition(currentState, 'confirm_deposit');
      expect(result.success).toBe(true);
      currentState = result.toState as TenancyStatus;
      expect(currentState).toBe(TenancyStatus.DEPOSIT_PAID);

      // DEPOSIT_PAID → CONTRACT_PENDING
      result = await stateMachine.transition(currentState, 'submit_contract');
      expect(result.success).toBe(true);
      currentState = result.toState as TenancyStatus;
      expect(currentState).toBe(TenancyStatus.CONTRACT_PENDING);

      // CONTRACT_PENDING → ACTIVE
      result = await stateMachine.transition(currentState, 'activate');
      expect(result.success).toBe(true);
      currentState = result.toState as TenancyStatus;
      expect(currentState).toBe(TenancyStatus.ACTIVE);

      // ACTIVE → TERMINATION_REQUESTED
      result = await stateMachine.transition(currentState, 'request_termination');
      expect(result.success).toBe(true);
      currentState = result.toState as TenancyStatus;
      expect(currentState).toBe(TenancyStatus.TERMINATION_REQUESTED);

      // TERMINATION_REQUESTED → TERMINATED
      result = await stateMachine.transition(currentState, 'terminate');
      expect(result.success).toBe(true);
      currentState = result.toState as TenancyStatus;
      expect(currentState).toBe(TenancyStatus.TERMINATED);
    });

    it('should transition through the extension path', async () => {
      let currentState: TenancyStatus = TenancyStatus.ACTIVE;

      // ACTIVE → EXTENDED
      let result = await stateMachine.transition(currentState, 'extend');
      expect(result.success).toBe(true);
      currentState = result.toState as TenancyStatus;
      expect(currentState).toBe(TenancyStatus.EXTENDED);

      // EXTENDED → ACTIVE
      result = await stateMachine.transition(currentState, 'activate');
      expect(result.success).toBe(true);
      currentState = result.toState as TenancyStatus;
      expect(currentState).toBe(TenancyStatus.ACTIVE);
    });

    it('should transition through the maintenance hold path', async () => {
      let currentState: TenancyStatus = TenancyStatus.ACTIVE;

      // ACTIVE → MAINTENANCE_HOLD
      let result = await stateMachine.transition(currentState, 'hold_maintenance');
      expect(result.success).toBe(true);
      currentState = result.toState as TenancyStatus;
      expect(currentState).toBe(TenancyStatus.MAINTENANCE_HOLD);

      // MAINTENANCE_HOLD → ACTIVE
      result = await stateMachine.transition(currentState, 'resume_from_hold');
      expect(result.success).toBe(true);
      currentState = result.toState as TenancyStatus;
      expect(currentState).toBe(TenancyStatus.ACTIVE);
    });

    it('should allow cancel from DRAFT', async () => {
      const result = await stateMachine.transition(TenancyStatus.DRAFT, 'cancel');
      expect(result.success).toBe(true);
      expect(result.toState).toBe(TenancyStatus.TERMINATED);
    });

    it('should allow cancel from BOOKED', async () => {
      const result = await stateMachine.transition(TenancyStatus.BOOKED, 'cancel');
      expect(result.success).toBe(true);
      expect(result.toState).toBe(TenancyStatus.TERMINATED);
    });
  });
});
