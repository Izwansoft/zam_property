import { Injectable } from '@nestjs/common';
import { TenancyStatus } from '@prisma/client';

import { StateMachine } from '@core/workflows/state-machine.base';

/**
 * Events that trigger tenancy state transitions
 */
export type TenancyEvent =
  | 'confirm_booking'
  | 'confirm_deposit'
  | 'submit_contract'
  | 'activate'
  | 'request_termination'
  | 'terminate'
  | 'extend'
  | 'cancel'
  | 'hold_maintenance'
  | 'resume_from_hold';

/**
 * State Machine for Tenancy lifecycle
 *
 * Valid transitions:
 * - DRAFT → BOOKED (confirm_booking) - Booking confirmed
 * - DRAFT → TERMINATED (cancel) - Application cancelled
 * - BOOKED → DEPOSIT_PAID (confirm_deposit) - Deposit received
 * - BOOKED → TERMINATED (cancel) - Booking cancelled
 * - DEPOSIT_PAID → CONTRACT_PENDING (submit_contract) - Contract ready
 * - CONTRACT_PENDING → ACTIVE (activate) - Contract signed, move in
 * - ACTIVE → TERMINATION_REQUESTED (request_termination) - Termination notice
 * - ACTIVE → EXTENDED (extend) - Lease renewed
 * - ACTIVE → MAINTENANCE_HOLD (hold_maintenance) - Maintenance issue
 * - MAINTENANCE_HOLD → ACTIVE (resume_from_hold) - Issue resolved
 * - TERMINATION_REQUESTED → TERMINATED (terminate) - Move out complete
 * - EXTENDED → ACTIVE (activate) - After extension, back to active
 */
@Injectable()
export class TenancyStateMachine extends StateMachine<TenancyStatus, TenancyEvent> {
  protected defineTransitions(): void {
    // DRAFT → BOOKED
    this.registerTransition({
      from: TenancyStatus.DRAFT,
      to: TenancyStatus.BOOKED,
      event: 'confirm_booking',
      guards: [
        async ({ data }) => {
          // Ensure required dates are set
          return true;
        },
      ],
    });

    // DRAFT | BOOKED → TERMINATED (cancel application/booking)
    this.registerTransition({
      from: [TenancyStatus.DRAFT, TenancyStatus.BOOKED],
      to: TenancyStatus.TERMINATED,
      event: 'cancel',
    });

    // BOOKED → DEPOSIT_PAID
    this.registerTransition({
      from: TenancyStatus.BOOKED,
      to: TenancyStatus.DEPOSIT_PAID,
      event: 'confirm_deposit',
      guards: [
        async ({ data }) => {
          // Could check if deposit records exist
          return true;
        },
      ],
    });

    // DEPOSIT_PAID → CONTRACT_PENDING
    this.registerTransition({
      from: TenancyStatus.DEPOSIT_PAID,
      to: TenancyStatus.CONTRACT_PENDING,
      event: 'submit_contract',
    });

    // CONTRACT_PENDING | EXTENDED → ACTIVE
    this.registerTransition({
      from: [TenancyStatus.CONTRACT_PENDING, TenancyStatus.EXTENDED],
      to: TenancyStatus.ACTIVE,
      event: 'activate',
      guards: [
        async ({ data }) => {
          // Could check if contract is fully signed
          return true;
        },
      ],
    });

    // ACTIVE → TERMINATION_REQUESTED
    this.registerTransition({
      from: TenancyStatus.ACTIVE,
      to: TenancyStatus.TERMINATION_REQUESTED,
      event: 'request_termination',
    });

    // ACTIVE → EXTENDED
    this.registerTransition({
      from: TenancyStatus.ACTIVE,
      to: TenancyStatus.EXTENDED,
      event: 'extend',
      guards: [
        async ({ data }) => {
          // Could check if new lease dates are valid
          return true;
        },
      ],
    });

    // ACTIVE → MAINTENANCE_HOLD
    this.registerTransition({
      from: TenancyStatus.ACTIVE,
      to: TenancyStatus.MAINTENANCE_HOLD,
      event: 'hold_maintenance',
    });

    // MAINTENANCE_HOLD → ACTIVE
    this.registerTransition({
      from: TenancyStatus.MAINTENANCE_HOLD,
      to: TenancyStatus.ACTIVE,
      event: 'resume_from_hold',
    });

    // TERMINATION_REQUESTED → TERMINATED
    this.registerTransition({
      from: TenancyStatus.TERMINATION_REQUESTED,
      to: TenancyStatus.TERMINATED,
      event: 'terminate',
    });

    // Note: EXTENDED → ACTIVE handled above in 'activate' transition via from[]
  }

  protected defineStates(): void {
    this.registerState({
      name: TenancyStatus.DRAFT,
      onEnter: async () => {
        // Initial state, no special action
      },
    });

    this.registerState({
      name: TenancyStatus.BOOKED,
      onEnter: async () => {
        // Send booking confirmation notification
      },
    });

    this.registerState({
      name: TenancyStatus.DEPOSIT_PAID,
      onEnter: async () => {
        // Trigger contract generation
      },
    });

    this.registerState({
      name: TenancyStatus.CONTRACT_PENDING,
      onEnter: async () => {
        // Notify parties to sign contract
      },
    });

    this.registerState({
      name: TenancyStatus.ACTIVE,
      onEnter: async () => {
        // Tenant has moved in
        // Start billing cycle
      },
    });

    this.registerState({
      name: TenancyStatus.MAINTENANCE_HOLD,
      onEnter: async () => {
        // Hold billing if needed
      },
    });

    this.registerState({
      name: TenancyStatus.TERMINATION_REQUESTED,
      onEnter: async () => {
        // Schedule move-out inspection
      },
    });

    this.registerState({
      name: TenancyStatus.TERMINATED,
      onEnter: async () => {
        // Finalize deposit refunds
        // Mark property as available
      },
    });

    this.registerState({
      name: TenancyStatus.EXTENDED,
      onEnter: async () => {
        // Process renewal terms
        // Generate new contract if needed
      },
    });
  }

  /**
   * Check if a transition is valid from current state
   */
  canTransition(currentState: TenancyStatus, event: TenancyEvent): boolean {
    const transitionDef = this.transitions.get(event);
    if (!transitionDef) return false;

    const validFromStates = Array.isArray(transitionDef.from)
      ? transitionDef.from
      : [transitionDef.from];

    return validFromStates.includes(currentState);
  }

  /**
   * Get available events for a given state
   */
  getAvailableEvents(currentState: TenancyStatus): TenancyEvent[] {
    const available: TenancyEvent[] = [];

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

  /**
   * Get the target state for an event from the current state
   * Overrides the base class method
   */
  override getTargetState(currentState: TenancyStatus, event: TenancyEvent): TenancyStatus | null {
    return super.getTargetState(currentState, event);
  }
}
