// =============================================================================
// Viewing Scheduler Types — Appointment booking types
// =============================================================================
// Property viewing / appointment booking for prospective buyers.
// Backed by BOOKING interaction type with bookingDetails.
// =============================================================================

// ---------------------------------------------------------------------------
// Time Slot
// ---------------------------------------------------------------------------

export interface TimeSlot {
  /** ISO date string (e.g. "2025-07-12") */
  date: string;
  /** e.g. "10:00 AM" */
  startTime: string;
  /** e.g. "11:00 AM" */
  endTime: string;
  /** Whether slot is available */
  available: boolean;
}

// ---------------------------------------------------------------------------
// Booking Request (maps to CreateInteractionDto with type: BOOKING)
// ---------------------------------------------------------------------------

export interface ViewingBookingRequest {
  /** Listing being viewed */
  listingId: string;
  /** Vendor (agent) handling the viewing */
  vendorId: string;
  /** Selected date/time */
  preferredDate: string;
  preferredTime: string;
  /** Alternative date/time */
  alternateDate?: string;
  alternateTime?: string;
  /** Visitor details */
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  /** Additional notes */
  notes?: string;
}

// ---------------------------------------------------------------------------
// Booking Confirmation (response from API)
// ---------------------------------------------------------------------------

export interface ViewingBookingConfirmation {
  /** Interaction ID for the booking */
  interactionId: string;
  /** Reference number */
  referenceId: string;
  /** Confirmed status */
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  /** Confirmed date/time */
  scheduledDate: string;
  scheduledTime: string;
  /** Vendor/agent name */
  vendorName: string;
  /** Property title */
  listingTitle: string;
}

// ---------------------------------------------------------------------------
// Available slots for a date (mocked)
// ---------------------------------------------------------------------------

export const STANDARD_TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
] as const;

export type StandardTimeSlot = (typeof STANDARD_TIME_SLOTS)[number];
