import { JobsOptions } from 'bullmq';

/**
 * Default job configuration per part-31.md specification.
 */
export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000, // 1s, 2s, 4s
  },
  removeOnComplete: {
    age: 86400, // 24 hours
    count: 1000,
  },
  removeOnFail: {
    age: 604800, // 7 days
  },
};

/**
 * Job configuration by priority level
 */
export const JOB_OPTIONS_BY_PRIORITY = {
  high: {
    ...DEFAULT_JOB_OPTIONS,
    priority: 1,
    attempts: 5,
  },
  normal: {
    ...DEFAULT_JOB_OPTIONS,
    priority: 5,
  },
  low: {
    ...DEFAULT_JOB_OPTIONS,
    priority: 10,
    attempts: 2,
  },
} as const;

/**
 * Queue-specific concurrency settings per part-31.md
 */
export const QUEUE_CONCURRENCY = {
  'media.process': 5,
  'search.index': 10,
  'notification.send': 20,
  'billing.process': 2,
  'cleanup.process': 2,
  'analytics.process': 5,
  'data.transfer': 2,
  'listing.expire': 5,
} as const;

/**
 * Queue-specific rate limits (jobs per second)
 */
export const QUEUE_RATE_LIMITS = {
  'media.process': { max: 10, duration: 1000 },
  'search.index': { max: 50, duration: 1000 },
  'notification.send': { max: 100, duration: 1000 },
  'billing.process': { max: 5, duration: 1000 },
  'listing.expire': { max: 20, duration: 1000 },
} as const;

/**
 * Job timeout configurations by job type (in milliseconds)
 */
export const JOB_TIMEOUTS: Record<string, number> = {
  // Media processing
  'image.resize': 30000,
  'image.optimize': 60000,
  'image.thumbnail': 15000,
  'document.preview': 120000,
  'video.transcode': 600000,

  // Search indexing
  'listing.index': 10000,
  'listing.delete': 5000,
  'vendor.index': 10000,
  'bulk.reindex': 300000,

  // Notifications
  'email.transactional': 30000,
  'email.marketing': 30000,
  'sms.send': 15000,
  'push.send': 10000,
  'in_app.create': 5000,
  'webhook.deliver': 30000,

  // Billing
  'invoice.generate': 60000,
  'invoice.send': 30000,
  'payment.process': 120000,
  'subscription.renew': 60000,
  'usage.aggregate': 300000,

  // Cleanup
  'media.orphaned': 300000,
  'sessions.expired': 60000,
  'tokens.expired': 60000,
  'logs.archive': 600000,
  'soft_deletes.purge': 300000,

  // Analytics
  'event.track': 5000,
  'metrics.aggregate': 300000,
  'report.generate': 600000,

  // Listing expire
  'listing.check_expired': 120000,
  'listing.expire_single': 30000,
  'listing.expire_batch': 300000,
  'listing.renew': 30000,

  // Data transfer
  'listings.import': 1800000,
  'listings.export': 900000,
  'data.backup': 3600000,
};
