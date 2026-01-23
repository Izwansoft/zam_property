/**
 * Base job data interface.
 * All job payloads should extend this.
 */
export interface BaseJobData {
  /** Tenant ID for tenant-scoped jobs */
  tenantId: string;

  /** Correlation ID for tracing */
  correlationId?: string;

  /** Timestamp when job was created */
  createdAt?: string;
}

/**
 * Media processing job payload
 */
export interface MediaProcessJobData extends BaseJobData {
  type:
    | 'image.resize'
    | 'image.optimize'
    | 'image.thumbnail'
    | 'document.preview'
    | 'video.transcode';
  mediaId: string;
  sourceKey: string;
  targetKey: string;
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  };
}

/**
 * Search indexing job payload
 */
export interface SearchIndexJobData extends BaseJobData {
  type: 'listing.index' | 'listing.delete' | 'vendor.index' | 'bulk.reindex';
  documentId?: string;
  documentIds?: string[];
  indexName: string;
  document?: Record<string, unknown>;
}

/**
 * Notification job payload
 */
export interface NotificationJobData extends BaseJobData {
  type:
    | 'email.transactional'
    | 'email.marketing'
    | 'sms.send'
    | 'push.send'
    | 'in_app.create'
    | 'webhook.deliver';
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  template: string;
  data: Record<string, unknown>;
  metadata?: {
    source: string;
    correlationId: string;
  };
}

/**
 * Billing job payload
 */
export interface BillingJobData extends BaseJobData {
  type:
    | 'invoice.generate'
    | 'invoice.send'
    | 'payment.process'
    | 'subscription.renew'
    | 'usage.aggregate';
  subscriptionId?: string;
  invoiceId?: string;
  amount?: number;
  currency?: string;
}

/**
 * Cleanup job payload
 */
export interface CleanupJobData extends BaseJobData {
  type:
    | 'media.orphaned'
    | 'sessions.expired'
    | 'tokens.expired'
    | 'logs.archive'
    | 'soft_deletes.purge';
  olderThan?: string;
  batchSize?: number;
}

/**
 * Analytics job payload
 */
export interface AnalyticsJobData extends BaseJobData {
  type: 'event.track' | 'metrics.aggregate' | 'report.generate';
  eventType?: string;
  eventData?: Record<string, unknown>;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Data transfer job payload
 */
export interface DataTransferJobData extends BaseJobData {
  type: 'listings.import' | 'listings.export' | 'data.backup';
  fileKey?: string;
  format?: 'csv' | 'json' | 'xlsx';
  filters?: Record<string, unknown>;
}

/**
 * Job result interface
 */
export interface JobResult<T = Record<string, unknown>> {
  success: boolean;
  message?: string;
  data?: T;
  processedAt: string;
}
