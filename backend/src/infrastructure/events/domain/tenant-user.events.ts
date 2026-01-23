import { BaseDomainEvent, EventOptionsWithoutType } from '../base-domain-event';

// ─────────────────────────────────────────────────────────────────────────────
// TENANT EVENTS
// Per Part 28: Tenant lifecycle and configuration events
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantCreatedPayload {
  tenantId: string;
  name: string;
  slug: string;
  enabledVerticals: string[];
}

export class TenantCreatedEvent extends BaseDomainEvent<TenantCreatedPayload> {
  constructor(options: EventOptionsWithoutType<TenantCreatedPayload>) {
    super(
      {
        ...options,
        eventType: 'tenant.tenant.created',
      },
      '1.0',
    );
  }
}

export interface TenantUpdatedPayload {
  tenantId: string;
  changes: {
    name?: string;
    enabledVerticals?: string[];
    settings?: Record<string, unknown>;
  };
  previousValues: Record<string, unknown>;
}

export class TenantUpdatedEvent extends BaseDomainEvent<TenantUpdatedPayload> {
  constructor(options: EventOptionsWithoutType<TenantUpdatedPayload>) {
    super(
      {
        ...options,
        eventType: 'tenant.tenant.updated',
      },
      '1.0',
    );
  }
}

export interface TenantSuspendedPayload {
  tenantId: string;
  reason: string;
  suspendedBy: string;
}

export class TenantSuspendedEvent extends BaseDomainEvent<TenantSuspendedPayload> {
  constructor(options: EventOptionsWithoutType<TenantSuspendedPayload>) {
    super(
      {
        ...options,
        eventType: 'tenant.tenant.suspended',
      },
      '1.0',
    );
  }
}

export interface TenantReactivatedPayload {
  tenantId: string;
  reactivatedBy: string;
}

export class TenantReactivatedEvent extends BaseDomainEvent<TenantReactivatedPayload> {
  constructor(options: EventOptionsWithoutType<TenantReactivatedPayload>) {
    super(
      {
        ...options,
        eventType: 'tenant.tenant.reactivated',
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
  tenantId: string;
  roles: string[];
  vendorId?: string;
}

export class UserTenantMembershipAddedEvent extends BaseDomainEvent<UserTenantMembershipAddedPayload> {
  constructor(options: EventOptionsWithoutType<UserTenantMembershipAddedPayload>) {
    super(
      {
        ...options,
        eventType: 'user.tenant_membership.added',
      },
      '1.0',
    );
  }
}

export interface UserTenantMembershipRemovedPayload {
  userId: string;
  tenantId: string;
  reason?: string;
}

export class UserTenantMembershipRemovedEvent extends BaseDomainEvent<UserTenantMembershipRemovedPayload> {
  constructor(options: EventOptionsWithoutType<UserTenantMembershipRemovedPayload>) {
    super(
      {
        ...options,
        eventType: 'user.tenant_membership.removed',
      },
      '1.0',
    );
  }
}
