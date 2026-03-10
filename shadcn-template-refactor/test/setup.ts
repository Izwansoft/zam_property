// =============================================================================
// Vitest Global Setup
// =============================================================================
// Configures testing environment: JSDOM, Testing Library matchers, MSW, etc.
// =============================================================================

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from '@/lib/mocks/server';

// ---------------------------------------------------------------------------
// MSW Server Lifecycle
// ---------------------------------------------------------------------------

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => {
  server.close();
});
