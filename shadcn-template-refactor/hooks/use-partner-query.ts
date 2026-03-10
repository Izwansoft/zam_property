"use client";

// =============================================================================
// usePartnerQuery — Partner-scoped query key helpers
// =============================================================================
// Provides utility hooks and helpers that scope TanStack Query keys
// to the current partner. This ensures proper cache isolation when
// users switch partners.
//
// Usage:
//   const { scopedKey } = usePartnerQueryKey();
//   useQuery({ queryKey: scopedKey("listings", "list", filters), ... });
// =============================================================================

import { useCallback, useMemo } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { usePartnerId } from "@/modules/partner/hooks/use-partner";

// ---------------------------------------------------------------------------
// usePartnerQueryKey — scoped key factory
// ---------------------------------------------------------------------------

export interface PartnerQueryKeyHelpers {
  /** Current partner ID (null if no partner) */
  partnerId: string | null;

  /**
   * Create a partner-scoped query key.
   * Prepends ["partner", partnerId, ...] to the provided segments.
   *
   * @example
   *   scopedKey("listings", "list", { status: "PUBLISHED" })
   *   // → ["partner", "partner-001", "listings", "list", { status: "PUBLISHED" }]
   */
  scopedKey: (...segments: unknown[]) => readonly unknown[];

  /**
   * Invalidate all queries scoped to the current partner.
   * Useful when switching partners.
   */
  invalidateAllPartnerQueries: () => Promise<void>;

  /**
   * Invalidate all queries for a specific resource within the partner.
   *
   * @example
   *   invalidatePartnerResource("listings")
   *   // Invalidates all queries starting with ["partner", partnerId, "listings"]
   */
  invalidatePartnerResource: (resource: string) => Promise<void>;
}

export function usePartnerQueryKey(): PartnerQueryKeyHelpers {
  const partnerId = usePartnerId();
  const queryClient = useQueryClient();

  const scopedKey = useCallback(
    (...segments: unknown[]): readonly unknown[] => {
      if (!partnerId) {
        // Without partner — return unscoped key (for platform-level queries)
        return segments;
      }
      return ["partner", partnerId, ...segments] as const;
    },
    [partnerId]
  );

  const invalidateAllPartnerQueries = useCallback(async () => {
    if (!partnerId) return;
    await queryClient.invalidateQueries({
      queryKey: ["partner", partnerId],
    });
  }, [partnerId, queryClient]);

  const invalidatePartnerResource = useCallback(
    async (resource: string) => {
      if (!partnerId) {
        await queryClient.invalidateQueries({
          queryKey: [resource],
        });
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: ["partner", partnerId, resource],
      });
    },
    [partnerId, queryClient]
  );

  return useMemo(
    () => ({
      partnerId,
      scopedKey,
      invalidateAllPartnerQueries,
      invalidatePartnerResource,
    }),
    [partnerId, scopedKey, invalidateAllPartnerQueries, invalidatePartnerResource]
  );
}

// ---------------------------------------------------------------------------
// Standalone helper — for use outside React components
// ---------------------------------------------------------------------------

/**
 * Create a partner-scoped query key without hooks.
 * Useful in query key factories (lib/query/index.ts) and prefetching.
 */
export function makePartnerQueryKey(
  partnerId: string | null,
  ...segments: unknown[]
): readonly unknown[] {
  if (!partnerId) return segments;
  return ["partner", partnerId, ...segments] as const;
}
