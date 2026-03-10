"use client";

// =============================================================================
// Partner Hooks — usePartner, usePartnerId, usePartnerRequired, usePartnerSwitcher
// =============================================================================
// Convenience hooks that consume PartnerContext.
// Pages and components should use these instead of useContext(PartnerContext).
// =============================================================================

import { useContext, useCallback } from "react";
import {
  PartnerContext,
  type PartnerContextValue,
} from "../context/partner-context";
import type { Partner, PartnerMembership } from "../types";

// ---------------------------------------------------------------------------
// usePartner — full partner context
// ---------------------------------------------------------------------------

/**
 * Access the complete partner context.
 * @throws Error if used outside PartnerProvider.
 */
export function usePartner(): PartnerContextValue {
  const context = useContext(PartnerContext);
  if (!context) {
    throw new Error(
      "usePartner must be used within a PartnerProvider. " +
        "Ensure the portal layout wraps children with PartnerProvider."
    );
  }
  return context;
}

// ---------------------------------------------------------------------------
// usePartnerId — just the current partner ID (most common use case)
// ---------------------------------------------------------------------------

/**
 * Get the current partner ID. Returns null if no partner is resolved or
 * if called outside a PartnerProvider (e.g. public pages).
 */
export function usePartnerId(): string | null {
  const context = useContext(PartnerContext);
  return context?.partnerId ?? null;
}

// ---------------------------------------------------------------------------
// usePartnerRequired — non-null partner ID for partner/vendor portals
// ---------------------------------------------------------------------------

/**
 * Get the partner ID where it is guaranteed to be present.
 * Should only be used inside portals where partner is required/derived.
 *
 * @throws Error if partner ID is not resolved.
 */
export function usePartnerRequired(): string {
  const { partnerId, isRequired, status } = usePartner();

  if (!partnerId) {
    if (isRequired && status === "error") {
      throw new Error(
        "Partner context is required but could not be resolved. " +
          "The user may not have a partner membership."
      );
    }
    throw new Error(
      "usePartnerRequired called but partner ID is null. " +
        "This hook should only be used in portals where partner is required."
    );
  }

  return partnerId;
}

// ---------------------------------------------------------------------------
// usePartnerSwitcher — partner switching logic
// ---------------------------------------------------------------------------

export interface PartnerSwitcherHelpers {
  /** Currently selected partner ID */
  currentPartnerId: string | null;
  /** Available partners to switch to */
  availablePartners: PartnerMembership[];
  /** Whether switching is allowed */
  canSwitch: boolean;
  /** Switch to a different partner */
  switchPartner: (partnerId: string) => void;
  /** Clear current partner selection */
  clearPartner: () => void;
}

/**
 * Hook for partner switching UI (partner selector dropdown, platform admin).
 */
export function usePartnerSwitcher(): PartnerSwitcherHelpers {
  const { partnerId, availablePartners, canSwitch, setPartnerId, clearPartner } =
    usePartner();

  const switchPartner = useCallback(
    (newPartnerId: string) => {
      if (!canSwitch) {
        console.warn("Partner switching is not allowed in this portal.");
        return;
      }
      setPartnerId(newPartnerId);
    },
    [canSwitch, setPartnerId]
  );

  return {
    currentPartnerId: partnerId,
    availablePartners,
    canSwitch,
    switchPartner,
    clearPartner,
  };
}

// ---------------------------------------------------------------------------
// usePartnerInfo — partner details (if loaded)
// ---------------------------------------------------------------------------

/**
 * Get the current partner entity details.
 * Returns null if partner details haven't been fetched yet.
 */
export function usePartnerInfo(): Partner | null {
  const { partner } = usePartner();
  return partner;
}

// ---------------------------------------------------------------------------
// usePartnerStatus — resolution status
// ---------------------------------------------------------------------------

export interface PartnerStatusHelpers {
  /** Whether partner is resolved and ready */
  isReady: boolean;
  /** Whether partner is currently resolving */
  isResolving: boolean;
  /** Whether there was a resolution error */
  hasError: boolean;
  /** Error message */
  error: string | null;
  /** Whether partner context is required */
  isRequired: boolean;
}

export function usePartnerStatus(): PartnerStatusHelpers {
  const { status, error, isReady, isRequired } = usePartner();

  return {
    isReady,
    isResolving: status === "resolving" || status === "idle",
    hasError: status === "error",
    error,
    isRequired,
  };
}
