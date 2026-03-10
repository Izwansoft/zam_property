// =============================================================================
// Platform Subscriptions Content — Admin view of plans & subscriptions
// =============================================================================
// Platform admins can view all plans, their entitlements, and configuration.
// Plan CRUD will be handled in a separate session (4.12 Pricing Config).
// =============================================================================

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Ban } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import {
  DataTable,
  DataTableColumnHeader,
  type RowAction,
  type FacetedFilterConfig,
} from "@/components/common/data-table";
import { usePlans } from "@/modules/subscription/hooks/use-plans";
import { PlanComparisonTable } from "@/modules/subscription/components/plan-comparison-table";
import type { Plan } from "@/modules/subscription/types";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { showError, showSuccess } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Column Definitions
// ---------------------------------------------------------------------------

const columns: ColumnDef<Plan, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Plan Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
    filterFn: (row, _id, value) => {
      return (row.getValue("name") as string)
        .toLowerCase()
        .includes(String(value).toLowerCase());
    },
  },
  {
    accessorKey: "slug",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Slug" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("slug")}</span>
    ),
  },
  {
    accessorKey: "priceMonthly",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Monthly" />
    ),
    cell: ({ row }) => {
      const plan = row.original;
      return (
        <span className="text-right tabular-nums block">
          {plan.currency} {parseFloat(plan.priceMonthly).toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: "priceYearly",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Yearly" />
    ),
    cell: ({ row }) => {
      const plan = row.original;
      return (
        <span className="text-right tabular-nums block">
          {plan.currency} {parseFloat(plan.priceYearly).toLocaleString()}
        </span>
      );
    },
  },
  {
    id: "isActive",
    accessorFn: (row) => (row.isActive ? "Active" : "Inactive"),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const plan = row.original;
      return (
        <Badge variant={plan.isActive ? "default" : "secondary"}>
          {plan.isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return (value as string[]).includes(row.getValue(id));
    },
  },
  {
    id: "isPublic",
    accessorFn: (row) => (row.isPublic ? "Public" : "Private"),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Public" />
    ),
    cell: ({ row }) => {
      const plan = row.original;
      return (
        <Badge variant={plan.isPublic ? "outline" : "secondary"}>
          {plan.isPublic ? "Public" : "Private"}
        </Badge>
      );
    },
  },
  {
    id: "listingLimit",
    accessorFn: (row) => row.entitlements.listings?.limit ?? null,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Listing Limit" />
    ),
    cell: ({ row }) => (
      <span className="text-right tabular-nums block">
        {row.getValue("listingLimit") ?? "—"}
      </span>
    ),
  },
  {
    id: "interactionLimit",
    accessorFn: (row) => row.entitlements.interactions?.limit ?? null,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Interaction Limit" />
    ),
    cell: ({ row }) => (
      <span className="text-right tabular-nums block">
        {row.getValue("interactionLimit") ?? "—"}
      </span>
    ),
  },
];



// ---------------------------------------------------------------------------
// Faceted Filters
// ---------------------------------------------------------------------------

const facetedFilters: FacetedFilterConfig[] = [
  {
    columnId: "isActive",
    title: "Status",
    options: [
      { label: "Active", value: "Active" },
      { label: "Inactive", value: "Inactive" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Export Columns
// ---------------------------------------------------------------------------

const exportColumns: Record<string, string> = {
  name: "Plan Name",
  slug: "Slug",
  priceMonthly: "Monthly",
  priceYearly: "Yearly",
  isActive: "Status",
  isPublic: "Public",
  listingLimit: "Listing Limit",
  interactionLimit: "Interaction Limit",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlatformSubscriptionsContent() {
  const router = useRouter();
  const { data: plansData, isLoading, error } = usePlans();
  const deactivatePlan = useApiMutation<unknown, string>({
    path: (id) => `/plans/${id}/deactivate`,
    method: "PATCH",
  });

  const plans = React.useMemo(
    () => (plansData?.items ?? []) as Plan[],
    [plansData?.items],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans & Subscriptions"
        description="View and manage subscription plans across the platform."
      />

      {/* Plans DataTable */}
      {error ? (
        <div className="text-destructive py-8 text-center">
          Failed to load plans. Please try again.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={plans}
          isLoading={isLoading}
          searchPlaceholder="Search by plan name…"
          searchColumnId="name"
          facetedFilters={facetedFilters}
          enableExport
          exportFileName="platform-plans"
          exportColumns={exportColumns}
          enablePrint
          pageSize={20}
          emptyMessage="No plans configured yet."
          rowActions={(plan) => [
            {
              label: "View / Edit",
              icon: Pencil,
              onClick: () => router.push(`/dashboard/platform/subscriptions/${plan.id}`),
            },
            { type: "separator" as const },
            {
              label: "Deactivate",
              icon: Ban,
              onClick: async () => {
                try {
                  await deactivatePlan.mutateAsync(plan.id);
                  showSuccess("Plan deactivated", {
                    description: `${plan.name} is now inactive.`,
                  });
                } catch {
                  showError("Failed to deactivate plan", {
                    description: "Please try again.",
                  });
                }
              },
              variant: "destructive" as const,
              hidden: !plan.isActive,
            },
          ]}
          onRowClick={(plan) => router.push(`/dashboard/platform/subscriptions/${plan.id}`)}
        />
      )}

      {/* Full comparison table */}
      <PlanComparisonTable plans={plans} isLoading={isLoading} />
    </div>
  );
}
