// =============================================================================
// Platform Partners — Client content component
// =============================================================================

"use client";

import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { PartnerList } from "@/modules/partner/components/partner-list";

export function PlatformPartnersContent() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Partners"
        description="Manage and monitor all partners on the platform."
        actions={[
          {
            label: "Create Partner",
            icon: PlusIcon,
            onClick: () => router.push("/dashboard/platform/partners/create"),
          },
        ]}
      />

      <PartnerList basePath="/dashboard/platform/partners" />
    </div>
  );
}
