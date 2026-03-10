"use client";

// =============================================================================
// Partner Context — PartnerProvider, partner resolution, partner switching
// =============================================================================
// Resolves and holds the current partner context for partner-scoped API requests.
//
// Resolution priority (Part-4 §4.5):
//   1. Subdomain (e.g. acme.zamproperty.com → "acme")
//   2. Stored partner ID (localStorage from last session)
//   3. User's partner membership (from auth identity)
//
// Portal-specific behaviour:
//   - Platform portal: optional (can switch/select partners)
//   - Partner portal: required (must resolve or block)
//   - Vendor portal: derived from vendor's partner association
//   - Account portal: not required
// =============================================================================

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { setPartnerIdGetter } from "@/lib/api/client";
import { setPartnerGetter } from "@/lib/auth/partner-getter";
import type {
  Partner,
  PartnerMembership,
  PartnerResolutionStatus,
} from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORED_PARTNER_KEY = "zam_current_partner_id";

// ---------------------------------------------------------------------------
// UUID detection helper
// ---------------------------------------------------------------------------

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate that a stored partner ID is a plausible identifier.
 * Accepts UUIDs (actual partner IDs) and short slugs (e.g. "demo").
 * Rejects mock/test values like "partner-001".
 */
function isValidpartnerIdentifier(id: string): boolean {
  // Accept UUIDs
  if (UUID_REGEX.test(id)) return true;
  // Accept slug-like values (lowercase alphanumeric, 2-50 chars, no dashes at start)
  if (/^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$/.test(id) && !id.startsWith("partner-")) return true;
  // Single-word slugs like "demo"
  if (/^[a-z]{2,20}$/.test(id)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function getStoredpartnerId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORED_PARTNER_KEY);
}

function setStoredpartnerId(partnerId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORED_PARTNER_KEY, partnerId);
}

function clearStoredpartnerId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORED_PARTNER_KEY);
}

// ---------------------------------------------------------------------------
// Subdomain detection
// ---------------------------------------------------------------------------

/**
 * Extract partner slug from subdomain.
 * Expected pattern: `<slug>.zamproperty.com` or `<slug>.localhost`
 * Returns null if no subdomain (e.g., bare domain, localhost:3001).
 */
function getPartnerFromSubdomain(): string | null {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname;

  // Skip localhost without subdomain
  if (hostname === "localhost" || hostname === "127.0.0.1") return null;

  // Check for subdomain pattern: <slug>.<domain>.<tld>
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Ignore www or dashboard subdomains
    if (subdomain !== "www" && subdomain !== "dashboard" && subdomain !== "app") {
      return subdomain;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Context Value
// ---------------------------------------------------------------------------

export interface PartnerContextValue {
  /** Current partner ID */
  partnerId: string | null;
  /** Current partner details (if loaded) */
  partner: Partner | null;
  /** Resolution status */
  status: PartnerResolutionStatus;
  /** Error message */
  error: string | null;
  /** Whether partner is resolved and ready */
  isReady: boolean;
  /** Whether partner context is required for current portal */
  isRequired: boolean;

  // Actions
  /** Set partner ID explicitly (e.g., partner switcher, platform admin) */
  setPartnerId: (partnerId: string) => void;
  /** Clear partner context */
  clearPartner: () => void;
  /** Available partners for switching */
  availablePartners: PartnerMembership[];
  /** Whether user can switch partners in current portal */
  canSwitch: boolean;
}

export const PartnerContext = createContext<PartnerContextValue | null>(null);

// ---------------------------------------------------------------------------
// PartnerProvider Props
// ---------------------------------------------------------------------------

export interface PartnerProviderProps {
  children: React.ReactNode;
  /**
   * Portal mode determines resolution behaviour:
   *  - "required": Must resolve partner or show error (partner portal)
   *  - "derived": Partner is derived from user's vendor association (vendor portal)
   *  - "optional": Partner context is optional (platform portal)
   *  - "none": Partner context not needed (account portal, public pages)
   */
  mode: "required" | "derived" | "optional" | "none";
  /**
   * The authenticated user's partner ID (from auth context).
   * Used for "required" and "derived" resolution fallback.
   */
  userpartnerId?: string | null;
  /**
   * Available partner memberships for the user.
   * Used for partner switching in platform/partner portals.
   */
  memberships?: PartnerMembership[];
}

// ---------------------------------------------------------------------------
// PartnerProvider Component
// ---------------------------------------------------------------------------

export function PartnerProvider({
  children,
  mode,
  userpartnerId,
  memberships = [],
}: PartnerProviderProps) {
  const [partnerId, setPartnerIdState] = useState<string | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [status, setStatus] = useState<PartnerResolutionStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const partnerIdRef = useRef<string | null>(null);

  // Keep ref in sync for the API client singleton getter
  partnerIdRef.current = partnerId;

  // -------------------------------------------------------------------------
  // Wire partner ID getter into API client (singleton)
  // -------------------------------------------------------------------------

  useEffect(() => {
    setPartnerIdGetter(() => partnerIdRef.current);
    setPartnerGetter(() => partnerIdRef.current);
  }, []);

  // -------------------------------------------------------------------------
  // Resolve partner on mount based on mode
  // -------------------------------------------------------------------------

  useEffect(() => {
    resolvePartner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, userpartnerId]);

  const resolvePartner = useCallback(() => {
    // Mode: none — partner context not needed
    if (mode === "none") {
      setStatus("not-required");
      return;
    }

    setStatus("resolving");
    setError(null);

    // 1. Try subdomain
    const subdomainSlug = getPartnerFromSubdomain();
    if (subdomainSlug && memberships.length > 0) {
      const match = memberships.find((m) => m.partnerSlug === subdomainSlug);
      if (match) {
        applypartnerId(match.partnerId);
        return;
      }
    }

    // 2. Try stored partner ID
    const stored = getStoredpartnerId();
    if (stored) {
      // Reject obviously invalid stored values (e.g. mock IDs like "partner-001")
      if (!isValidpartnerIdentifier(stored)) {
        clearStoredpartnerId();
      } else if (memberships.length > 0) {
        // Validate stored partner against memberships (if available)
        const valid = memberships.find((m) => m.partnerId === stored);
        if (valid) {
          applypartnerId(stored);
          return;
        }
        // Stored partner no longer valid — clear it
        clearStoredpartnerId();
      } else if (mode === "optional" && userpartnerId) {
        // Platform admin with known partner — validate stored value against user's partner.
        // If stored matches the user's own partner, accept it.
        // If stored differs (user switched partner), still accept but only if
        // we can reasonably assume it's valid. After a DB reset, stale UUIDs
        // would break all API calls. Prefer the user's own partner as the safe default.
        if (stored === userpartnerId) {
          applypartnerId(stored);
          return;
        }
        // Stored differs from user's partner — could be a deliberate switch
        // or a stale value from before a DB reset. Since we can't validate
        // without an API call (which would also fail with the stale ID),
        // fall through to use userpartnerId as a safe default.
        // The user can re-select a different partner via the partner switcher.
        clearStoredpartnerId();
      } else if (mode === "optional") {
        // Platform admin without userpartnerId — accept stored as-is
        applypartnerId(stored);
        return;
      }
    }

    // 3. Try user's partner ID from auth context
    if (userpartnerId) {
      applypartnerId(userpartnerId);
      return;
    }

    // 4. If user has exactly one membership, auto-select
    if (memberships.length === 1) {
      applypartnerId(memberships[0].partnerId);
      return;
    }

    // 5. Could not resolve
    if (mode === "required" || mode === "derived") {
      setStatus("error");
      setError(
        mode === "required"
          ? "A partner context is required. Please select a partner."
          : "Could not determine partner from your account. Please contact support."
      );
    } else {
      // Optional — no partner is fine
      setStatus("resolved");
    }
  }, [mode, userpartnerId, memberships]);

  // -------------------------------------------------------------------------
  // Apply resolved partner ID
  // -------------------------------------------------------------------------

  const applypartnerId = useCallback((id: string) => {
    setPartnerIdState(id);
    setStoredpartnerId(id);
    setStatus("resolved");
    setError(null);
  }, []);

  // -------------------------------------------------------------------------
  // Public actions
  // -------------------------------------------------------------------------

  const setPartnerIdAction = useCallback(
    (id: string) => {
      applypartnerId(id);
    },
    [applypartnerId]
  );

  const clearPartner = useCallback(() => {
    setPartnerIdState(null);
    setPartner(null);
    clearStoredpartnerId();
    if (mode === "required" || mode === "derived") {
      setStatus("error");
      setError("Partner context cleared. Please select a partner.");
    } else {
      setStatus("resolved");
    }
  }, [mode]);

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const isRequired = mode === "required" || mode === "derived";
  const isReady =
    status === "resolved" ||
    status === "not-required" ||
    (!isRequired && status !== "resolving");

  const canSwitch = useMemo(() => {
    // Vendor portal: cannot switch partners (Part-4 §4.5)
    if (mode === "derived") return false;
    // Platform portal: can switch if user has access
    if (mode === "optional") return true;
    // Partner portal: only if user belongs to multiple partners
    if (mode === "required") return memberships.length > 1;
    return false;
  }, [mode, memberships.length]);

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------

  const value = useMemo<PartnerContextValue>(
    () => ({
      partnerId,
      partner,
      status,
      error,
      isReady,
      isRequired,
      setPartnerId: setPartnerIdAction,
      clearPartner,
      availablePartners: memberships,
      canSwitch,
    }),
    [
      partnerId,
      partner,
      status,
      error,
      isReady,
      isRequired,
      setPartnerIdAction,
      clearPartner,
      memberships,
      canSwitch,
    ]
  );

  return (
    <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>
  );
}
