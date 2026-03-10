// =============================================================================
// Partner-scoped Vendor Detail — Client Content
// =============================================================================
// Thin wrapper around PlatformVendorDetailContent that binds partner context.
// URL: /dashboard/platform/partners/:id/vendors/:vendorId
// =============================================================================

"use client";

import { useParams } from "next/navigation";
import { PlatformVendorDetailContent } from "@/app/dashboard/(auth)/platform/vendors/[id]/content";

export function PartnerVendorDetailContent() {
  const params = useParams<{ id: string; vendorId: string }>();

  return (
    <PlatformVendorDetailContent
      vendorId={params.vendorId}
      backHref={`/dashboard/platform/partners/${params.id}/vendors`}
    />
  );
}
