// =============================================================================
// MSW Server — Server-side mock setup (for tests / SSR)
// =============================================================================
// Used by Vitest/Jest tests. NOT loaded in the browser.
// =============================================================================

import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
