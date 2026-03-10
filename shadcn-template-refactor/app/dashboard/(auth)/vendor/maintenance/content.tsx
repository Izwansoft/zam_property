// =============================================================================
// VendorMaintenanceContent — Owner's maintenance inbox (list view)
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Wrench } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { showSuccess } from "@/lib/errors/toast-helpers";
import { usePartnerId } from "@/modules/partner/hooks/use-partner";

import {
  OwnerMaintenanceInbox,
  OwnerMaintenanceInboxSkeleton,
} from "@/modules/maintenance/components/owner-maintenance-inbox";
import { MaintenanceAssignDialog } from "@/modules/maintenance/components/maintenance-assign-dialog";
import { useOwnerMaintenanceTickets } from "@/modules/maintenance/hooks/useOwnerMaintenance";
import {
  useVerifyMaintenance,
  useCloseMaintenance,
} from "@/modules/maintenance/hooks/useOwnerMaintenance";
import { useMaintenanceRealtime } from "@/lib/websocket/hooks/use-maintenance-realtime";
import type { Maintenance } from "@/modules/maintenance";
import { MaintenancePriority } from "@/modules/maintenance";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VendorMaintenanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const partnerId = usePartnerId();

  // Filter state from URL
  const [activeFilter, setActiveFilter] = useState(
    searchParams.get("filter") || "all"
  );
  const [priorityFilter, setPriorityFilter] = useState(
    searchParams.get("priority") || "all"
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  // Assign dialog state
  const [assignTicket, setAssignTicket] = useState<Maintenance | null>(null);

  // Fetch owner maintenance tickets
  const { data, isLoading } = useOwnerMaintenanceTickets({
    page,
    pageSize: 20,
    priority: priorityFilter !== "all" ? priorityFilter as MaintenancePriority : undefined,
  });

  // Real-time updates for maintenance events
  useMaintenanceRealtime({ partnerId });

  // URL update helper
  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "1") {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });
      const query = newParams.toString();
      router.replace(query ? `?${query}` : ".", { scroll: false });
    },
    [searchParams, router]
  );

  // Filter change handlers
  const handleFilterChange = useCallback(
    (filter: string) => {
      setActiveFilter(filter);
      setPage(1);
      updateUrl({ filter, page: "1" });
    },
    [updateUrl]
  );

  const handlePriorityChange = useCallback(
    (priority: string) => {
      setPriorityFilter(priority);
      setPage(1);
      updateUrl({ priority, page: "1" });
    },
    [updateUrl]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      updateUrl({ page: String(newPage) });
    },
    [updateUrl]
  );

  // Quick action handler for inline actions (verify, assign, close)
  const handleQuickAction = useCallback(
    (ticketId: string, action: string) => {
      const ticket = data?.items?.find((t: Maintenance) => t.id === ticketId);
      if (!ticket) return;

      switch (action) {
        case "verify":
          // Navigate to detail for verify (with notes)
          router.push(`/dashboard/vendor/maintenance/${ticketId}?action=verify`);
          break;
        case "assign":
          setAssignTicket(ticket);
          break;
        case "close":
          // Navigate to detail for close confirmation
          router.push(`/dashboard/vendor/maintenance/${ticketId}?action=close`);
          break;
        default:
          break;
      }
    },
    [data?.items, router]
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Page Header */}
      <PageHeader
        title="Maintenance"
        description="Manage maintenance requests across all your properties"
        icon={Wrench}
      />

      {/* Owner Maintenance Inbox */}
      <OwnerMaintenanceInbox
        tickets={data?.items || []}
        isLoading={isLoading}
        basePath="/dashboard/vendor/maintenance"
        pagination={data?.pagination}
        onPageChange={handlePageChange}
        onQuickAction={handleQuickAction}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={handlePriorityChange}
      />

      {/* Assign Dialog */}
      {assignTicket && (
        <MaintenanceAssignDialog
          ticket={assignTicket}
          open={!!assignTicket}
          onOpenChange={(open) => {
            if (!open) setAssignTicket(null);
          }}
          onSuccess={() => setAssignTicket(null)}
        />
      )}
    </div>
  );
}
