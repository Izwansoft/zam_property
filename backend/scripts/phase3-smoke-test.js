/*
  Phase 3 smoke test (local)
  - Requires backend running on BASE_URL (default http://localhost:3000)
  - Uses seeded demo partner/user from prisma/seed.ts unless overridden

  Env overrides:
    BASE_URL=http://localhost:3000
    TENANT=demo
    EMAIL=admin@demo.local
    PASSWORD=Password123!
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

async function main() {
  console.log(`BASE_URL=${BASE_URL}`);
  console.log(`TENANT=${TENANT}`);

  // 1) Health checks
  printCheck('GET /api/v1/health', (await request('GET', '/api/v1/health')).status, 200);
  printCheck('GET /api/v1/health/redis', (await request('GET', '/api/v1/health/redis')).status, 200);
  printCheck('GET /api/v1/health/queues', (await request('GET', '/api/v1/health/queues')).status, 200);

  // 2) Socket.IO handshake
  printCheck(
    'GET /socket.io handshake',
    (await request('GET', '/socket.io/?EIO=4&transport=polling&t=123')).status,
    200,
  );

  // 3) Partner-scoped public search endpoints
  const partnerHeader = { 'X-Partner-ID': TENANT };

  printCheck(
    'GET /api/v1/search/listings',
    (await request('GET', '/api/v1/search/listings?q=test&page=1&pageSize=1', { headers: partnerHeader })).status,
    200,
  );

  printCheck(
    'GET /api/v1/real-estate/search',
    (await request('GET', '/api/v1/real-estate/search?q=test&page=1&pageSize=1', { headers: partnerHeader })).status,
    200,
  );

  // 4) Login and protected endpoints
  const login = await request('POST', '/api/v1/auth/login', {
    headers: partnerHeader,
    body: { email: EMAIL, password: PASSWORD },
  });

  printCheck('POST /api/v1/auth/login', login.status, 200);
  const accessToken = login?.data?.data?.accessToken;
  if (!accessToken) {
    console.error('FAIL  Missing accessToken in login response');
    process.exit(2);
  }

  const authHeaders = { ...partnerHeader, Authorization: `Bearer ${accessToken}` };

  printCheck(
    'GET /api/v1/verticals/definitions/active (auth)',
    (await request('GET', '/api/v1/verticals/definitions/active', { headers: authHeaders })).status,
    200,
  );

  printCheck(
    'GET /api/v1/admin/jobs/health (auth)',
    (await request('GET', '/api/v1/admin/jobs/health', { headers: authHeaders })).status,
    200,
  );

  // 4b) Prove background jobs actually process: enqueue a manual listing.expire check job
  const jwtPayload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'));
  const partnerId = jwtPayload?.partnerId;
  if (!partnerId) {
    console.error('FAIL  Could not extract partnerId from JWT');
    process.exit(2);
  }

  const addJob = await request('POST', '/api/v1/admin/jobs/add', {
    headers: authHeaders,
    body: {
      queue: 'listing.expire',
      jobType: 'listing.check_expired',
      data: {
        partnerId,
        type: 'listing.check_expired',
        checkDate: new Date().toISOString(),
        batchSize: 50,
      },
    },
  });

  printCheck('POST /api/v1/admin/jobs/add (listing.check_expired)', addJob.status, 201);
  const jobId = addJob?.data?.jobId;
  if (!jobId) {
    console.error('FAIL  Missing jobId from add job response');
    process.exit(2);
  }

  let lastState = null;
  for (let i = 0; i < 15; i++) {
    // small backoff so workers have time to pick it up
    await new Promise((r) => setTimeout(r, 500));
    const jobInfo = await request('GET', `/api/v1/admin/jobs/listing.expire/${jobId}`, { headers: authHeaders });
    if (jobInfo.status !== 200) {
      lastState = `http_${jobInfo.status}`;
      continue;
    }

    lastState = jobInfo?.data?.state;
    if (lastState === 'completed' || lastState === 'failed') {
      break;
    }
  }

  printCheck(`GET /api/v1/admin/jobs/listing.expire/${jobId} (state=${lastState ?? 'unknown'})`, lastState === 'completed' ? 200 : 500, 200);

  // 5) Validation engine smoke: create vendor -> approve -> create listing -> publish fails -> update -> publish succeeds
  const vendorCreate = await request('POST', '/api/v1/vendors', {
    headers: authHeaders,
    body: {
      name: `SmokeTest Vendor ${Date.now()}`,
      email: `smoketest-${Date.now()}@demo.local`,
    },
  });

  printCheck('POST /api/v1/vendors (auth)', vendorCreate.status, 201);
  const vendorId = vendorCreate?.data?.data?.id;
  if (!vendorId) {
    console.error('FAIL  Missing vendorId from vendor create response');
    process.exit(3);
  }

  const vendorApprove = await request('POST', `/api/v1/vendors/${vendorId}/actions/approve`, {
    headers: authHeaders,
    body: {},
  });
  // Depending on implementation this may be 200 or 201
  printCheck(`POST /api/v1/vendors/${vendorId}/actions/approve`, vendorApprove.status, [200, 201]);

  const listingCreate = await request('POST', '/api/v1/listings', {
    headers: authHeaders,
    body: {
      vendorId,
      verticalType: 'real_estate',
      title: 'SmokeTest Listing',
      price: 100000,
      currency: 'MYR',
      priceType: 'sale',
      attributes: {
        propertyType: 'condominium',
        listingType: 'sale',
      },
    },
  });

  printCheck('POST /api/v1/listings (auth)', listingCreate.status, 201);
  const listingId = listingCreate?.data?.data?.id;
  if (!listingId) {
    console.error('FAIL  Missing listingId from listing create response');
    process.exit(4);
  }

  const publishFail = await request('POST', `/api/v1/listings/${listingId}/publish`, {
    headers: authHeaders,
    body: {},
  });

  // Expect validation failure because builtUpSize/bedrooms/bathrooms required on publish
  printCheck(`POST /api/v1/listings/${listingId}/publish (expected fail)`, publishFail.status, 400);

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

  printCheck(`PATCH /api/v1/listings/${listingId} (add required publish attrs)`, listingUpdate.status, 200);

  const publishOk = await request('POST', `/api/v1/listings/${listingId}/publish`, {
    headers: authHeaders,
    body: {},
  });

  printCheck(`POST /api/v1/listings/${listingId}/publish (expected ok)`, publishOk.status, 200);

  console.log('Done.');
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
