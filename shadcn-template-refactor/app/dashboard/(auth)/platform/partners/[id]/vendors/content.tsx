// =============================================================================
// Partner Vendors Sub-page — DataTable with filters, export, print
// =============================================================================
// Shows vendors scoped to this partner, filterable by vertical context.
// Backend: GET /api/v1/vendors (scoped via X-Partner-ID header)
// =============================================================================

"use client";

import * as React from "react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, Pencil, Ban, ShieldCheck } from "lucide-react";
import { showInfo } from "@/lib/errors/toast-helpers";
import { useApproveVendor, useRejectVendor, useSuspendVendor, useReactivateVendor } from "@/modules/vendor/hooks/use-vendor-mutations";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import { EditVendorDialog } from "@/modules/vendor/components/edit-vendor-dialog";
import { type ColumnDef } from "@tanstack/react-table";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PartnerDetailTabs } from "@/modules/partner/components/partner-detail-tabs";
import { PartnerDetailHeader } from "@/modules/partner/components/partner-detail";
import { usePartnerDetail } from "@/modules/partner/hooks/use-partner-detail";
import {
  useVerticalContextStore,
  getVerticalDisplayName,
} from "@/modules/vertical";
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/common/data-table";
import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { formatRelativeDate } from "@/modules/listing";
import type { Vendor, VendorStatus, VendorType } from "@/modules/vendor/types";
import { cn, getAvatarFallbackClass, getInitials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Hook: admin-scoped vendor list for a partner
// ---------------------------------------------------------------------------

function usePartnerVendors(partnerScope?: string, verticalType?: string | null) {
  const params: Record<string, unknown> = { page: 1, limit: 100 };
  if (verticalType) params.verticalType = verticalType;

  return useApiPaginatedQuery<Vendor>({
    queryKey: queryKeys.vendors.list(partnerScope ?? "__partner_scope_pending__", { page: 1, pageSize: 100, verticalType: verticalType ?? undefined }),
    path: "/vendors",
    params,
    partnerScope,
    format: "A",
    enabled: !!partnerScope,
  });
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VENDOR_STATUS_CONFIG: Record<string, { label: string; variant: string }> = {
  PENDING: { label: "Pending", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  SUSPENDED: { label: "Suspended", variant: "destructive" },
};

const VENDOR_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: "Individual",
  COMPANY: "Company",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Column Definitions
// ---------------------------------------------------------------------------

const columns: ColumnDef<Vendor, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vendor" />
    ),
    cell: ({ row }) => {
      const vendor = row.original;
      return (
        <div className="flex items-center gap-3 max-w-72">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className={cn("text-xs font-semibold", getAvatarFallbackClass(vendor.name))}>
              {getInitials(vendor.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">{vendor.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {vendor.email}
            </p>
          </div>
        </div>
      );
    },
    filterFn: (row, _id, value) =>
      (row.getValue("name") as string)
        .toLowerCase()
        .includes(String(value).toLowerCase()),
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {VENDOR_TYPE_LABELS[row.getValue("type") as string] ?? row.getValue("type")}
      </Badge>
    ),
    filterFn: (row, id, value) =>
      (value as string[]).includes(row.getValue(id)),
  },
  {
    accessorKey: "verticalType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vertical" />
    ),
    cell: ({ row }) => {
      const vertical = row.getValue("verticalType") as string | null;
      if (!vertical) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <Badge variant="secondary" className="text-xs">
          {getVerticalDisplayName(vertical)}
        </Badge>
      );
    },
    filterFn: (row, id, value) =>
      (value as string[]).includes(row.getValue(id) as string),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const config = VENDOR_STATUS_CONFIG[status];
      return (
        <Badge variant={(config?.variant ?? "outline") as "default"}>
          {config?.label ?? status}
        </Badge>
      );
    },
    filterFn: (row, id, value) =>
      (value as string[]).includes(row.getValue(id)),
  },
  {
    accessorKey: "listingCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Listings" />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {row.getValue("listingCount")}
      </span>
    ),
  },
  {
    accessorKey: "rating",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rating" />
    ),
    cell: ({ row }) => {
      const rating = row.getValue("rating") as number;
      return (
        <span className="text-sm">
          {rating > 0 ? `${rating.toFixed(1)} ★` : "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Joined" />
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatRelativeDate(row.getValue("createdAt"))}
      </span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Faceted Filters
// ---------------------------------------------------------------------------

const facetedFilters: FacetedFilterConfig[] = [
  {
    columnId: "status",
    title: "Status",
    options: [
      { label: "Pending", value: "PENDING" },
      { label: "Approved", value: "APPROVED" },
      { label: "Rejected", value: "REJECTED" },
      { label: "Suspended", value: "SUSPENDED" },
    ],
  },
  {
    columnId: "type",
    title: "Type",
    options: [
      { label: "Individual", value: "INDIVIDUAL" },
      { label: "Company", value: "COMPANY" },
    ],
  },
];

const exportColumns: Record<string, string> = {
  name: "Vendor Name",
  type: "Type",
  status: "Status",
  listingCount: "Listings",
  rating: "Rating",
  createdAt: "Joined",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartnerVendorsContent() {
  const params = useParams<{ id: string }>();
  const partnerId = params.id;
  const router = useRouter();

  const { data: partner } = usePartnerDetail(partnerId);
  const selectedVertical = useVerticalContextStore((s) => s.selectedVertical);
  const partnerScope = partner?.slug;
  const { data, isLoading, error } = usePartnerVendors(partnerScope, selectedVertical);

  // Mutation hooks
  const approveVendor = useApproveVendor();
  const rejectVendor = useRejectVendor();
  const suspendVendor = useSuspendVendor();
  const reactivateVendor = useReactivateVendor();

  // Dialog state
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject" | "suspend" | "reactivate";
    vendor: Vendor;
  } | null>(null);

  const vendors = React.useMemo(
    () => (data?.items ?? []) as Vendor[],
    [data?.items],
  );

  if (!partner) return null;

  const displayVertical = selectedVertical
    ? getVerticalDisplayName(selectedVertical)
    : null;

  return (
    <div className="space-y-6">
      <PartnerDetailHeader
        partner={partner}
        basePath="/dashboard/platform/partners"
      />

      <PartnerDetailTabs partnerId={partnerId} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Partner Vendors
            {displayVertical && (
              <Badge variant="secondary" className="ml-2 font-normal">
                {displayVertical}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {selectedVertical
              ? `Showing ${displayVertical} vendors for this partner.`
              : "All vendors registered under this partner."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-destructive py-8 text-center">
              Failed to load vendors. Please try again.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={vendors}
              isLoading={isLoading}
              enableRowSelection
              searchPlaceholder="Search vendors by name..."
              searchColumnId="name"
              facetedFilters={facetedFilters}
              enableExport
              exportFileName={`partner-vendors-${partnerId.slice(0, 8)}`}
              exportColumns={exportColumns}
              enablePrint
              pageSize={25}
              emptyMessage="No vendors found for this partner."
              rowActions={(vendor) => [
                {
                  label: "View vendor",
                  icon: Eye,
                  onClick: () => router.push(`/dashboard/platform/partners/${partnerId}/vendors/${vendor.id}`),
                },
                {
                  label: "Edit vendor",
                  icon: Pencil,
                  onClick: () => setEditVendor(vendor),
                },
                { type: "separator" as const },
                {
                  label: "Approve",
                  icon: ShieldCheck,
                  onClick: () => setConfirmAction({ type: "approve", vendor }),
                  hidden: vendor.status !== "PENDING",
                },
                {
                  label: "Reject",
                  icon: Ban,
                  onClick: () => setConfirmAction({ type: "reject", vendor }),
                  variant: "destructive" as const,
                  hidden: vendor.status !== "PENDING",
                },
                {
                  label: "Suspend",
                  icon: Ban,
                  onClick: () => setConfirmAction({ type: "suspend", vendor }),
                  variant: "destructive" as const,
                  hidden:
                    vendor.status === "SUSPENDED" ||
                    vendor.status === "REJECTED",
                },
                {
                  label: "Reactivate",
                  icon: ShieldCheck,
                  onClick: () => setConfirmAction({ type: "reactivate", vendor }),
                  hidden: vendor.status !== "SUSPENDED",
                },
              ]}
              onRowClick={(vendor) => router.push(`/dashboard/platform/partners/${partnerId}/vendors/${vendor.id}`)}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Vendor Dialog */}
      {editVendor && (
        <EditVendorDialog
          vendor={editVendor}
          open={!!editVendor}
          onOpenChange={(open) => !open && setEditVendor(null)}
        />
      )}

      {/* Approve Vendor */}
      <ConfirmActionDialog
        open={confirmAction?.type === "approve"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Approve Vendor"
        description={`Approve "${confirmAction?.vendor.name}"? They will be able to create listings.`}
        confirmLabel="Approve"
        isPending={approveVendor.isPending}
        onConfirm={() =>
          approveVendor.mutate(confirmAction!.vendor.id, {
            onSuccess: () => setConfirmAction(null),
          })
        }
      />

      {/* Reject Vendor */}
      <ConfirmActionDialog
        open={confirmAction?.type === "reject"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Reject Vendor"
        description={`Reject "${confirmAction?.vendor.name}"? Provide a reason.`}
        confirmLabel="Reject"
        confirmVariant="destructive"
        requiresReason
        reasonLabel="Rejection Reason"
        reasonPlaceholder="Why is this vendor being rejected?"
        isPending={rejectVendor.isPending}
        onConfirm={(reason) =>
          rejectVendor.mutate(
            { id: confirmAction!.vendor.id, reason: reason! },
            { onSuccess: () => setConfirmAction(null) },
          )
        }
      />

      {/* Suspend Vendor */}
      <ConfirmActionDialog
        open={confirmAction?.type === "suspend"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Suspend Vendor"
        description={`Suspend "${confirmAction?.vendor.name}"? They will lose access.`}
        confirmLabel="Suspend"
        confirmVariant="destructive"
        requiresReason
        reasonLabel="Suspension Reason"
        reasonPlaceholder="Why is this vendor being suspended?"
        isPending={suspendVendor.isPending}
        onConfirm={(reason) =>
          suspendVendor.mutate(
            { id: confirmAction!.vendor.id, reason: reason! },
            { onSuccess: () => setConfirmAction(null) },
          )
        }
      />

      {/* Reactivate Vendor */}
      <ConfirmActionDialog
        open={confirmAction?.type === "reactivate"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Reactivate Vendor"
        description={`Reactivate "${confirmAction?.vendor.name}"? Their account will be restored.`}
        confirmLabel="Reactivate"
        isPending={reactivateVendor.isPending}
        onConfirm={() =>
          reactivateVendor.mutate(confirmAction!.vendor.id, {
            onSuccess: () => setConfirmAction(null),
          })
        }
      />
    </div>
  );
}
