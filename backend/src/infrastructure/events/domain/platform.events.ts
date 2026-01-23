import { BaseDomainEvent, EventOptionsWithoutType } from '../base-domain-event';

// ─────────────────────────────────────────────────────────────────────────────
// ENTITLEMENT EVENTS
// Per Part 28: Subscription entitlement tracking events
// ─────────────────────────────────────────────────────────────────────────────

export interface EntitlementComputedPayload {
  tenantId: string;
  subscriptionId: string;
  planId: string;
  entitlements: Record<string, number | boolean | string>;
}

export class EntitlementComputedEvent extends BaseDomainEvent<EntitlementComputedPayload> {
  constructor(options: EventOptionsWithoutType<EntitlementComputedPayload>) {
    super(
      {
        ...options,
        eventType: 'entitlement.entitlement.computed',
      },
      '1.0',
    );
  }
}

export interface EntitlementExceededPayload {
  tenantId: string;
  metricKey: string;
  currentValue: number;
  limitValue: number;
}

export class EntitlementExceededEvent extends BaseDomainEvent<EntitlementExceededPayload> {
  constructor(options: EventOptionsWithoutType<EntitlementExceededPayload>) {
    super(
      {
        ...options,
        eventType: 'entitlement.entitlement.exceeded',
      },
      '1.0',
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// USAGE EVENTS
// Per Part 28: Usage tracking and threshold events
// ─────────────────────────────────────────────────────────────────────────────

export interface UsageIncrementedPayload {
  tenantId: string;
  metricKey: string;
  incrementBy: number;
  newTotal: number;
  periodStart: string;
  periodEnd: string;
}

export class UsageIncrementedEvent extends BaseDomainEvent<UsageIncrementedPayload> {
  constructor(options: EventOptionsWithoutType<UsageIncrementedPayload>) {
    super(
      {
        ...options,
        eventType: 'usage.usage.incremented',
      },
      '1.0',
    );
  }
}

export interface UsageThresholdWarningPayload {
  tenantId: string;
  metricKey: string;
  currentValue: number;
  threshold: number;
  percentage: number;
}

export class UsageThresholdWarningEvent extends BaseDomainEvent<UsageThresholdWarningPayload> {
  constructor(options: EventOptionsWithoutType<UsageThresholdWarningPayload>) {
    super(
      {
        ...options,
        eventType: 'usage.threshold.warning',
      },
      '1.0',
    );
  }
}

export interface UsagePeriodResetPayload {
  tenantId: string;
  metricKey: string;
  previousTotal: number;
  newPeriodStart: string;
}

export class UsagePeriodResetEvent extends BaseDomainEvent<UsagePeriodResetPayload> {
  constructor(options: EventOptionsWithoutType<UsagePeriodResetPayload>) {
    super(
      {
        ...options,
        eventType: 'usage.period.reset',
      },
      '1.0',
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH EVENTS (INTERNAL)
// Per Part 28: Search indexing operations
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchIndexRequestedPayload {
  documentType: string;
  documentId: string;
  tenantId: string;
  operation: 'index' | 'delete';
}

export class SearchIndexRequestedEvent extends BaseDomainEvent<SearchIndexRequestedPayload> {
  constructor(options: EventOptionsWithoutType<SearchIndexRequestedPayload>) {
    super(
      {
        ...options,
        eventType: 'search.index.requested',
      },
      '1.0',
    );
  }
}

export interface SearchIndexCompletedPayload {
  documentType: string;
  documentId: string;
  tenantId: string;
  operation: 'index' | 'delete';
  success: boolean;
  error?: string;
}

export class SearchIndexCompletedEvent extends BaseDomainEvent<SearchIndexCompletedPayload> {
  constructor(options: EventOptionsWithoutType<SearchIndexCompletedPayload>) {
    super(
      {
        ...options,
        eventType: 'search.index.completed',
      },
      '1.0',
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION EVENTS
// Per Part 28: Notification delivery events
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationCreatedPayload {
  notificationId: string;
  tenantId?: string;
  userId: string;
  type: string;
  channels: string[];
}

export class NotificationCreatedEvent extends BaseDomainEvent<NotificationCreatedPayload> {
  constructor(options: EventOptionsWithoutType<NotificationCreatedPayload>) {
    super(
      {
        ...options,
        eventType: 'notification.notification.created',
      },
      '1.0',
    );
  }
}

export interface NotificationDeliveryCompletedPayload {
  notificationId: string;
  channel: string;
  success: boolean;
  error?: string;
}

export class NotificationDeliveryCompletedEvent extends BaseDomainEvent<NotificationDeliveryCompletedPayload> {
  constructor(options: EventOptionsWithoutType<NotificationDeliveryCompletedPayload>) {
    super(
      {
        ...options,
        eventType: 'notification.delivery.completed',
      },
      '1.0',
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE FLAG EVENTS
// Per Part 28: Feature flag configuration changes
// ─────────────────────────────────────────────────────────────────────────────

export interface FeatureFlagUpdatedPayload {
  flagKey: string;
  previousValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
  updatedBy: string;
}

export class FeatureFlagUpdatedEvent extends BaseDomainEvent<FeatureFlagUpdatedPayload> {
  constructor(options: EventOptionsWithoutType<FeatureFlagUpdatedPayload>) {
    super(
      {
        ...options,
        eventType: 'feature_flag.flag.updated',
      },
      '1.0',
    );
  }
}
