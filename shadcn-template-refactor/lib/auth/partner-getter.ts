// =============================================================================
// Partner Getter — Singleton for API client interceptor
// =============================================================================
// Provides a global getter function for the current partner ID.
// Used by the API client's request interceptor to attach X-Partner-ID header.
//
// Why a singleton?
//   The API client (lib/api/client.ts) is created at module scope and its
//   interceptors can't directly access React context. This module bridges
//   the gap by providing a setter (called by PartnerProvider) and getter
//   (called by the interceptor).
//
// Note: lib/api/client.ts already has setPartnerIdGetter/getpartnerId built in.
// This module provides an additional access point for non-Axios consumers
// (e.g., WebSocket handshake, analytics, etc.).
// =============================================================================

// ---------------------------------------------------------------------------
// Singleton state
// ---------------------------------------------------------------------------

let _partnerGetter: (() => string | null) | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Set the partner ID getter function.
 * Called by PartnerProvider on mount.
 */
export function setPartnerGetter(getter: () => string | null): void {
  _partnerGetter = getter;
}

/**
 * Get the current partner ID from the singleton.
 * Used by non-React code that needs partner context (WebSocket, analytics, etc.).
 *
 * @returns The current partner ID, or null if not resolved.
 */
export function getCurrentpartnerId(): string | null {
  return _partnerGetter?.() ?? null;
}

/**
 * Check if a partner getter has been registered.
 * Useful for debugging / asserting partner context availability.
 */
export function isPartnerGetterRegistered(): boolean {
  return _partnerGetter !== null;
}
