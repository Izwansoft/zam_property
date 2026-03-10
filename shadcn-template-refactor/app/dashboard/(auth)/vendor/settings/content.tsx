// =============================================================================
// Vendor Settings — Client content (business info, logo, visibility)
// =============================================================================

"use client";

import { useRouter } from "next/navigation";
import { BellIcon } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { useAuthUser } from "@/modules/auth/hooks/use-auth";
import { useVendorSettings } from "@/modules/vendor/hooks/use-vendor-settings";
import {
  VendorSettingsForm,
  VendorSettingsFormSkeleton,
} from "@/modules/vendor/components/vendor-settings-form";

export function VendorSettingsContent() {
  const router = useRouter();
  const user = useAuthUser();
  const vendorId = user.primaryVendorId ?? undefined;
  const { data: settings, isLoading, error } = useVendorSettings(vendorId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Settings"
        description="Manage your business information, logo, and visibility preferences."
        breadcrumbOverrides={[
          { segment: "vendor", label: "Vendor" },
          { segment: "settings", label: "Settings" },
        ]}
        actions={[
          {
            label: "Notification Preferences",
            icon: BellIcon,
            variant: "outline" as const,
            onClick: () => router.push("/dashboard/vendor/settings/notifications"),
          },
        ]}
      />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load vendor settings. Please try again.
        </div>
      )}

      {isLoading && <VendorSettingsFormSkeleton />}

      {settings && vendorId && (
        <VendorSettingsForm settings={settings} vendorId={vendorId} />
      )}
    </div>
  );
}
