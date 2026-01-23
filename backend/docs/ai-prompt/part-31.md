# PART 31 — BACKGROUND JOB SPECIFICATIONS (LOCKED)

This part defines all **background jobs, queues, and async processing** specifications.
All implementations must conform exactly to these patterns.

All rules from PART 0–30 apply.

---

## 31.1 QUEUE ARCHITECTURE

### Technology Stack
- **BullMQ** for job queues (Redis-backed)
- **Redis** for queue storage and pub/sub
- Separate worker processes for job execution
- Graceful shutdown with job completion

### Queue Naming Convention
```
{module}.{action}
```

Examples:
- `media.process`
- `search.index`
- `notification.send`
- `billing.invoice`

---

## 31.2 JOB CONFIGURATION DEFAULTS

```typescript
interface JobDefaults {
  attempts: 3;
  backoff: {
    type: 'exponential';
    delay: 1000; // 1s, 2s, 4s
  };
  removeOnComplete: {
    age: 86400; // 24 hours
    count: 1000;
  };
  removeOnFail: {
    age: 604800; // 7 days
  };
}
```

---

## 31.3 QUEUE DEFINITIONS

### 31.3.1 Media Processing Queue

**Queue Name:** `media.process`

**Purpose:** Process uploaded media files (images, documents).

**Job Types:**

| Job Type | Priority | Timeout | Retries |
|----------|----------|---------|---------|
| `image.resize` | normal | 30s | 3 |
| `image.optimize` | normal | 60s | 3 |
| `image.thumbnail` | high | 15s | 3 |
| `document.preview` | low | 120s | 2 |
| `video.transcode` | low | 600s | 2 |

**Job Payload:**
```typescript
interface MediaProcessJob {
  type: 'image.resize' | 'image.optimize' | 'image.thumbnail' | 'document.preview';
  mediaId: string;
  tenantId: string;
  sourceKey: string;
  targetKey: string;
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  };
}
```

**Processing Flow:**
1. Download source from S3
2. Process with Sharp (images) or appropriate tool
3. Upload result to S3
4. Update Media record with processed URLs
5. Emit `media.processed` event

**Error Handling:**
- Retry with exponential backoff
- After max retries, mark Media as `FAILED`
- Emit `media.processing_failed` event
- Alert ops if failure rate exceeds threshold

---

### 31.3.2 Search Indexing Queue

**Queue Name:** `search.index`

**Purpose:** Sync data to OpenSearch.

**Job Types:**

| Job Type | Priority | Timeout | Retries |
|----------|----------|---------|---------|
| `listing.index` | high | 10s | 5 |
| `listing.delete` | high | 5s | 5 |
| `vendor.index` | normal | 10s | 5 |
| `bulk.reindex` | low | 300s | 3 |

**Job Payload:**
```typescript
interface SearchIndexJob {
  type: 'listing.index' | 'listing.delete' | 'vendor.index' | 'bulk.reindex';
  tenantId: string;
  documentId?: string;
  documentIds?: string[];
  indexName: string;
  document?: Record<string, unknown>;
}
```

**Bulk Reindex Flow:**
1. Query listings in batches (100 per batch)
2. Transform to search documents
3. Bulk index to OpenSearch
4. Track progress in job data
5. Emit `search.reindex_completed` on finish

**Concurrency:** Max 5 concurrent indexing jobs per tenant.

---

### 31.3.3 Notification Queue

**Queue Name:** `notification.send`

**Purpose:** Send notifications via various channels.

**Job Types:**

| Job Type | Priority | Timeout | Retries |
|----------|----------|---------|---------|
| `email.transactional` | high | 30s | 5 |
| `email.marketing` | low | 30s | 3 |
| `sms.send` | high | 15s | 3 |
| `push.send` | normal | 10s | 3 |
| `in_app.create` | high | 5s | 5 |
| `webhook.deliver` | normal | 30s | 5 |

**Job Payload:**
```typescript
interface NotificationJob {
  type: 'email.transactional' | 'email.marketing' | 'sms.send' | 'push.send' | 'in_app.create';
  tenantId: string;
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
```

**Email Processing:**
1. Load template from template registry
2. Render with provided data
3. Send via configured provider (SendGrid, SES, etc.)
4. Record delivery status
5. Handle bounces/complaints via webhooks

**Rate Limiting:**
- Email: 100/second per tenant
- SMS: 10/second per tenant
- Push: 1000/second global

---

### 31.3.4 Billing Queue

**Queue Name:** `billing.process`

**Purpose:** Handle billing and payment processing.

**Job Types:**

| Job Type | Priority | Timeout | Retries |
|----------|----------|---------|---------|
| `invoice.generate` | normal | 60s | 3 |
| `invoice.send` | normal | 30s | 3 |
| `payment.process` | high | 120s | 5 |
| `subscription.renew` | high | 60s | 5 |
| `usage.aggregate` | low | 300s | 3 |

**Job Payload:**
```typescript
interface BillingJob {
  type: 'invoice.generate' | 'payment.process' | 'subscription.renew';
  tenantId: string;
  subscriptionId?: string;
  invoiceId?: string;
  amount?: number;
  currency?: string;
}
```

**Subscription Renewal Flow:**
1. Check subscription status
2. Calculate amount due
3. Attempt payment charge
4. On success: extend subscription period
5. On failure: retry with backoff, then mark as past_due
6. Send appropriate notification

**Idempotency:** All billing jobs use idempotency keys to prevent duplicate charges.

---

### 31.3.5 Cleanup Queue

**Queue Name:** `cleanup.process`

**Purpose:** Periodic cleanup and maintenance tasks.

**Job Types:**

| Job Type | Priority | Timeout | Retries |
|----------|----------|---------|---------|
| `media.orphaned` | low | 300s | 2 |
| `sessions.expired` | low | 60s | 3 |
| `tokens.expired` | low | 60s | 3 |
| `logs.archive` | low | 600s | 2 |
| `soft_deletes.purge` | low | 300s | 2 |

**Orphaned Media Cleanup:**
1. Find Media records older than 24h with no owner
2. Delete from S3
3. Delete database records
4. Log cleanup stats

---

### 31.3.6 Analytics Queue

**Queue Name:** `analytics.process`

**Purpose:** Process analytics events and aggregations.

**Job Types:**

| Job Type | Priority | Timeout | Retries |
|----------|----------|---------|---------|
| `event.track` | normal | 5s | 3 |
| `metrics.aggregate` | low | 300s | 3 |
| `report.generate` | low | 600s | 2 |

**Event Tracking Flow:**
1. Receive raw event
2. Enrich with context (user, tenant, etc.)
3. Store in time-series database
4. Update real-time counters in Redis

---

### 31.3.7 Import/Export Queue

**Queue Name:** `data.transfer`

**Purpose:** Handle bulk data imports and exports.

**Job Types:**

| Job Type | Priority | Timeout | Retries |
|----------|----------|---------|---------|
| `listings.import` | low | 1800s | 2 |
| `listings.export` | low | 900s | 2 |
| `data.backup` | low | 3600s | 2 |

**Import Flow:**
1. Validate file format
2. Parse in chunks (100 records)
3. Validate each record
4. Create/update records
5. Track progress in job data
6. Generate import report
7. Notify user on completion

---

## 31.4 SCHEDULED JOBS (CRON)

| Job | Schedule | Queue | Description |
|-----|----------|-------|-------------|
| Subscription Renewal Check | `0 0 * * *` | billing.process | Check and renew due subscriptions |
| Usage Aggregation | `0 * * * *` | analytics.process | Hourly usage aggregation |
| Orphaned Media Cleanup | `0 3 * * *` | cleanup.process | Daily at 3 AM |
| Expired Sessions Cleanup | `*/15 * * * *` | cleanup.process | Every 15 minutes |
| Search Index Health Check | `0 */4 * * *` | search.index | Every 4 hours |
| Metrics Roll-up | `0 0 * * *` | analytics.process | Daily metrics aggregation |
| Soft Delete Purge | `0 4 * * 0` | cleanup.process | Weekly on Sunday 4 AM |

**Implementation:**
```typescript
@Injectable()
export class SchedulerService {
  constructor(
    @InjectQueue('billing.process') private billingQueue: Queue,
    @InjectQueue('cleanup.process') private cleanupQueue: Queue,
  ) {}

  @Cron('0 0 * * *')
  async scheduleSubscriptionRenewals() {
    await this.billingQueue.add('subscription.renew_check', {
      date: new Date().toISOString(),
    });
  }
}
```

---

## 31.5 JOB FLOW PATTERNS

### 31.5.1 Job Chaining
```typescript
// Parent job spawns child jobs
async processListingCreation(job: Job<ListingCreatedJob>) {
  const { listingId, tenantId } = job.data;
  
  // Chain media processing
  await this.mediaQueue.add('image.process_all', {
    listingId,
    tenantId,
  });
  
  // Chain search indexing
  await this.searchQueue.add('listing.index', {
    listingId,
    tenantId,
  });
}
```

### 31.5.2 Job Batching
```typescript
// Batch multiple items into single job
await this.searchQueue.add('bulk.index', {
  tenantId,
  documentIds: listingIds,
  batchSize: 100,
});
```

### 31.5.3 Job Debouncing
```typescript
// Debounce rapid updates
await this.searchQueue.add(
  'listing.index',
  { listingId },
  {
    jobId: `listing:${listingId}`, // Prevents duplicates
    delay: 5000, // 5 second debounce
  },
);
```

---

## 31.6 ERROR HANDLING

### Retry Strategy
```typescript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
}
// Attempts at: 0s, 1s, 2s, 4s
```

### Dead Letter Queue
Failed jobs after max retries go to DLQ for manual inspection:
```
{queue}.failed → {queue}.dlq
```

### Alert Thresholds
| Metric | Threshold | Action |
|--------|-----------|--------|
| Failed jobs (1h) | > 10 | Alert ops |
| Queue depth | > 1000 | Scale workers |
| Job latency (p95) | > 30s | Alert ops |
| DLQ size | > 50 | Alert ops |

---

## 31.7 WORKER CONFIGURATION

### Worker Process Structure
```typescript
@Processor('media.process')
export class MediaProcessor {
  constructor(
    private readonly mediaService: MediaService,
    private readonly s3Service: S3Service,
  ) {}

  @Process('image.resize')
  async handleImageResize(job: Job<MediaProcessJob>) {
    const { mediaId, sourceKey, targetKey, options } = job.data;
    
    // Update progress
    await job.updateProgress(10);
    
    // Download
    const source = await this.s3Service.download(sourceKey);
    await job.updateProgress(30);
    
    // Process
    const processed = await sharp(source)
      .resize(options.width, options.height)
      .toFormat(options.format || 'webp')
      .toBuffer();
    await job.updateProgress(70);
    
    // Upload
    await this.s3Service.upload(targetKey, processed);
    await job.updateProgress(90);
    
    // Update record
    await this.mediaService.markProcessed(mediaId, targetKey);
    await job.updateProgress(100);
    
    return { success: true, targetKey };
  }
}
```

### Concurrency Settings
| Queue | Concurrency | Limiter |
|-------|-------------|---------|
| media.process | 5 | 10/second |
| search.index | 10 | 50/second |
| notification.send | 20 | 100/second |
| billing.process | 2 | 5/second |
| cleanup.process | 2 | - |
| analytics.process | 5 | - |

---

## 31.8 MONITORING & OBSERVABILITY

### Metrics to Track
- Queue depth (waiting jobs)
- Active jobs count
- Completed jobs (rate)
- Failed jobs (rate)
- Job duration (histogram)
- Job delay (time in queue)

### Logging Pattern
```typescript
this.logger.log({
  event: 'job.started',
  queue: 'media.process',
  jobId: job.id,
  jobType: job.name,
  tenantId: job.data.tenantId,
});

this.logger.log({
  event: 'job.completed',
  queue: 'media.process',
  jobId: job.id,
  duration: Date.now() - startTime,
});
```

### Health Check Endpoint
```typescript
@Get('/health/queues')
async getQueueHealth() {
  return {
    queues: [
      {
        name: 'media.process',
        waiting: await this.mediaQueue.getWaitingCount(),
        active: await this.mediaQueue.getActiveCount(),
        failed: await this.mediaQueue.getFailedCount(),
        paused: await this.mediaQueue.isPaused(),
      },
      // ... other queues
    ],
  };
}
```

---

## 31.9 GRACEFUL SHUTDOWN

```typescript
async onApplicationShutdown(signal: string) {
  this.logger.log(`Received ${signal}, starting graceful shutdown`);
  
  // Stop accepting new jobs
  await this.mediaQueue.pause();
  await this.searchQueue.pause();
  
  // Wait for active jobs to complete (max 30s)
  await this.waitForActiveJobs(30000);
  
  // Close connections
  await this.mediaQueue.close();
  await this.searchQueue.close();
}
```

---

## 31.10 TESTING JOBS

### Unit Testing
```typescript
describe('MediaProcessor', () => {
  it('should resize image correctly', async () => {
    const job = createMockJob({
      type: 'image.resize',
      mediaId: 'test-id',
      options: { width: 800, height: 600 },
    });
    
    await processor.handleImageResize(job);
    
    expect(s3Service.upload).toHaveBeenCalled();
    expect(mediaService.markProcessed).toHaveBeenCalled();
  });
});
```

### Integration Testing
```typescript
describe('Media Queue Integration', () => {
  it('should process image end-to-end', async () => {
    await mediaQueue.add('image.resize', {
      mediaId: testMedia.id,
      sourceKey: 'test/source.jpg',
      targetKey: 'test/target.webp',
    });
    
    // Wait for job completion
    await waitForJob(mediaQueue);
    
    const media = await prisma.media.findUnique({
      where: { id: testMedia.id },
    });
    expect(media.status).toBe('PROCESSED');
  });
});
```

END OF PART 31.
