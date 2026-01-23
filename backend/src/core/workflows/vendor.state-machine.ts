import { Injectable } from '@nestjs/common';
import { VendorStatus } from '@prisma/client';

import { StateMachine } from './state-machine.base';

/**
 * Events that trigger vendor state transitions
 */
export type VendorEvent = 'approve' | 'reject' | 'suspend' | 'reactivate';

/**
 * State Machine for Vendor lifecycle
 *
 * Valid transitions:
 * - PENDING → APPROVED (approve)
 * - PENDING → REJECTED (reject)
 * - APPROVED → SUSPENDED (suspend)
 * - SUSPENDED/REJECTED → APPROVED (reactivate)
 */
@Injectable()
export class VendorStateMachine extends StateMachine<VendorStatus, VendorEvent> {
  protected defineTransitions(): void {
    // PENDING → APPROVED
    this.registerTransition({
      from: VendorStatus.PENDING,
      to: VendorStatus.APPROVED,
      event: 'approve',
      guards: [
        async () => {
          // Could validate approval criteria
          // E.g., check if approvedBy user exists
          return true;
        },
      ],
      after: async () => {
        // Side effects: approvedAt, approvedBy set by service
      },
    });

    // PENDING → REJECTED
    this.registerTransition({
      from: VendorStatus.PENDING,
      to: VendorStatus.REJECTED,
      event: 'reject',
      guards: [
        async ({ data }) => {
          // Validate that rejection reason is provided
          if (!data?.rejectionReason) {
            return false;
          }
          return true;
        },
      ],
      after: async () => {
        // Side effects: rejectedAt, rejectedBy, rejectionReason set by service
      },
    });

    // APPROVED → SUSPENDED
    this.registerTransition({
      from: VendorStatus.APPROVED,
      to: VendorStatus.SUSPENDED,
      event: 'suspend',
      after: async () => {
        // Side effects: suspendedAt set by service
        // Could trigger notification to vendor
      },
    });

    // SUSPENDED/REJECTED → APPROVED
    this.registerTransition({
      from: [VendorStatus.SUSPENDED, VendorStatus.REJECTED],
      to: VendorStatus.APPROVED,
      event: 'reactivate',
      after: async () => {
        // Side effects: clear suspension/rejection fields
      },
    });
  }

  protected defineStates(): void {
    this.registerState({
      name: VendorStatus.PENDING,
      onEnter: async () => {
        // Optional: Actions when vendor becomes pending
      },
    });

    this.registerState({
      name: VendorStatus.APPROVED,
      onEnter: async () => {
        // Optional: Send approval notification
      },
    });

    this.registerState({
      name: VendorStatus.REJECTED,
      onEnter: async () => {
        // Optional: Send rejection notification
      },
    });

    this.registerState({
      name: VendorStatus.SUSPENDED,
      onEnter: async () => {
        // Optional: Send suspension notification
      },
    });
  }
}
