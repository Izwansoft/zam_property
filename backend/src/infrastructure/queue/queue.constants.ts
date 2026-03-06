/**
 * Queue names per part-31.md specification.
 * Format: {module}.{action}
 */
export const QUEUE_NAMES = {
  // Media processing queue
  MEDIA_PROCESS: 'media.process',

  // Search indexing queue
  SEARCH_INDEX: 'search.index',

  // Notification sending queue
  NOTIFICATION_SEND: 'notification.send',

  // Billing processing queue
  BILLING_PROCESS: 'billing.process',

  // Cleanup/maintenance queue
  CLEANUP_PROCESS: 'cleanup.process',

  // Analytics processing queue
  ANALYTICS_PROCESS: 'analytics.process',

  // Data import/export queue
  DATA_TRANSFER: 'data.transfer',

  // Listing expiration queue
  LISTING_EXPIRE: 'listing.expire',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/**
 * Job types per queue
 */
export const JOB_TYPES = {
  // Media processing jobs
  MEDIA: {
    IMAGE_RESIZE: 'image.resize',
    IMAGE_OPTIMIZE: 'image.optimize',
    IMAGE_THUMBNAIL: 'image.thumbnail',
    DOCUMENT_PREVIEW: 'document.preview',
    VIDEO_TRANSCODE: 'video.transcode',
  },

  // Search indexing jobs
  SEARCH: {
    LISTING_INDEX: 'listing.index',
    LISTING_DELETE: 'listing.delete',
    VENDOR_INDEX: 'vendor.index',
    BULK_REINDEX: 'bulk.reindex',
  },

  // Notification jobs
  NOTIFICATION: {
    EMAIL_TRANSACTIONAL: 'email.transactional',
    EMAIL_MARKETING: 'email.marketing',
    SMS_SEND: 'sms.send',
    PUSH_SEND: 'push.send',
    IN_APP_CREATE: 'in_app.create',
    WEBHOOK_DELIVER: 'webhook.deliver',
  },

  // Billing jobs (platform/subscription billing)
  BILLING: {
    INVOICE_GENERATE: 'invoice.generate',
    INVOICE_SEND: 'invoice.send',
    PAYMENT_PROCESS: 'payment.process',
    SUBSCRIPTION_RENEW: 'subscription.renew',
    USAGE_AGGREGATE: 'usage.aggregate',
  },

  // Rent billing jobs (property management billing)
  RENT_BILLING: {
    GENERATE_BATCH: 'rent-billing.generate-batch',
    GENERATE_SINGLE: 'rent-billing.generate-single',
    DETECT_OVERDUE: 'rent-billing.detect-overdue',
    APPLY_LATE_FEES: 'rent-billing.apply-late-fees',
    PROCESS_REMINDERS: 'rent-billing.process-reminders',
  },

  // Cleanup jobs
  CLEANUP: {
    MEDIA_ORPHANED: 'media.orphaned',
    SESSIONS_EXPIRED: 'sessions.expired',
    TOKENS_EXPIRED: 'tokens.expired',
    LOGS_ARCHIVE: 'logs.archive',
    SOFT_DELETES_PURGE: 'soft_deletes.purge',
  },

  // Analytics jobs
  ANALYTICS: {
    EVENT_TRACK: 'event.track',
    METRICS_AGGREGATE: 'metrics.aggregate',
    REPORT_GENERATE: 'report.generate',
  },

  // Data transfer jobs
  DATA: {
    LISTINGS_IMPORT: 'listings.import',
    LISTINGS_EXPORT: 'listings.export',
    DATA_BACKUP: 'data.backup',
  },

  // Listing expiration jobs
  LISTING_EXPIRE: {
    CHECK_EXPIRED: 'listing.check_expired',
    EXPIRE_SINGLE: 'listing.expire_single',
    EXPIRE_BATCH: 'listing.expire_batch',
    RENEW: 'listing.renew',
  },
} as const;
