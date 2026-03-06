import { BaseDomainEvent, EventOptionsWithoutType } from '../base-domain-event';

// ─────────────────────────────────────────────────────────────────────────────
// TENANT EVENTS
// Per Part 28: Partner lifecycle and configuration events
// ─────────────────────────────────────────────────────────────────────────────

export interface PartnerCreatedPayload {
  partnerId: string;
  name: string;
  slug: string;
  enabledVerticals: string[];
}

export class PartnerCreatedEvent extends BaseDomainEvent<PartnerCreatedPayload> {
  constructor(options: EventOptionsWithoutType<PartnerCreatedPayload>) {
    super(
      {
        ...options,
        eventType: 'partner.partner.created',
      },
      '1.0',
    );
  }
}

export interface PartnerUpdatedPayload {
  partnerId: string;
  changes: {
    name?: string;
    enabledVerticals?: string[];
    settings?: Record<string, unknown>;
  };
  previousValues: Record<string, unknown>;
}

export class PartnerUpdatedEvent extends BaseDomainEvent<PartnerUpdatedPayload> {
  constructor(options: EventOptionsWithoutType<PartnerUpdatedPayload>) {
    super(
      {
        ...options,
        eventType: 'partner.partner.updated',
      },
      '1.0',
    );
  }
}

export interface PartnerSuspendedPayload {
  partnerId: string;
  reason: string;
  suspendedBy: string;
}

export class PartnerSuspendedEvent extends BaseDomainEvent<PartnerSuspendedPayload> {
  constructor(options: EventOptionsWithoutType<PartnerSuspendedPayload>) {
    super(
      {
        ...options,
        eventType: 'partner.partner.suspended',
      },
      '1.0',
    );
  }
}

export interface PartnerReactivatedPayload {
  partnerId: string;
  reactivatedBy: string;
}

export class PartnerReactivatedEvent extends BaseDomainEvent<PartnerReactivatedPayload> {
  constructor(options: EventOptionsWithoutType<PartnerReactivatedPayload>) {
    super(
      {
        ...options,
        eventType: 'partner.partner.reactivated',
      },
      '1.0',
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// USER EVENTS
// Per Part 28: User authentication and membership events
// ─────────────────────────────────────────────────────────────────────────────

export interface UserRegisteredPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export class UserRegisteredEvent extends BaseDomainEvent<UserRegisteredPayload> {
  constructor(options: EventOptionsWithoutType<UserRegisteredPayload>) {
    super(
      {
        ...options,
        eventType: 'user.user.registered',
      },
      '1.0',
    );
  }
}

export interface UserEmailVerifiedPayload {
  userId: string;
  email: string;
}

export class UserEmailVerifiedEvent extends BaseDomainEvent<UserEmailVerifiedPayload> {
  constructor(options: EventOptionsWithoutType<UserEmailVerifiedPayload>) {
    super(
      {
        ...options,
        eventType: 'user.user.email_verified',
      },
      '1.0',
    );
  }
}

export interface UserPasswordChangedPayload {
  userId: string;
}

export class UserPasswordChangedEvent extends BaseDomainEvent<UserPasswordChangedPayload> {
  constructor(options: EventOptionsWithoutType<UserPasswordChangedPayload>) {
    super(
      {
        ...options,
        eventType: 'user.user.password_changed',
      },
      '1.0',
    );
  }
}

export interface UserTenantMembershipAddedPayload {
  userId: string;
  partnerId: string;
  roles: string[];
  vendorId?: string;
}

export class UserTenantMembershipAddedEvent extends BaseDomainEvent<UserTenantMembershipAddedPayload> {
  constructor(options: EventOptionsWithoutType<UserTenantMembershipAddedPayload>) {
    super(
      {
        ...options,
        eventType: 'user.partner_membership.added',
      },
      '1.0',
    );
  }
}

export interface UserTenantMembershipRemovedPayload {
  userId: string;
  partnerId: string;
  reason?: string;
}

export class UserTenantMembershipRemovedEvent extends BaseDomainEvent<UserTenantMembershipRemovedPayload> {
  constructor(options: EventOptionsWithoutType<UserTenantMembershipRemovedPayload>) {
    super(
      {
        ...options,
        eventType: 'user.partner_membership.removed',
      },
      '1.0',
    );
  }
}
