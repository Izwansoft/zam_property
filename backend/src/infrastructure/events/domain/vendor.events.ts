import { BaseDomainEvent, EventOptionsWithoutType } from '../base-domain-event';

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR EVENTS
// Per Part 28: Events represent vendor lifecycle state changes
// ─────────────────────────────────────────────────────────────────────────────

export interface VendorCreatedPayload {
  vendorId: string;
  companyName: string;
  contactEmail: string;
  verticalTypes: string[];
}

export class VendorCreatedEvent extends BaseDomainEvent<VendorCreatedPayload> {
  constructor(options: EventOptionsWithoutType<VendorCreatedPayload>) {
    super(
      {
        ...options,
        eventType: 'vendor.vendor.created',
      },
      '1.0',
    );
  }
}

export interface VendorApprovedPayload {
  vendorId: string;
  approvedBy: string;
  approvedAt: Date;
}

export class VendorApprovedEvent extends BaseDomainEvent<VendorApprovedPayload> {
  constructor(options: EventOptionsWithoutType<VendorApprovedPayload>) {
    super(
      {
        ...options,
        eventType: 'vendor.vendor.approved',
      },
      '1.0',
    );
  }
}

export interface VendorRejectedPayload {
  vendorId: string;
  rejectedBy: string;
  rejectedAt: Date;
  reason: string;
}

export class VendorRejectedEvent extends BaseDomainEvent<VendorRejectedPayload> {
  constructor(options: EventOptionsWithoutType<VendorRejectedPayload>) {
    super(
      {
        ...options,
        eventType: 'vendor.vendor.rejected',
      },
      '1.0',
    );
  }
}

export interface VendorSuspendedPayload {
  vendorId: string;
  suspendedBy: string;
  suspendedAt: Date;
  reason: string;
  suspensionType: 'temporary' | 'indefinite';
}

export class VendorSuspendedEvent extends BaseDomainEvent<VendorSuspendedPayload> {
  constructor(options: EventOptionsWithoutType<VendorSuspendedPayload>) {
    super(
      {
        ...options,
        eventType: 'vendor.vendor.suspended',
      },
      '1.0',
    );
  }
}

export interface VendorVerifiedPayload {
  vendorId: string;
  verifiedBy: string;
  verifiedAt: Date;
  verificationType: 'document' | 'business' | 'identity';
}

export class VendorVerifiedEvent extends BaseDomainEvent<VendorVerifiedPayload> {
  constructor(options: EventOptionsWithoutType<VendorVerifiedPayload>) {
    super(
      {
        ...options,
        eventType: 'vendor.vendor.verified',
      },
      '1.0',
    );
  }
}
