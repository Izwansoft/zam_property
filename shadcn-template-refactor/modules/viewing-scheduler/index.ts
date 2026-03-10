// =============================================================================
// Viewing Scheduler Module — Barrel Exports
// =============================================================================
// Property viewing appointment booking.
// =============================================================================

// Types
export type {
  TimeSlot,
  ViewingBookingRequest,
  ViewingBookingConfirmation,
  StandardTimeSlot,
} from "./types";
export { STANDARD_TIME_SLOTS } from "./types";

// Components
export { ViewingScheduler } from "./components/viewing-scheduler";
