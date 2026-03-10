// =============================================================================
// useNotificationPreferences — Notification preference management
// =============================================================================
// Backend: GET /notifications/preferences → current preferences
//          PATCH /notifications/preferences → toggle single preference
// =============================================================================

"use client";

import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import type {
  NotificationPreferencesData,
  UpdateNotificationPreferencesDto,
} from "../types";

const PREFS_KEY = ["notifications", "preferences"] as const;

export function useNotificationPreferences() {
  return useApiQuery<NotificationPreferencesData>({
    queryKey: [...PREFS_KEY],
    path: "/notifications/preferences",
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateNotificationPreferences() {
  return useApiMutation<
    NotificationPreferencesData,
    UpdateNotificationPreferencesDto
  >({
    path: "/notifications/preferences",
    method: "PATCH",
    invalidateKeys: [[...PREFS_KEY]],
  });
}
