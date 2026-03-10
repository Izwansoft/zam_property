// =============================================================================
// Tenant Maintenance Detail — Client content component
// =============================================================================

"use client";

import { useParams } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { usePartnerId } from "@/modules/partner/hooks/use-partner";
import { useMaintenanceTicket } from "@/modules/maintenance/hooks";
import {
  MaintenanceDetail,
  MaintenanceDetailSkeleton,
} from "@/modules/maintenance/components/maintenance-detail";
import { useMaintenanceRealtime } from "@/lib/websocket/hooks/use-maintenance-realtime";
import { useAuth } from "@/modules/auth";

export function MaintenanceDetailContent() {
  const params = useParams<{ id: string }>();
  const partnerId = usePartnerId();
  const { user } = useAuth();

  const { data: ticket, isLoading, error } = useMaintenanceTicket(params.id);

  // Real-time updates for this ticket
  useMaintenanceRealtime({
    partnerId,
    ticketId: params.id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <MaintenanceDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="Maintenance Detail"
          backHref="/dashboard/tenant/maintenance"
        />
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">
            Failed to load ticket
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <PageHeader
          title="Maintenance Detail"
          backHref="/dashboard/tenant/maintenance"
        />
        <div className="rounded-md border bg-muted/50 p-6 text-center">
          <h2 className="text-lg font-semibold">Ticket not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The maintenance ticket you&apos;re looking for doesn&apos;t exist or
            has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <MaintenanceDetail
        ticket={ticket}
        currentUserId={user?.id}
        backPath="/dashboard/tenant/maintenance"
      />
    </div>
  );
}
