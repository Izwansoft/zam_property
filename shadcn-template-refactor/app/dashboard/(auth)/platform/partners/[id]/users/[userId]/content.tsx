// =============================================================================
// Partner-scoped User Detail — Client Content
// =============================================================================
// Thin wrapper around PlatformUserDetailContent that binds partner context.
// URL: /dashboard/platform/partners/:id/users/:userId
// =============================================================================

"use client";

import { useParams } from "next/navigation";
import { PlatformUserDetailContent } from "@/app/dashboard/(auth)/platform/users/[id]/content";

export function PartnerUserDetailContent() {
  const params = useParams<{ id: string; userId: string }>();

  return (
    <PlatformUserDetailContent
      userId={params.userId}
      backHref={`/dashboard/platform/partners/${params.id}/users`}
    />
  );
}
