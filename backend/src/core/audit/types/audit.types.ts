/**
 * Audit Types
 * Session 4.4 - Audit Logging
 *
 * Type definitions for audit logging.
 */

import { AuditActorType } from '@prisma/client';

export { AuditActorType };

/**
 * Audit action types (action_type values).
 */
export enum AuditActionType {
  // Authentication
  AUTH_LOGIN = 'auth.login',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_LOGIN_FAILED = 'auth.login_failed',
  AUTH_PASSWORD_RESET = 'auth.password_reset',
  AUTH_TOKEN_REFRESH = 'auth.token_refresh',

  // User Management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_ROLE_CHANGED = 'user.role_changed',
  USER_STATUS_CHANGED = 'user.status_changed',

  // Tenant Management
  TENANT_CREATED = 'tenant.created',
  TENANT_UPDATED = 'tenant.updated',
  TENANT_STATUS_CHANGED = 'tenant.status_changed',
  TENANT_SETTINGS_UPDATED = 'tenant.settings_updated',

  // Vendor Management
  VENDOR_CREATED = 'vendor.created',
  VENDOR_UPDATED = 'vendor.updated',
  VENDOR_APPROVED = 'vendor.approved',
  VENDOR_REJECTED = 'vendor.rejected',
  VENDOR_SUSPENDED = 'vendor.suspended',
  VENDOR_REACTIVATED = 'vendor.reactivated',

  // Listing Management
  LISTING_CREATED = 'listing.created',
  LISTING_UPDATED = 'listing.updated',
  LISTING_PUBLISHED = 'listing.published',
  LISTING_UNPUBLISHED = 'listing.unpublished',
  LISTING_ARCHIVED = 'listing.archived',
  LISTING_DELETED = 'listing.deleted',
  LISTING_FEATURED = 'listing.featured',

  // Subscription & Billing
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  PLAN_CHANGED = 'subscription.plan_changed',
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',

  // Entitlements
  ENTITLEMENT_GRANTED = 'entitlement.granted',
  ENTITLEMENT_REVOKED = 'entitlement.revoked',
  QUOTA_EXCEEDED = 'entitlement.quota_exceeded',

  // Feature Flags
  FEATURE_FLAG_CREATED = 'feature_flag.created',
  FEATURE_FLAG_UPDATED = 'feature_flag.updated',
  FEATURE_FLAG_DELETED = 'feature_flag.deleted',
  FEATURE_FLAG_OVERRIDE_SET = 'feature_flag.override_set',

  // Admin Actions
  ADMIN_OVERRIDE = 'admin.override',
  ADMIN_IMPERSONATE = 'admin.impersonate',
  ADMIN_BULK_ACTION = 'admin.bulk_action',
  ADMIN_CONFIG_CHANGE = 'admin.config_change',

  // Media
  MEDIA_UPLOADED = 'media.uploaded',
  MEDIA_DELETED = 'media.deleted',

  // Interactions
  INTERACTION_CREATED = 'interaction.created',
  INTERACTION_STATUS_CHANGED = 'interaction.status_changed',

  // Reviews
  REVIEW_CREATED = 'review.created',
  REVIEW_APPROVED = 'review.approved',
  REVIEW_REJECTED = 'review.rejected',

  // System
  SYSTEM_ERROR = 'system.error',
  SYSTEM_CONFIG_CHANGE = 'system.config_change',
}

/**
 * Audit target types (target_type values).
 */
export enum AuditTargetType {
  USER = 'user',
  TENANT = 'tenant',
  VENDOR = 'vendor',
  LISTING = 'listing',
  MEDIA = 'media',
  INTERACTION = 'interaction',
  REVIEW = 'review',
  SUBSCRIPTION = 'subscription',
  PLAN = 'plan',
  PAYMENT = 'payment',
  ENTITLEMENT = 'entitlement',
  FEATURE_FLAG = 'feature_flag',
  SYSTEM = 'system',
}

/**
 * Fields that should be masked in audit logs.
 */
export const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'password_hash',
  'secret',
  'apiKey',
  'api_key',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'ssn',
  'socialSecurityNumber',
  'bankAccount',
  'bank_account',
  'pin',
] as const;

/**
 * Options for creating an audit log entry.
 */
export interface CreateAuditLogOptions {
  tenantId?: string;
  actorType: AuditActorType;
  actorId?: string;
  actorEmail?: string;
  actionType: string;
  targetType: string;
  targetId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Audit log entry (response DTO).
 */
export interface AuditLogEntry {
  id: string;
  tenantId?: string;
  actorType: AuditActorType;
  actorId?: string;
  actorEmail?: string;
  actionType: string;
  targetType: string;
  targetId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  timestamp: Date;
}

/**
 * Query filters for audit logs.
 */
export interface AuditLogFilters {
  tenantId?: string;
  actorId?: string;
  actorType?: AuditActorType;
  actionType?: string;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  requestId?: string;
}
