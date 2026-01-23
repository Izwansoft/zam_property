import { Injectable } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';

import { StateMachine } from './state-machine.base';

/**
 * Events that trigger listing state transitions
 */
export type ListingEvent = 'publish' | 'unpublish' | 'expire' | 'archive' | 'feature' | 'unfeature';

/**
 * State Machine for Listing lifecycle
 *
 * Valid transitions:
 * - DRAFT → PUBLISHED (publish)
 * - PUBLISHED → DRAFT (unpublish)
 * - PUBLISHED → EXPIRED (expire)
 * - DRAFT/PUBLISHED/EXPIRED → ARCHIVED (archive)
 *
 * Feature status is independent of listing status and not modeled as a state.
 */
@Injectable()
export class ListingStateMachine extends StateMachine<ListingStatus, ListingEvent> {
  protected defineTransitions(): void {
    // DRAFT → PUBLISHED
    this.registerTransition({
      from: ListingStatus.DRAFT,
      to: ListingStatus.PUBLISHED,
      event: 'publish',
      guards: [
        // Could add guards here, e.g., validate required fields
        async () => {
          // Example: Check if listing has minimum required data
          // In practice, this would be more comprehensive
          return true;
        },
      ],
      after: async () => {
        // Side effects handled by service (publishedAt, expiresAt)
        // Event emission handled by service
      },
    });

    // PUBLISHED → DRAFT
    this.registerTransition({
      from: ListingStatus.PUBLISHED,
      to: ListingStatus.DRAFT,
      event: 'unpublish',
      after: async () => {
        // Side effects: clear publishedAt
      },
    });

    // PUBLISHED → EXPIRED
    this.registerTransition({
      from: ListingStatus.PUBLISHED,
      to: ListingStatus.EXPIRED,
      event: 'expire',
      after: async () => {
        // Side effects handled by service
      },
    });

    // ANY → ARCHIVED (except already ARCHIVED)
    this.registerTransition({
      from: [ListingStatus.DRAFT, ListingStatus.PUBLISHED, ListingStatus.EXPIRED],
      to: ListingStatus.ARCHIVED,
      event: 'archive',
      after: async () => {
        // Side effects handled by service
      },
    });
  }

  protected defineStates(): void {
    // Define state configurations if needed
    this.registerState({
      name: ListingStatus.DRAFT,
      onEnter: async () => {
        // Optional: Actions when entering DRAFT state
      },
    });

    this.registerState({
      name: ListingStatus.PUBLISHED,
      onEnter: async () => {
        // Optional: Actions when entering PUBLISHED state
      },
    });

    this.registerState({
      name: ListingStatus.EXPIRED,
      onEnter: async () => {
        // Optional: Actions when entering EXPIRED state
      },
    });

    this.registerState({
      name: ListingStatus.ARCHIVED,
      onEnter: async () => {
        // Optional: Actions when entering ARCHIVED state
      },
    });
  }
}
