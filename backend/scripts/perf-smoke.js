/* eslint-disable no-console */

const autocannon = require('autocannon');
const http = require('http');
const https = require('https');

function getNumberEnv(key, defaultValue) {
  const raw = process.env[key];
  if (!raw) return defaultValue;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function preflightGet(url, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;

    const req = client.get(url, { headers: { Accept: 'application/json' } }, (res) => {
      // Drain response.
      res.on('data', () => undefined);
      res.on('end', () => resolve(res.statusCode || 0));
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('timeout')));
  });
}

function safeMs(value) {
  if (!Number.isFinite(value)) return 'N/A';
  return Math.round(value);
}

async function run() {
  const baseUrl = process.env.PERF_BASE_URL || 'http://localhost:3000';
  const durationSeconds = getNumberEnv('PERF_DURATION_SECONDS', 10);
  const connections = getNumberEnv('PERF_CONNECTIONS', 20);
  const pipelining = getNumberEnv('PERF_PIPELINING', 1);

  // Keep this endpoint unauthenticated and tenant-free.
  const url = `${baseUrl.replace(/\/$/, '')}/health`;

  // Preflight to provide a clear error when the API isn't running.
  try {
    const statusCode = await preflightGet(url);
    if (statusCode < 200 || statusCode >= 300) {
      console.error(`[perf:smoke] Preflight failed: GET ${url} returned ${statusCode}`);
      console.error(
        '[perf:smoke] Ensure the backend is running and PERF_BASE_URL points to it.',
      );
      process.exitCode = 1;
      return;
    }
  } catch (err) {
    console.error(`[perf:smoke] Preflight failed: cannot reach ${url}`);
    console.error('[perf:smoke] Start the API first (e.g., `pnpm start:dev`) and retry.');
    console.error(
      '[perf:smoke] If the API is running elsewhere, set PERF_BASE_URL (e.g., http://localhost:3001).',
    );
    console.error('[perf:smoke] Error:', err && err.message ? err.message : err);
    process.exitCode = 1;
    return;
  }

  console.log('[perf:smoke] Target:', url);
  console.log('[perf:smoke] Duration(s):', durationSeconds);
  console.log('[perf:smoke] Connections:', connections);
  console.log('[perf:smoke] Pipelining:', pipelining);

  const result = await autocannon({
    url,
    method: 'GET',
    connections,
    duration: durationSeconds,
    pipelining,
    headers: {
      Accept: 'application/json',
    },
  });

  console.log('\n[perf:smoke] Results');
  console.log('  Requests/sec:', Math.round(result.requests.average));
  console.log('  Latency p50 (ms):', safeMs(result.latency.p50));
  console.log('  Latency p95 (ms):', safeMs(result.latency.p95));
  console.log('  Latency p99 (ms):', safeMs(result.latency.p99));
  console.log('  Non-2xx:', result.non2xx);

  // Fail the command if the endpoint is unhealthy under load.
  if (result.non2xx > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('[perf:smoke] Failed:', err);
  process.exitCode = 1;
});
