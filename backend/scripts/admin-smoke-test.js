/*
  Admin APIs smoke test (local)
  - Requires backend running on BASE_URL (default http://localhost:3000)
  - Uses seeded demo tenant/user from prisma/seed.ts unless overridden

  Env overrides:
    BASE_URL=http://localhost:3000
    TENANT=demo
    EMAIL=admin@demo.local
    PASSWORD=Password123!

  What it checks:
    1) GET /api/v1/health (quick reachability)
    2) POST /api/v1/auth/login (get JWT)
    3) GET /api/v1/admin/dashboard/stats
    4) GET /api/v1/admin/vendors?page=1&pageSize=1
    5) GET /api/v1/admin/listings?page=1&pageSize=1
    6) GET /api/v1/admin/system/health
    7) POST /api/v1/admin/bulk/search/reindex (enqueue job; expect 202 + jobId)
    8) POST /api/v1/admin/bulk/listings/expire (enqueue job; expect 202 + jobId) + verify listing status becomes EXPIRED
*/

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const TENANT = process.env.TENANT ?? 'demo';
const EMAIL = process.env.EMAIL ?? 'admin@demo.local';
const PASSWORD = process.env.PASSWORD ?? 'Password123!';

function url(path) {
  return `${BASE_URL}${path}`;
}

async function request(method, path, { headers, body } = {}) {
  const res = await fetch(url(path), {
    method,
    headers: {
      ...(headers ?? {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  return { status: res.status, data };
}

function printCheck(name, status, expected) {
  const ok = Array.isArray(expected) ? expected.includes(status) : status === expected;
  const expectedText = Array.isArray(expected) ? expected.join('/') : String(expected);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (${status}, expected ${expectedText})`);
  return ok;
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`BASE_URL=${BASE_URL}`);
  console.log(`TENANT=${TENANT}`);

  const tenantHeader = { 'X-Tenant-ID': TENANT };

  // 1) Basic reachability
  const health = await request('GET', '/api/v1/health', { headers: tenantHeader });
  printCheck('GET /api/v1/health', health.status, 200);
  if (health.status !== 200) {
    console.error('Backend is not reachable. Ensure it is running and BASE_URL is correct.');
    process.exit(2);
  }

  // 2) Login
  const login = await request('POST', '/api/v1/auth/login', {
    headers: tenantHeader,
    body: { email: EMAIL, password: PASSWORD },
  });

  printCheck('POST /api/v1/auth/login', login.status, 200);
  const accessToken = login?.data?.data?.accessToken;
  if (!accessToken) {
    console.error('FAIL  Missing accessToken in login response');
    process.exit(3);
  }

  const authHeaders = { ...tenantHeader, Authorization: `Bearer ${accessToken}` };

  // 3) Dashboard stats
  const stats = await request('GET', '/api/v1/admin/dashboard/stats', { headers: authHeaders });
  printCheck('GET /api/v1/admin/dashboard/stats', stats.status, 200);

  // 4) Vendors dashboard list
  const vendors = await request('GET', '/api/v1/admin/vendors?page=1&pageSize=1', { headers: authHeaders });
  printCheck('GET /api/v1/admin/vendors?page=1&pageSize=1', vendors.status, 200);

  // 5) Listings dashboard list
  const listings = await request('GET', '/api/v1/admin/listings?page=1&pageSize=1', { headers: authHeaders });
  printCheck('GET /api/v1/admin/listings?page=1&pageSize=1', listings.status, 200);

  // 6) System health
  const systemHealth = await request('GET', '/api/v1/admin/system/health', { headers: authHeaders });
  printCheck('GET /api/v1/admin/system/health', systemHealth.status, 200);

  // 7) Bulk reindex (async)
  const reindex = await request('POST', '/api/v1/admin/bulk/search/reindex', {
    headers: authHeaders,
    body: { entityType: 'listing', batchSize: 50 },
  });

  printCheck('POST /api/v1/admin/bulk/search/reindex', reindex.status, 202);
  const jobId = reindex?.data?.data?.jobId;
  if (!jobId) {
    console.error('FAIL  Missing jobId in bulk reindex response');
    process.exit(4);
  }

  console.log(`PASS  bulk reindex jobId=${jobId}`);

  // 8) Bulk expire listings (async) - create vendor + publish listing first
  const vendorCreate = await request('POST', '/api/v1/vendors', {
    headers: authHeaders,
    body: {
      name: `AdminSmoke Vendor ${Date.now()}`,
      email: `admin-smoke-${Date.now()}@demo.local`,
    },
  });

  printCheck('POST /api/v1/vendors', vendorCreate.status, 201);
  const vendorId = vendorCreate?.data?.data?.id;
  if (!vendorId) {
    console.error('FAIL  Missing vendorId from vendor create response');
    process.exit(5);
  }

  const vendorApprove = await request('POST', `/api/v1/vendors/${vendorId}/actions/approve`, {
    headers: authHeaders,
    body: {},
  });
  printCheck(`POST /api/v1/vendors/${vendorId}/actions/approve`, vendorApprove.status, [200, 201]);

  const listingCreate = await request('POST', '/api/v1/listings', {
    headers: authHeaders,
    body: {
      vendorId,
      verticalType: 'real_estate',
      title: 'AdminSmoke Listing',
      price: 100000,
      currency: 'MYR',
      priceType: 'sale',
      attributes: {
        propertyType: 'condominium',
        listingType: 'sale',
      },
    },
  });

  printCheck('POST /api/v1/listings', listingCreate.status, 201);
  const listingId = listingCreate?.data?.data?.id;
  if (!listingId) {
    console.error('FAIL  Missing listingId from listing create response');
    process.exit(6);
  }

  const listingUpdate = await request('PATCH', `/api/v1/listings/${listingId}`, {
    headers: authHeaders,
    body: {
      attributes: {
        propertyType: 'condominium',
        listingType: 'sale',
        builtUpSize: 1200,
        bedrooms: 3,
        bathrooms: 2,
      },
    },
  });
  printCheck(`PATCH /api/v1/listings/${listingId}`, listingUpdate.status, 200);

  const publishOk = await request('POST', `/api/v1/listings/${listingId}/publish`, {
    headers: authHeaders,
    body: {},
  });
  printCheck(`POST /api/v1/listings/${listingId}/publish`, publishOk.status, 200);

  const bulkExpire = await request('POST', '/api/v1/admin/bulk/listings/expire', {
    headers: authHeaders,
    body: {
      listingIds: [listingId],
      reason: 'Admin smoke test bulk expire',
    },
  });

  printCheck('POST /api/v1/admin/bulk/listings/expire', bulkExpire.status, 202);
  const expireJobId = bulkExpire?.data?.data?.jobId;
  if (!expireJobId) {
    console.error('FAIL  Missing jobId in bulk expire response');
    process.exit(7);
  }

  // Poll until job completed/failed
  let lastState = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    const jobInfo = await request('GET', `/api/v1/admin/jobs/listing.expire/${expireJobId}`, { headers: authHeaders });
    if (jobInfo.status !== 200) {
      lastState = `http_${jobInfo.status}`;
      continue;
    }
    lastState = jobInfo?.data?.state;
    if (lastState === 'completed' || lastState === 'failed') {
      break;
    }
  }

  const jobCompleted = lastState === 'completed';
  printCheck(`GET /api/v1/admin/jobs/listing.expire/${expireJobId} (state=${lastState ?? 'unknown'})`, jobCompleted ? 200 : 500, 200);

  // Verify listing status is now EXPIRED
  const listingAfter = await request('GET', `/api/v1/admin/listings/${listingId}`, { headers: authHeaders });
  printCheck(`GET /api/v1/admin/listings/${listingId}`, listingAfter.status, 200);
  const status = listingAfter?.data?.data?.status;
  printCheck(`listing status after bulk expire`, status === 'EXPIRED' ? 200 : 500, 200);
  if (status !== 'EXPIRED') {
    console.log('Details:', JSON.stringify({ status }, null, 2));
    process.exit(8);
  }

  console.log(`PASS  bulk expire jobId=${expireJobId}, listingId=${listingId} status=EXPIRED`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
