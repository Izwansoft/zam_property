// =============================================================================
// Notification Preferences Hooks
// =============================================================================
// useNotificationPreferences  — GET  /notifications/preferences
// useUpdateNotificationPreferences — PATCH /notifications/preferences
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { queryKeys } from "@/lib/query";
import type { NotificationPreferences } from "../types";

// ---------------------------------------------------------------------------
// Query key extension
// ---------------------------------------------------------------------------

const PREFERENCES_KEY = [...queryKeys.notifications.all, "preferences"] as const;

// ---------------------------------------------------------------------------
// useNotificationPreferences
// ---------------------------------------------------------------------------

/**
 * Fetch the current user's notification preferences (per-type × per-channel).
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useNotificationPreferences();
 * // data?.preferences → NotificationPreference[]
 * ```
 */
export function useNotificationPreferences() {
  return useApiQuery<NotificationPreferences>({
    path: "/notifications/preferences",
    queryKey: PREFERENCES_KEY,
    staleTime: 60_000, // 60s — preferences rarely change
  });
}

// ---------------------------------------------------------------------------
// useUpdateNotificationPreferences
// ---------------------------------------------------------------------------

/**
 * Update notification preferences (debounced toggle saves).
 *
 * The backend accepts the full preferences array. The component
 * flips one toggle at a time and sends the entire updated array.
 *
 * @example
 * ```tsx
 * const update = useUpdateNotificationPreferences();
 * update.mutate({ preferences: updatedPrefs });
 * ```
 */
export function useUpdateNotificationPreferences() {
  return useApiMutation<NotificationPreferences, NotificationPreferences>({
    path: "/notifications/preferences",
    method: "PATCH",
    invalidateKeys: [PREFERENCES_KEY],
  });
}
