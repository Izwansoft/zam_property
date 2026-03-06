/**
 * MaintenanceStateMachine Unit Tests
 * Session 7.2 - Maintenance Workflow
 *
 * Tests state machine transitions for the maintenance ticket lifecycle.
 */

import { MaintenanceStatus } from '@prisma/client';

import { MaintenanceStateMachine } from './maintenance.state-machine';

describe('MaintenanceStateMachine', () => {
  let stateMachine: MaintenanceStateMachine;

  beforeEach(() => {
    stateMachine = new MaintenanceStateMachine();
  });

  // ============================================
  // PRIMARY FLOW
  // ============================================

  describe('Primary flow: OPEN → VERIFIED → ASSIGNED → IN_PROGRESS → PENDING_APPROVAL → CLOSED', () => {
    it('should transition OPEN → VERIFIED via verify', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.OPEN, 'verify');
      expect(result.success).toBe(true);
      expect(result.toState).toBe(MaintenanceStatus.VERIFIED);
    });

    it('should transition VERIFIED → ASSIGNED via assign (with assignedTo)', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.VERIFIED, 'assign', {
        assignedTo: 'staff-001',
      });
      expect(result.success).toBe(true);
      expect(result.toState).toBe(MaintenanceStatus.ASSIGNED);
    });

    it('should reject assign without assignedTo', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.VERIFIED, 'assign', {});
      expect(result.success).toBe(false);
    });

    it('should transition ASSIGNED → IN_PROGRESS via start', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.ASSIGNED, 'start');
      expect(result.success).toBe(true);
      expect(result.toState).toBe(MaintenanceStatus.IN_PROGRESS);
    });

    it('should transition IN_PROGRESS → PENDING_APPROVAL via resolve (with resolution)', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.IN_PROGRESS, 'resolve', {
        resolution: 'Fixed the issue',
      });
      expect(result.success).toBe(true);
      expect(result.toState).toBe(MaintenanceStatus.PENDING_APPROVAL);
    });

    it('should reject resolve without resolution', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.IN_PROGRESS, 'resolve', {});
      expect(result.success).toBe(false);
    });

    it('should transition PENDING_APPROVAL → CLOSED via close', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.PENDING_APPROVAL, 'close');
      expect(result.success).toBe(true);
      expect(result.toState).toBe(MaintenanceStatus.CLOSED);
    });
  });

  // ============================================
  // CLAIM FLOW
  // ============================================

  describe('Claim flow', () => {
    it('should transition IN_PROGRESS → CLAIM_SUBMITTED via submit_claim', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.IN_PROGRESS, 'submit_claim');
      expect(result.success).toBe(true);
      expect(result.toState).toBe(MaintenanceStatus.CLAIM_SUBMITTED);
    });

    it('should transition PENDING_APPROVAL → CLAIM_SUBMITTED via submit_claim', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.PENDING_APPROVAL, 'submit_claim');
      expect(result.success).toBe(true);
      expect(result.toState).toBe(MaintenanceStatus.CLAIM_SUBMITTED);
    });

    it('should transition CLAIM_SUBMITTED → CLAIM_APPROVED via approve_claim', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.CLAIM_SUBMITTED, 'approve_claim');
      expect(result.success).toBe(true);
      expect(result.toState).toBe(MaintenanceStatus.CLAIM_APPROVED);
    });

    it('should transition CLAIM_SUBMITTED → CLAIM_REJECTED via reject_claim', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.CLAIM_SUBMITTED, 'reject_claim');
      expect(result.success).toBe(true);
      expect(result.toState).toBe(MaintenanceStatus.CLAIM_REJECTED);
    });

    it('should transition CLAIM_APPROVED → CLOSED via close', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.CLAIM_APPROVED, 'close');
      expect(result.success).toBe(true);
      expect(result.toState).toBe(MaintenanceStatus.CLOSED);
    });
  });

  // ============================================
  // CANCEL & REOPEN
  // ============================================

  describe('Cancel and Reopen', () => {
    it('should cancel from OPEN', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.OPEN, 'cancel');
      expect(result.success).toBe(true);
      expect(result.toState).toBe(MaintenanceStatus.CANCELLED);
    });

    it('should cancel from VERIFIED', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.VERIFIED, 'cancel');
      expect(result.success).toBe(true);
      expect(result.toState).toBe(MaintenanceStatus.CANCELLED);
    });

    it('should cancel from ASSIGNED', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.ASSIGNED, 'cancel');
      expect(result.success).toBe(true);
      expect(result.toState).toBe(MaintenanceStatus.CANCELLED);
    });

    it('should NOT cancel from IN_PROGRESS', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.IN_PROGRESS, 'cancel');
      expect(result.success).toBe(false);
    });

    it('should reopen from CLOSED', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.CLOSED, 'reopen');
      expect(result.success).toBe(true);
      expect(result.toState).toBe(MaintenanceStatus.OPEN);
    });
  });

  // ============================================
  // INVALID TRANSITIONS
  // ============================================

  describe('Invalid transitions', () => {
    it('should reject verify from ASSIGNED', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.ASSIGNED, 'verify');
      expect(result.success).toBe(false);
    });

    it('should reject start from OPEN (must be ASSIGNED)', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.OPEN, 'start');
      expect(result.success).toBe(false);
    });

    it('should reject resolve from OPEN', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.OPEN, 'resolve', {
        resolution: 'test',
      });
      expect(result.success).toBe(false);
    });

    it('should reject close from OPEN', async () => {
      const result = await stateMachine.transition(MaintenanceStatus.OPEN, 'close');
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // AVAILABLE EVENTS
  // ============================================

  describe('getAvailableEvents', () => {
    it('should return verify and cancel for OPEN', () => {
      const events = stateMachine.getAvailableEvents(MaintenanceStatus.OPEN);
      expect(events).toContain('verify');
      expect(events).toContain('cancel');
      expect(events).not.toContain('assign');
    });

    it('should return assign and cancel for VERIFIED', () => {
      const events = stateMachine.getAvailableEvents(MaintenanceStatus.VERIFIED);
      expect(events).toContain('assign');
      expect(events).toContain('cancel');
    });

    it('should return start and cancel for ASSIGNED', () => {
      const events = stateMachine.getAvailableEvents(MaintenanceStatus.ASSIGNED);
      expect(events).toContain('start');
      expect(events).toContain('cancel');
    });

    it('should return resolve and submit_claim for IN_PROGRESS', () => {
      const events = stateMachine.getAvailableEvents(MaintenanceStatus.IN_PROGRESS);
      expect(events).toContain('resolve');
      expect(events).toContain('submit_claim');
    });

    it('should return close and submit_claim for PENDING_APPROVAL', () => {
      const events = stateMachine.getAvailableEvents(MaintenanceStatus.PENDING_APPROVAL);
      expect(events).toContain('close');
      expect(events).toContain('submit_claim');
    });

    it('should return reopen for CLOSED', () => {
      const events = stateMachine.getAvailableEvents(MaintenanceStatus.CLOSED);
      expect(events).toContain('reopen');
    });

    it('should return nothing for CANCELLED', () => {
      const events = stateMachine.getAvailableEvents(MaintenanceStatus.CANCELLED);
      expect(events).toHaveLength(0);
    });
  });
});
