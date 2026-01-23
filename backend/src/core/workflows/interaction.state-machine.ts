import { Injectable } from '@nestjs/common';

import { StateMachine } from './state-machine.base';

/**
 * Interaction Status Enum
 * (Placeholder until Interaction entity is created in Session 2.5)
 */
export enum InteractionStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  CONFIRMED = 'CONFIRMED',
  CLOSED = 'CLOSED',
  INVALID = 'INVALID',
}

/**
 * Events that trigger interaction state transitions
 */
export type InteractionEvent = 'contact' | 'confirm' | 'close' | 'invalidate';

/**
 * State Machine for Interaction lifecycle
 *
 * Valid transitions:
 * - NEW → CONTACTED (contact)
 * - CONTACTED → CONFIRMED (confirm)
 * - CONFIRMED → CLOSED (close)
 * - Any → INVALID (invalidate)
 * - Any → CLOSED (close)
 *
 * Note: This is a placeholder implementation for Session 2.2b.
 * The actual Interaction entity will be created in Session 2.5.
 */
@Injectable()
export class InteractionStateMachine extends StateMachine<InteractionStatus, InteractionEvent> {
  protected defineTransitions(): void {
    // NEW → CONTACTED
    this.registerTransition({
      from: InteractionStatus.NEW,
      to: InteractionStatus.CONTACTED,
      event: 'contact',
      after: async () => {
        // Side effects: contactedAt timestamp
      },
    });

    // CONTACTED → CONFIRMED
    this.registerTransition({
      from: InteractionStatus.CONTACTED,
      to: InteractionStatus.CONFIRMED,
      event: 'confirm',
      after: async () => {
        // Side effects: confirmedAt timestamp
      },
    });

    // ANY → CLOSED (normal flow: CONFIRMED → CLOSED)
    this.registerTransition({
      from: [InteractionStatus.NEW, InteractionStatus.CONTACTED, InteractionStatus.CONFIRMED],
      to: InteractionStatus.CLOSED,
      event: 'close',
      after: async () => {
        // Side effects: closedAt timestamp
      },
    });

    // ANY → INVALID (mark as spam/invalid)
    this.registerTransition({
      from: [InteractionStatus.NEW, InteractionStatus.CONTACTED, InteractionStatus.CONFIRMED],
      to: InteractionStatus.INVALID,
      event: 'invalidate',
      after: async () => {
        // Side effects: invalidatedAt timestamp, reason
      },
    });
  }

  protected defineStates(): void {
    this.registerState({
      name: InteractionStatus.NEW,
      onEnter: async () => {
        // Optional: Trigger notification to vendor
      },
    });

    this.registerState({
      name: InteractionStatus.CONTACTED,
      onEnter: async () => {
        // Optional: Track response time metrics
      },
    });

    this.registerState({
      name: InteractionStatus.CONFIRMED,
      onEnter: async () => {
        // Optional: Update conversion metrics
      },
    });

    this.registerState({
      name: InteractionStatus.CLOSED,
      onEnter: async () => {
        // Optional: Cleanup, archive
      },
    });

    this.registerState({
      name: InteractionStatus.INVALID,
      onEnter: async () => {
        // Optional: Update spam metrics
      },
    });
  }
}
