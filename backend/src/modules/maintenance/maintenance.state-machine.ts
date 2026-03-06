import { Injectable } from '@nestjs/common';
import { MaintenanceStatus } from '@prisma/client';

import { StateMachine } from '@core/workflows/state-machine.base';

/**
 * Events that trigger maintenance state transitions
 */
export type MaintenanceEvent =
  | 'verify'
  | 'assign'
  | 'start'
  | 'resolve'
  | 'close'
  | 'cancel'
  | 'submit_claim'
  | 'approve_claim'
  | 'reject_claim'
  | 'reopen';

/**
 * State Machine for Maintenance ticket lifecycle
 *
 * Primary flow:
 *   OPEN → VERIFIED → ASSIGNED → IN_PROGRESS → PENDING_APPROVAL → CLOSED
 *
 * Claim flow (alternative):
 *   IN_PROGRESS → CLAIM_SUBMITTED → CLAIM_APPROVED → CLOSED
 *   IN_PROGRESS → CLAIM_SUBMITTED → CLAIM_REJECTED → IN_PROGRESS
 *
 * Cancel:
 *   OPEN | VERIFIED | ASSIGNED → CANCELLED
 *
 * Reopen:
 *   CLOSED → OPEN
 */
@Injectable()
export class MaintenanceStateMachine extends StateMachine<MaintenanceStatus, MaintenanceEvent> {
  protected defineTransitions(): void {
    // ==========================================
    // PRIMARY FLOW
    // ==========================================

    // OPEN → VERIFIED (admin/vendor verifies the issue)
    this.registerTransition({
      from: MaintenanceStatus.OPEN,
      to: MaintenanceStatus.VERIFIED,
      event: 'verify',
    });

    // VERIFIED → ASSIGNED (assign to staff or contractor)
    this.registerTransition({
      from: MaintenanceStatus.VERIFIED,
      to: MaintenanceStatus.ASSIGNED,
      event: 'assign',
      guards: [
        async ({ data }) => {
          // Must have assignedTo in data
          return !!data?.assignedTo;
        },
      ],
    });

    // ASSIGNED → IN_PROGRESS (work has started)
    this.registerTransition({
      from: MaintenanceStatus.ASSIGNED,
      to: MaintenanceStatus.IN_PROGRESS,
      event: 'start',
    });

    // IN_PROGRESS → PENDING_APPROVAL (work completed, awaiting approval)
    this.registerTransition({
      from: MaintenanceStatus.IN_PROGRESS,
      to: MaintenanceStatus.PENDING_APPROVAL,
      event: 'resolve',
      guards: [
        async ({ data }) => {
          // Must have resolution description
          return !!data?.resolution;
        },
      ],
    });

    // PENDING_APPROVAL → CLOSED (approved and closed)
    this.registerTransition({
      from: [MaintenanceStatus.PENDING_APPROVAL, MaintenanceStatus.CLAIM_APPROVED],
      to: MaintenanceStatus.CLOSED,
      event: 'close',
    });

    // ==========================================
    // CLAIM FLOW (alternative path)
    // ==========================================

    // IN_PROGRESS | PENDING_APPROVAL → CLAIM_SUBMITTED (cost claim submitted)
    this.registerTransition({
      from: [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.PENDING_APPROVAL],
      to: MaintenanceStatus.CLAIM_SUBMITTED,
      event: 'submit_claim',
    });

    // CLAIM_SUBMITTED → CLAIM_APPROVED
    this.registerTransition({
      from: MaintenanceStatus.CLAIM_SUBMITTED,
      to: MaintenanceStatus.CLAIM_APPROVED,
      event: 'approve_claim',
    });

    // CLAIM_SUBMITTED → CLAIM_REJECTED (back to in_progress)
    this.registerTransition({
      from: MaintenanceStatus.CLAIM_SUBMITTED,
      to: MaintenanceStatus.CLAIM_REJECTED,
      event: 'reject_claim',
    });

    // ==========================================
    // CANCEL & REOPEN
    // ==========================================

    // OPEN | VERIFIED | ASSIGNED → CANCELLED
    this.registerTransition({
      from: [
        MaintenanceStatus.OPEN,
        MaintenanceStatus.VERIFIED,
        MaintenanceStatus.ASSIGNED,
      ],
      to: MaintenanceStatus.CANCELLED,
      event: 'cancel',
    });

    // CLOSED → OPEN (reopen a closed ticket)
    this.registerTransition({
      from: MaintenanceStatus.CLOSED,
      to: MaintenanceStatus.OPEN,
      event: 'reopen',
    });
  }

  protected defineStates(): void {
    this.registerState({
      name: MaintenanceStatus.OPEN,
      onEnter: async () => {
        // Ticket newly created or reopened
      },
    });

    this.registerState({
      name: MaintenanceStatus.VERIFIED,
      onEnter: async () => {
        // Admin has confirmed the issue is valid
      },
    });

    this.registerState({
      name: MaintenanceStatus.ASSIGNED,
      onEnter: async () => {
        // Technician assigned, awaiting work start
      },
    });

    this.registerState({
      name: MaintenanceStatus.IN_PROGRESS,
      onEnter: async () => {
        // Work has begun
      },
    });

    this.registerState({
      name: MaintenanceStatus.PENDING_APPROVAL,
      onEnter: async () => {
        // Work done, awaiting review
      },
    });

    this.registerState({
      name: MaintenanceStatus.CLAIM_SUBMITTED,
      onEnter: async () => {
        // Cost claim submitted for approval
      },
    });

    this.registerState({
      name: MaintenanceStatus.CLAIM_APPROVED,
      onEnter: async () => {
        // Claim approved, ready to close
      },
    });

    this.registerState({
      name: MaintenanceStatus.CLAIM_REJECTED,
      onEnter: async () => {
        // Claim rejected, may need rework
      },
    });

    this.registerState({
      name: MaintenanceStatus.CLOSED,
      onEnter: async () => {
        // Ticket fully resolved and closed
      },
    });

    this.registerState({
      name: MaintenanceStatus.CANCELLED,
      onEnter: async () => {
        // Ticket cancelled, no work needed
      },
    });
  }

  /**
   * Get available events for the current state
   */
  getAvailableEvents(currentState: MaintenanceStatus): MaintenanceEvent[] {
    const available: MaintenanceEvent[] = [];

    for (const [event, transition] of this.transitions) {
      const validFromStates = Array.isArray(transition.from)
        ? transition.from
        : [transition.from];

      if (validFromStates.includes(currentState)) {
        available.push(event);
      }
    }

    return available;
  }
}
