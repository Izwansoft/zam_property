// =============================================================================
// NotificationPreferencesGrid â€” 13 types Ã— 5 channels toggle grid
// =============================================================================
// Fetches current preferences, renders a grouped toggle grid, and auto-saves
// on toggle with debounced PATCH. Categories: Listings, Interactions, Reviews,
// Subscriptions, Vendors, System.
// =============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { showSuccess, showError } from "@/lib/errors/toast-helpers";
import type {
  NotificationType,
  NotificationChannel,
  NotificationCategory,
  NotificationPreference,
} from "../types";
import { NOTIFICATION_TYPE_CONFIG } from "../types";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "../hooks/use-notification-preferences";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_CHANNELS: NotificationChannel[] = [
  "IN_APP",
  "EMAIL",
  "SMS",
  "PUSH",
  "WHATSAPP",
];

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  IN_APP: "In-App",
  EMAIL: "Email",
  SMS: "SMS",
  PUSH: "Push",
  WHATSAPP: "WhatsApp",
};

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  listings: "Listings",
  interactions: "Interactions",
  reviews: "Reviews",
  subscriptions: "Subscriptions",
  payments: "Payments",
  vendors: "Vendors",
  system: "System",
};

const CATEGORY_ORDER: NotificationCategory[] = [
  "listings",
  "interactions",
  "reviews",
  "subscriptions",
  "payments",
  "vendors",
  "system",
];

/** Channels that are always on and cannot be toggled off */
const ALWAYS_ON: Partial<
  Record<NotificationType, NotificationChannel[]>
> = {
  SYSTEM_ALERT: ["IN_APP"],
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NotificationPreferencesGridProps {
  /** Show WhatsApp channel column (hidden by default) */
  showWhatsapp?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationPreferencesGrid({
  showWhatsapp = false,
}: NotificationPreferencesGridProps) {
  const { data, isLoading, error } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  // Local state for optimistic updates
  const [localPrefs, setLocalPrefs] = useState<NotificationPreference[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync API data â†’ local state
  useEffect(() => {
    if (data?.preferences) {
      setLocalPrefs(data.preferences);
    }
  }, [data]);

  const visibleChannels = showWhatsapp
    ? ALL_CHANNELS
    : ALL_CHANNELS.filter((c) => c !== "WHATSAPP");

  // Group preferences by category
  const grouped = CATEGORY_ORDER.map((category) => {
    const types = Object.entries(NOTIFICATION_TYPE_CONFIG)
      .filter(([, config]) => config.category === category)
      .map(([type]) => type as NotificationType);
    return { category, types };
  }).filter((g) => g.types.length > 0);

  // Toggle handler with debounced save
  const handleToggle = useCallback(
    (type: NotificationType, channel: NotificationChannel) => {
      setLocalPrefs((prev) => {
        const updated = prev.map((pref) => {
          if (pref.type !== type) return pref;
          return {
            ...pref,
            channels: {
              ...pref.channels,
              [channel]: !pref.channels[channel],
            },
          };
        });

        // Debounce the save
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          updateMutation.mutate(
            { preferences: updated },
            {
              onSuccess: () => showSuccess("Preferences saved."),
              onError: () => showError("Failed to save preferences."),
            }
          );
        }, 600);

        return updated;
      });
    },
    [updateMutation]
  );

  const getChannelEnabled = (
    type: NotificationType,
    channel: NotificationChannel
  ): boolean => {
    const pref = localPrefs.find((p) => p.type === type);
    return pref?.channels[channel] ?? false;
  };

  const isAlwaysOn = (
    type: NotificationType,
    channel: NotificationChannel
  ): boolean => {
    return ALWAYS_ON[type]?.includes(channel) ?? false;
  };

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load notification preferences. Please try again.
      </div>
    );
  }

  if (isLoading) {
    return <NotificationPreferencesGridSkeleton channels={visibleChannels.length} />;
  }

  return (
    <div className="space-y-6">
      {grouped.map(({ category, types }) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {CATEGORY_LABELS[category]}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-50">Notification</TableHead>
                  {visibleChannels.map((ch) => (
                    <TableHead key={ch} className="w-20 text-center">
                      {CHANNEL_LABELS[ch]}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map((type) => {
                  const config = NOTIFICATION_TYPE_CONFIG[type];
                  return (
                    <TableRow key={type}>
                      <TableCell className="font-medium">
                        {config.label}
                      </TableCell>
                      {visibleChannels.map((channel) => {
                        const alwaysOn = isAlwaysOn(type, channel);
                        const enabled = alwaysOn || getChannelEnabled(type, channel);
                        return (
                          <TableCell key={channel} className="text-center">
                            {alwaysOn ? (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                Always
                              </Badge>
                            ) : (
                              <Switch
                                checked={enabled}
                                onCheckedChange={() =>
                                  handleToggle(type, channel)
                                }
                                aria-label={`${config.label} via ${CHANNEL_LABELS[channel]}`}
                              />
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function NotificationPreferencesGridSkeleton({
  channels,
}: {
  channels: number;
}) {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-4">
                  {Array.from({ length: channels }).map((_, k) => (
                    <Skeleton key={k} className="h-5 w-9 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { NotificationPreferencesGridSkeleton };

