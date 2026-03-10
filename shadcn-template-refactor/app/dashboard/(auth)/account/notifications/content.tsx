// =============================================================================
// Notifications — Client content component (preferences management)
// =============================================================================

"use client";

import { useState, useCallback, useEffect } from "react";

import { PageHeader } from "@/components/common/page-header";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/modules/account/hooks/use-notification-preferences";
import {
  NotificationPreferencesGrid,
  NotificationPreferencesGridSkeleton,
} from "@/modules/account/components/notification-preferences-grid";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";
import type {
  NotificationPreference,
  NotificationChannel,
  NotificationType,
} from "@/modules/account/types";

export function NotificationsContent() {
  const { data, isLoading, error } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  // Local editable state
  const [localPrefs, setLocalPrefs] = useState<NotificationPreference[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Sync server data to local state
  useEffect(() => {
    if (data?.preferences) {
      setLocalPrefs(data.preferences);
      setIsDirty(false);
    }
  }, [data]);

  const handleChange = useCallback(
    (type: NotificationType, channel: NotificationChannel, enabled: boolean) => {
      setLocalPrefs((prev) =>
        prev.map((pref) =>
          pref.type === type
            ? {
                ...pref,
                channels: { ...pref.channels, [channel]: enabled },
              }
            : pref
        )
      );
      setIsDirty(true);
    },
    []
  );

  const handleSave = useCallback(() => {
    updateMutation.mutate(
      {
        preferences: localPrefs.map((p) => ({
          type: p.type,
          channels: p.channels,
        })),
      },
      {
        onSuccess: () => {
          showSuccess("Notification preferences saved.");
          setIsDirty(false);
        },
        onError: () => {
          showError("Failed to save preferences. Please try again.");
        },
      }
    );
  }, [localPrefs, updateMutation]);

  const handleReset = useCallback(() => {
    if (data?.preferences) {
      setLocalPrefs(data.preferences);
      setIsDirty(false);
    }
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Choose how and when you want to be notified."
        breadcrumbOverrides={[
          { segment: "account", label: "My Account" },
          { segment: "notifications", label: "Notifications" },
        ]}
      />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load notification preferences. Please try again.
        </div>
      )}

      {isLoading && <NotificationPreferencesGridSkeleton />}

      {!isLoading && localPrefs.length > 0 && (
        <NotificationPreferencesGrid
          preferences={localPrefs}
          onChange={handleChange}
          onSave={handleSave}
          onReset={handleReset}
          saving={updateMutation.isPending}
          isDirty={isDirty}
        />
      )}
    </div>
  );
}
