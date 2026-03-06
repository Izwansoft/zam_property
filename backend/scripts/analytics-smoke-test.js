/*
  Analytics smoke test (local)
  - Requires backend running on BASE_URL (default http://localhost:3000)
  - Requires Redis + Postgres configured (analytics jobs + persistence)

  Env overrides:
    BASE_URL=http://localhost:3000
    TENANT=demo
    EMAIL=admin@demo.local
    PASSWORD=Password123!

  What it does:
    1) Logs in (seeded admin by default)
    2) Creates+approves a vendor and creates+publishes a listing
    3) Reads baseline analytics for that vendor/listing
    4) Triggers 3 listing views via GET /listings/:id
    5) Creates one LEAD and one ENQUIRY via POST /interactions
    6) Polls analytics endpoints until counts reflect the actions
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

function printCheck(name, ok, details) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${details ? `  ${details}` : ''}`);
  return ok;
}

function extractAccessToken(loginResponse) {
  // Standard response wrapper: { data: { accessToken, ... }, meta: ... }
  return loginResponse?.data?.data?.accessToken;
}

function todayDateOnly() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getListingRow(analyticsVendorListingsResponse, listingId) {
  const items = analyticsVendorListingsResponse?.data?.data?.items;
  if (!Array.isArray(items)) return null;
  return items.find((it) => it.listingId === listingId) ?? null;
}

async function pollUntil(fn, { attempts = 15, delayMs = 500 } = {}) {
  let last;
  for (let i = 0; i < attempts; i++) {
    last = await fn();
    if (last?.ok) return last;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return last;
}

async function main() {
  console.log(`BASE_URL=${BASE_URL}`);
  console.log(`TENANT=${TENANT}`);

  const partnerHeader = { 'X-Partner-ID': TENANT };

  // 1) Health checks (quick fail if server not up)
  const health = await request('GET', '/api/v1/health', { headers: partnerHeader });
  printCheck('GET /api/v1/health', health.status === 200, `(status=${health.status})`);
  if (health.status !== 200) {
    console.error('Backend is not reachable. Start it with: pnpm start:dev');
    process.exit(2);
  }

  // 2) Login
  const login = await request('POST', '/api/v1/auth/login', {
    headers: partnerHeader,
    body: { email: EMAIL, password: PASSWORD },
  });

  printCheck('POST /api/v1/auth/login', login.status === 200, `(status=${login.status})`);
  const accessToken = extractAccessToken(login);
  if (!accessToken) {
    console.error('Missing accessToken in login response');
    process.exit(3);
  }

  const authHeaders = { ...partnerHeader, Authorization: `Bearer ${accessToken}` };

  // 3) Create vendor -> approve -> create listing -> publish
  const vendorCreate = await request('POST', '/api/v1/vendors', {
    headers: authHeaders,
    body: {
      name: `AnalyticsSmoke Vendor ${Date.now()}`,
      email: `analytics-smoke-${Date.now()}@demo.local`,
    },
  });

  printCheck('POST /api/v1/vendors', vendorCreate.status === 201, `(status=${vendorCreate.status})`);
  const vendorId = vendorCreate?.data?.data?.id;
  if (!vendorId) {
    console.error('Missing vendorId from vendor create response');
    process.exit(4);
  }

  const vendorApprove = await request('POST', `/api/v1/vendors/${vendorId}/actions/approve`, {
    headers: authHeaders,
    body: {},
  });
  printCheck(
    `POST /api/v1/vendors/${vendorId}/actions/approve`,
    vendorApprove.status === 200 || vendorApprove.status === 201,
    `(status=${vendorApprove.status})`,
  );

  const listingCreate = await request('POST', '/api/v1/listings', {
    headers: authHeaders,
    body: {
      vendorId,
      verticalType: 'real_estate',
      title: 'AnalyticsSmoke Listing',
      price: 100000,
      currency: 'MYR',
      priceType: 'sale',
      attributes: {
        propertyType: 'condominium',
        listingType: 'sale',
      },
    },
  });

  printCheck('POST /api/v1/listings', listingCreate.status === 201, `(status=${listingCreate.status})`);
  const listingId = listingCreate?.data?.data?.id;
  if (!listingId) {
    console.error('Missing listingId from listing create response');
    process.exit(5);
  }

  // publish requires more attrs
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
  printCheck(
    `PATCH /api/v1/listings/${listingId}`,
    listingUpdate.status === 200,
    `(status=${listingUpdate.status})`,
  );

  const publishOk = await request('POST', `/api/v1/listings/${listingId}/publish`, {
    headers: authHeaders,
    body: {},
  });
  printCheck(
    `POST /api/v1/listings/${listingId}/publish`,
    publishOk.status === 200,
    `(status=${publishOk.status})`,
  );

  // 4) Baseline analytics
  const dateOnly = todayDateOnly();
  const baselineVendorOverview = await request(
    'GET',
    `/api/v1/analytics/vendor/overview?vendorId=${vendorId}&startDate=${dateOnly}&endDate=${dateOnly}`,
    { headers: authHeaders },
  );

  printCheck(
    'GET /api/v1/analytics/vendor/overview (baseline)',
    baselineVendorOverview.status === 200,
    `(status=${baselineVendorOverview.status})`,
  );

  const baselineVendorListings = await request(
    'GET',
    `/api/v1/analytics/vendor/listings?vendorId=${vendorId}&startDate=${dateOnly}&endDate=${dateOnly}`,
    { headers: authHeaders },
  );

  printCheck(
    'GET /api/v1/analytics/vendor/listings (baseline)',
    baselineVendorListings.status === 200,
    `(status=${baselineVendorListings.status})`,
  );

  const baselineRow = getListingRow(baselineVendorListings, listingId);
  const baseline = {
    views: baselineRow?.viewsCount ?? 0,
    leads: baselineRow?.leadsCount ?? 0,
    enquiries: baselineRow?.enquiriesCount ?? 0,
  };

  console.log('Baseline counts:', baseline);

  // 5) Trigger listing views (3x)
  for (let i = 0; i < 3; i++) {
    const viewRes = await request('GET', `/api/v1/listings/${listingId}`, { headers: authHeaders });
    printCheck(`GET /api/v1/listings/${listingId} (view ${i + 1})`, viewRes.status === 200, `(status=${viewRes.status})`);
  }

  // 6) Create one LEAD and one ENQUIRY
  const lead = await request('POST', '/api/v1/interactions', {
    headers: partnerHeader,
    body: {
      vendorId,
      listingId,
      verticalType: 'real_estate',
      interactionType: 'LEAD',
      contactName: 'Analytics Smoke',
      contactEmail: `analytics-smoke-${Date.now()}@example.com`,
      message: 'Smoke LEAD',
      source: 'smoke_test',
    },
  });
  printCheck('POST /api/v1/interactions (LEAD)', lead.status === 201 || lead.status === 200, `(status=${lead.status})`);

  const enquiry = await request('POST', '/api/v1/interactions', {
    headers: partnerHeader,
    body: {
      vendorId,
      listingId,
      verticalType: 'real_estate',
      interactionType: 'ENQUIRY',
      contactName: 'Analytics Smoke',
      contactEmail: `analytics-smoke-${Date.now()}@example.com`,
      message: 'Smoke ENQUIRY',
      source: 'smoke_test',
    },
  });
  printCheck('POST /api/v1/interactions (ENQUIRY)', enquiry.status === 201 || enquiry.status === 200, `(status=${enquiry.status})`);

  // 7) Poll analytics until counters reflect actions
  const expected = {
    views: baseline.views + 3,
    leads: baseline.leads + 1,
    enquiries: baseline.enquiries + 1,
  };

  const pollResult = await pollUntil(async () => {
    const res = await request(
      'GET',
      `/api/v1/analytics/vendor/listings?vendorId=${vendorId}&startDate=${dateOnly}&endDate=${dateOnly}`,
      { headers: authHeaders },
    );
    if (res.status !== 200) {
      return { ok: false, res };
    }

    const row = getListingRow(res, listingId);
    const current = {
      views: row?.viewsCount ?? 0,
      leads: row?.leadsCount ?? 0,
      enquiries: row?.enquiriesCount ?? 0,
    };

    const ok = current.views >= expected.views && current.leads >= expected.leads && current.enquiries >= expected.enquiries;
    return { ok, current, res };
  });

  if (!pollResult?.ok) {
    console.error('FAIL  Analytics counts did not reach expected values in time.');
    console.error('Expected >=', expected);
    console.error('Last seen:', pollResult?.current);
    process.exit(6);
  }

  printCheck('Analytics persisted to Postgres (listing_stats)', true, `current=${JSON.stringify(pollResult.current)}`);

  // Also validate vendor overview endpoint is returning something sane
  const finalVendorOverview = await request(
    'GET',
    `/api/v1/analytics/vendor/overview?vendorId=${vendorId}&startDate=${dateOnly}&endDate=${dateOnly}`,
    { headers: authHeaders },
  );

  printCheck(
    'GET /api/v1/analytics/vendor/overview (final)',
    finalVendorOverview.status === 200,
    `(status=${finalVendorOverview.status})`,
  );

  console.log('Done.');
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
