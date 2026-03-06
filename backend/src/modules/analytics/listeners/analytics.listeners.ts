import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { QueueService } from '@infrastructure/queue/queue.service';
import { QUEUE_NAMES } from '@infrastructure/queue/queue.constants';
import { ANALYTICS_EVENT_TYPES, type EventTrackJob } from '@infrastructure/queue/job-types';
import type { DomainEvent } from '@infrastructure/events/domain-event.interface';

interface ListingViewedPayload {
  listingId: string;
  vendorId: string;
  verticalType: string;
}

interface InteractionCreatedPayload {
  interactionId: string;
  partnerId: string;
  vendorId: string;
  listingId: string;
  interactionType: string;
  verticalType?: string;
}

@Injectable()
export class AnalyticsListeners {
  private readonly logger = new Logger(AnalyticsListeners.name);

  constructor(private readonly queueService: QueueService) {}

  @OnEvent('listing.listing.viewed')
  async handleListingViewed(event: DomainEvent<ListingViewedPayload>): Promise<void> {
    if (!event.partnerId) {
      return;
    }

    const payload = event.payload;

    const job: EventTrackJob = {
      type: 'event.track',
      partnerId: event.partnerId,
      eventType: ANALYTICS_EVENT_TYPES.LISTING_VIEW,
      eventCategory: 'listing',
      entityId: payload.listingId,
      entityType: 'listing',
      userId: event.actorId,
      properties: {
        vendorId: payload.vendorId,
        verticalType: payload.verticalType,
      },
      timestamp: event.occurredAt,
    };

    await this.queueService.addLowPriorityJob(
      QUEUE_NAMES.ANALYTICS_PROCESS,
      'analytics.event.track',
      job,
    );
  }

  @OnEvent('interaction.created')
  async handleInteractionCreated(payload: InteractionCreatedPayload): Promise<void> {
    // Existing code emits a raw object (not a DomainEvent)
    if (!payload.partnerId) {
      return;
    }

    const job: EventTrackJob = {
      type: 'event.track',
      partnerId: payload.partnerId,
      eventType: 'interaction.created',
      eventCategory: 'interaction',
      entityId: payload.interactionId,
      entityType: 'interaction',
      properties: {
        vendorId: payload.vendorId,
        listingId: payload.listingId,
        interactionType: payload.interactionType,
        verticalType: payload.verticalType,
      },
      timestamp: new Date().toISOString(),
    };

    await this.queueService.addLowPriorityJob(
      QUEUE_NAMES.ANALYTICS_PROCESS,
      'analytics.event.track',
      job,
    );
  }
}
