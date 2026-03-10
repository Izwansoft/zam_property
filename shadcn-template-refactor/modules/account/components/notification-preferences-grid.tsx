// =============================================================================
// NotificationPreferencesGrid — Toggle grid for notification channels
// =============================================================================

"use client";

import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/common/loading-button";
import type {
  NotificationPreference,
  NotificationChannel,
  NotificationType,
} from "../types";

// ---------------------------------------------------------------------------
// Channel labels
// ---------------------------------------------------------------------------

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  EMAIL: "Email",
  PUSH: "Push",
  SMS: "SMS",
  IN_APP: "In-App",
  WHATSAPP: "WhatsApp",
};

const CHANNELS: NotificationChannel[] = ["EMAIL", "PUSH", "SMS", "IN_APP", "WHATSAPP"];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface NotificationPreferencesGridProps {
  preferences: NotificationPreference[];
  onChange: (type: NotificationType, channel: NotificationChannel, enabled: boolean) => void;
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
  isDirty: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationPreferencesGrid({
  preferences,
  onChange,
  onSave,
  onReset,
  saving,
  isDirty,
}: NotificationPreferencesGridProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 pr-4 text-left font-medium">
                    Notification Type
                  </th>
                  {CHANNELS.map((ch) => (
                    <th key={ch} className="px-3 py-3 text-center font-medium">
                      {CHANNEL_LABELS[ch]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preferences.map((pref) => (
                  <tr key={pref.type} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{pref.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {pref.description}
                      </p>
                    </td>
                    {CHANNELS.map((ch) => (
                      <td key={ch} className="px-3 py-3 text-center">
                        <Switch
                          checked={pref.channels[ch]}
                          onCheckedChange={(checked) =>
                            onChange(pref.type, ch, checked)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 justify-end">
        <Button variant="outline" onClick={onReset} disabled={!isDirty || saving}>
          Reset
        </Button>
        <SaveButton
          saving={saving}
          disabled={!isDirty}
          onClick={onSave}
        >
          Save Preferences
        </SaveButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function NotificationPreferencesGridSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-5 w-48" />
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-5 w-10" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
