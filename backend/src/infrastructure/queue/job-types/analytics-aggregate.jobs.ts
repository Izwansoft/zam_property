import { BaseJobData } from '../queue.interfaces';

/**
 * Analytics job types per part-31.md specification.
 */
export type AnalyticsJobType =
  | 'event.track'
  | 'metrics.aggregate'
  | 'metrics.rollup'
  | 'report.generate';

/**
 * Track a single analytics event.
 */
export interface EventTrackJob extends BaseJobData {
  type: 'event.track';
  eventType: string;
  eventCategory: 'listing' | 'vendor' | 'user' | 'interaction' | 'search';
  entityId: string;
  entityType: string;
  userId?: string;
  sessionId?: string;
  properties: Record<string, unknown>;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

/**
 * Aggregate metrics for a time period.
 */
export interface MetricsAggregateJob extends BaseJobData {
  type: 'metrics.aggregate';
  aggregationType: 'hourly' | 'daily' | 'weekly' | 'monthly';
  dateRange: {
    start: string;
    end: string;
  };
  metrics: string[];
  dimensions?: string[];
}

/**
 * Roll up metrics from fine-grained to coarse-grained.
 */
export interface MetricsRollupJob extends BaseJobData {
  type: 'metrics.rollup';
  sourceGranularity: 'hourly' | 'daily' | 'weekly';
  targetGranularity: 'daily' | 'weekly' | 'monthly';
  date: string;
  metrics: string[];
}

/**
 * Generate a report.
 */
export interface ReportGenerateJob extends BaseJobData {
  type: 'report.generate';
  reportType: 'vendor_performance' | 'listing_analytics' | 'platform_overview' | 'custom';
  vendorId?: string;
  dateRange: {
    start: string;
    end: string;
  };
  format: 'pdf' | 'csv' | 'xlsx' | 'json';
  filters?: Record<string, unknown>;
  recipientEmail?: string;
  storageKey?: string;
}

/**
 * Union type for all analytics jobs.
 */
export type AnalyticsJob =
  | EventTrackJob
  | MetricsAggregateJob
  | MetricsRollupJob
  | ReportGenerateJob;

/**
 * Analytics aggregation result.
 */
export interface AnalyticsAggregationResult {
  success: boolean;
  aggregationType?: string;
  recordsProcessed?: number;
  metricsGenerated?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  duration?: number;
  processedAt: string;
}

/**
 * Common analytics event types.
 */
export const ANALYTICS_EVENT_TYPES = {
  // Listing events
  LISTING_VIEW: 'listing.view',
  LISTING_IMPRESSION: 'listing.impression',
  LISTING_SHARE: 'listing.share',
  LISTING_SAVE: 'listing.save',
  LISTING_CONTACT: 'listing.contact',

  // Search events
  SEARCH_QUERY: 'search.query',
  SEARCH_FILTER: 'search.filter',
  SEARCH_RESULT_CLICK: 'search.result_click',

  // User events
  USER_SIGNUP: 'user.signup',
  USER_LOGIN: 'user.login',
  USER_PROFILE_UPDATE: 'user.profile_update',

  // Vendor events
  VENDOR_PROFILE_VIEW: 'vendor.profile_view',
  VENDOR_CONTACT: 'vendor.contact',

  // Interaction events
  INQUIRY_CREATED: 'inquiry.created',
  INQUIRY_RESPONDED: 'inquiry.responded',
} as const;
