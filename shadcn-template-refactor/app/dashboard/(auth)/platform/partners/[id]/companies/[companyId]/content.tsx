// =============================================================================
// Partner-scoped Company Detail — Client Content
// =============================================================================
// Thin wrapper around PlatformCompanyDetailContent that binds partner context.
// URL: /dashboard/platform/partners/:id/companies/:companyId
// =============================================================================

"use client";

import { useParams } from "next/navigation";
import { PlatformCompanyDetailContent } from "@/app/dashboard/(auth)/platform/companies/[id]/content";

export function PartnerCompanyDetailContent() {
  const params = useParams<{ id: string; companyId: string }>();

  return (
    <PlatformCompanyDetailContent
      companyId={params.companyId}
      backHref={`/dashboard/platform/partners/${params.id}/companies`}
    />
  );
}
