// =============================================================================
// MSW Handlers — Jobs / Queue monitoring mock handlers
// =============================================================================
// Mocks for 12 endpoints:
//   GET  /admin/jobs/health
//   GET  /admin/jobs/list
//   GET  /admin/jobs/:queueName/:jobId
//   GET  /admin/jobs/queues/:queueName
//   POST /admin/jobs/add
//   POST /admin/jobs/retry
//   POST /admin/jobs/retry-all/:queueName
//   POST /admin/jobs/queues/:queueName/pause
//   POST /admin/jobs/queues/:queueName/resume
//   POST /admin/jobs/queues/:queueName/clean
//   POST /admin/bulk/search/reindex
//   POST /admin/bulk/listings/expire
// =============================================================================

import { http, HttpResponse, delay } from "msw";
import { mockTimestamp } from "../utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api/v1";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const mockQueues = [
  {
    name: "email-queue",
    status: "active",
    waiting: 12,
    active: 3,
    completed: 1458,
    failed: 7,
    delayed: 2,
    paused: false,
  },
  {
    name: "notification-queue",
    status: "active",
    waiting: 5,
    active: 1,
    completed: 3204,
    failed: 12,
    delayed: 0,
    paused: false,
  },
  {
    name: "search-indexing",
    status: "active",
    waiting: 0,
    active: 0,
    completed: 892,
    failed: 3,
    delayed: 0,
    paused: false,
  },
  {
    name: "listing-expiry",
    status: "active",
    waiting: 45,
    active: 0,
    completed: 156,
    failed: 0,
    delayed: 45,
    paused: false,
  },
  {
    name: "payout-processing",
    status: "active",
    waiting: 0,
    active: 0,
    completed: 89,
    failed: 1,
    delayed: 0,
    paused: true,
  },
];

const mockJobs = [
  {
    id: "job-001",
    queueName: "email-queue",
    name: "send-welcome-email",
    status: "completed",
    data: { to: "user@example.com", template: "welcome" },
    result: { sent: true, messageId: "msg-123" },
    attempts: 1,
    maxAttempts: 3,
    progress: 100,
    createdAt: mockTimestamp(1),
    processedAt: mockTimestamp(0),
    finishedAt: mockTimestamp(0),
    failedReason: null,
  },
  {
    id: "job-002",
    queueName: "email-queue",
    name: "send-invoice-email",
    status: "failed",
    data: { to: "vendor@example.com", template: "invoice", invoiceId: "inv-456" },
    result: null,
    attempts: 3,
    maxAttempts: 3,
    progress: 0,
    createdAt: mockTimestamp(2),
    processedAt: mockTimestamp(1),
    finishedAt: mockTimestamp(1),
    failedReason: "SMTP connection timeout",
  },
  {
    id: "job-003",
    queueName: "notification-queue",
    name: "push-notification",
    status: "active",
    data: { userId: "u-001", title: "New listing match", body: "A new property matches your search" },
    result: null,
    attempts: 1,
    maxAttempts: 3,
    progress: 50,
    createdAt: mockTimestamp(0),
    processedAt: mockTimestamp(0),
    finishedAt: null,
    failedReason: null,
  },
  {
    id: "job-004",
    queueName: "search-indexing",
    name: "reindex-listing",
    status: "waiting",
    data: { listingId: "lst-789", action: "update" },
    result: null,
    attempts: 0,
    maxAttempts: 3,
    progress: 0,
    createdAt: mockTimestamp(0),
    processedAt: null,
    finishedAt: null,
    failedReason: null,
  },
];

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const jobHandlers = [
  // GET /admin/jobs/health
  http.get(`${API_BASE}/admin/jobs/health`, async () => {
    await delay(200);
    return HttpResponse.json({
      status: "healthy",
      redis: { connected: true, host: "localhost", port: 6380 },
      queues: mockQueues.map((q) => ({
        name: q.name,
        status: q.paused ? "paused" : "active",
        counts: {
          waiting: q.waiting,
          active: q.active,
          completed: q.completed,
          failed: q.failed,
          delayed: q.delayed,
        },
      })),
      timestamp: new Date().toISOString(),
    });
  }),

  // GET /admin/jobs/list
  http.get(`${API_BASE}/admin/jobs/list`, async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("pageSize") || "20");
    const queueName = url.searchParams.get("queueName");
    const status = url.searchParams.get("status");

    let filtered = [...mockJobs];
    if (queueName) filtered = filtered.filter((j) => j.queueName === queueName);
    if (status) filtered = filtered.filter((j) => j.status === status);

    return HttpResponse.json({
      data: filtered,
      meta: {
        pagination: {
          page,
          pageSize,
          totalItems: filtered.length,
          totalPages: Math.ceil(filtered.length / pageSize),
        },
      },
    });
  }),

  // GET /admin/jobs/:queueName/:jobId
  http.get(`${API_BASE}/admin/jobs/:queueName/:jobId`, async ({ params }) => {
    await delay(150);
    const job = mockJobs.find(
      (j) => j.queueName === params.queueName && j.id === params.jobId,
    );
    if (!job) {
      return HttpResponse.json({ message: "Job not found" }, { status: 404 });
    }
    return HttpResponse.json(job);
  }),

  // GET /admin/jobs/queues/:queueName
  http.get(`${API_BASE}/admin/jobs/queues/:queueName`, async ({ params }) => {
    await delay(200);
    const queue = mockQueues.find((q) => q.name === params.queueName);
    if (!queue) {
      return HttpResponse.json({ message: "Queue not found" }, { status: 404 });
    }
    return HttpResponse.json({
      ...queue,
      jobs: mockJobs.filter((j) => j.queueName === params.queueName),
    });
  }),

  // POST /admin/jobs/add
  http.post(`${API_BASE}/admin/jobs/add`, async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: `job-${Date.now()}`,
        queueName: body.queueName,
        name: body.name,
        status: "waiting",
        data: body.data,
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  // POST /admin/jobs/retry
  http.post(`${API_BASE}/admin/jobs/retry`, async () => {
    await delay(300);
    return HttpResponse.json({ success: true, message: "Job queued for retry" });
  }),

  // POST /admin/jobs/retry-all/:queueName
  http.post(`${API_BASE}/admin/jobs/retry-all/:queueName`, async ({ params }) => {
    await delay(500);
    return HttpResponse.json({
      success: true,
      message: `All failed jobs in ${params.queueName} queued for retry`,
      count: 3,
    });
  }),

  // POST /admin/jobs/queues/:queueName/pause
  http.post(`${API_BASE}/admin/jobs/queues/:queueName/pause`, async ({ params }) => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      message: `Queue ${params.queueName} paused`,
    });
  }),

  // POST /admin/jobs/queues/:queueName/resume
  http.post(`${API_BASE}/admin/jobs/queues/:queueName/resume`, async ({ params }) => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      message: `Queue ${params.queueName} resumed`,
    });
  }),

  // POST /admin/jobs/queues/:queueName/clean
  http.post(`${API_BASE}/admin/jobs/queues/:queueName/clean`, async ({ params }) => {
    await delay(400);
    return HttpResponse.json({
      success: true,
      message: `Queue ${params.queueName} cleaned`,
      removed: 15,
    });
  }),

  // POST /admin/bulk/search/reindex
  http.post(`${API_BASE}/admin/bulk/search/reindex`, async () => {
    await delay(500);
    return HttpResponse.json({
      success: true,
      message: "Search reindex job queued",
      jobId: `job-reindex-${Date.now()}`,
    });
  }),

  // POST /admin/bulk/listings/expire
  http.post(`${API_BASE}/admin/bulk/listings/expire`, async () => {
    await delay(500);
    return HttpResponse.json({
      success: true,
      message: "Listing expiry job queued",
      jobId: `job-expire-${Date.now()}`,
      expiredCount: 12,
    });
  }),
];
