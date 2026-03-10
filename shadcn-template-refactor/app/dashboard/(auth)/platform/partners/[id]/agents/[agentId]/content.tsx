// =============================================================================
// Partner-scoped Agent Detail — Client Content
// =============================================================================
// Thin wrapper around PlatformAgentDetailContent that binds partner context.
// URL: /dashboard/platform/partners/:id/agents/:agentId
// =============================================================================

"use client";

import { useParams } from "next/navigation";
import { PlatformAgentDetailContent } from "@/app/dashboard/(auth)/platform/agents/[id]/content";

export function PartnerAgentDetailContent() {
  const params = useParams<{ id: string; agentId: string }>();

  return (
    <PlatformAgentDetailContent
      agentId={params.agentId}
      backHref={`/dashboard/platform/partners/${params.id}/agents`}
    />
  );
}
