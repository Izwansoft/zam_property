// =============================================================================
// Platform — Notification Preferences Content
// =============================================================================

"use client";

import { PageHeader } from "@/components/common/page-header";
import { NotificationPreferencesGrid } from "@/modules/notification/components/notification-preferences-grid";

export function NotificationPreferencesContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Preferences"
        description="Choose how and when you receive notifications."
        hideBreadcrumb
      />

      <NotificationPreferencesGrid showWhatsapp />
    </div>
  );
}
