// =============================================================================
// MSW Browser Worker — Client-side mock service worker setup
// =============================================================================
// Only loaded when NEXT_PUBLIC_API_MOCKING=true in development.
// =============================================================================

import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
