// =============================================================================
// Platform Billing — Client Content
// =============================================================================
// Cross-partner billing overview for Platform Admin (SUPER_ADMIN).
// Shows PM billing stats + paginated bill list across all partners.
// =============================================================================

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import {
  DataTable,
  DataTableColumnHeader,
  type RowAction,
  type FacetedFilterConfig,
} from "@/components/common/data-table";
import { BillingStatus, BILLING_STATUS_CONFIG } from "@/modules/billing/types";
import { PMStatsDashboard } from "@/modules/admin/components/pm-stats-dashboard";
import { useAdminPMStats, useAdminBills, useBulkProcessBills } from "@/modules/admin/hooks/admin-pm";
import { formatRelativeDate } from "@/modules/listing";
import type { Billing } from "@/modules/billing/types";
import { Ban, Check, Download, Eye } from "lucide-react";
import { api } from "@/lib/api/client";
import { showError, showSuccess } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function BillingStatusBadge({ status }: { status: BillingStatus }) {
  const config = BILLING_STATUS_CONFIG[status];
  if (!config) {
    return <Badge variant="outline">{status}</Badge>;
  }
  return <Badge variant={config.variant as "default"}>{config.label}</Badge>;
}

function formatCurrency(value: number): string {
  return `RM ${value.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Column Definitions
// ---------------------------------------------------------------------------

const columns: ColumnDef<Billing, unknown>[] = [
  {
    accessorKey: "billNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bill #" />
    ),
    cell: ({ row }) => (
      <span className="font-medium font-mono text-xs">
        {row.getValue("billNumber")}
      </span>
    ),
    filterFn: (row, _id, value) => {
      const searchLower = String(value).toLowerCase();
      return (row.getValue("billNumber") as string)
        .toLowerCase()
        .includes(searchLower);
    },
  },
  {
    accessorKey: "billingPeriod",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Period" />
    ),
    cell: ({ row }) => (
      <span className="text-xs">
        {row.getValue("billingPeriod") ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <BillingStatusBadge status={row.getValue("status")} />
    ),
    filterFn: (row, id, value) => {
      return (value as string[]).includes(row.getValue(id));
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => (
      <span className="text-right font-mono text-sm block">
        {formatCurrency(row.getValue("totalAmount"))}
      </span>
    ),
  },
  {
    accessorKey: "paidAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Paid" />
    ),
    cell: ({ row }) => (
      <span className="text-right font-mono text-sm block">
        {formatCurrency(row.getValue("paidAmount"))}
      </span>
    ),
  },
  {
    accessorKey: "balanceDue",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Balance" />
    ),
    cell: ({ row }) => (
      <span className="text-right font-mono text-sm block">
        {formatCurrency(row.getValue("balanceDue"))}
      </span>
    ),
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("dueDate") as string | null;
      return (
        <span className="text-xs text-muted-foreground">
          {val ? formatRelativeDate(val) : "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "issueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Issued" />
    ),
    cell: ({ row }) => {
      const val = row.getValue("issueDate") as string | null;
      return (
        <span className="text-xs text-muted-foreground">
          {val ? formatRelativeDate(val) : "—"}
        </span>
      );
    },
  },
];



// ---------------------------------------------------------------------------
// Faceted Filters
// ---------------------------------------------------------------------------

const statusFilterOptions = Object.values(BillingStatus).map((status) => ({
  label: BILLING_STATUS_CONFIG[status]?.label ?? status,
  value: status,
}));

const facetedFilters: FacetedFilterConfig[] = [
  { columnId: "status", title: "Status", options: statusFilterOptions },
];

// ---------------------------------------------------------------------------
// Export Columns
// ---------------------------------------------------------------------------

const exportColumns: Record<string, string> = {
  billNumber: "Bill #",
  billingPeriod: "Period",
  status: "Status",
  totalAmount: "Total",
  paidAmount: "Paid",
  balanceDue: "Balance",
  dueDate: "Due Date",
  issueDate: "Issued",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlatformBillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partnerScope = searchParams.get("partnerId") ?? undefined;
  const { data: stats, isLoading: statsLoading } = useAdminPMStats();
  const { data, isLoading, error } = useAdminBills(
    { page: 1, pageSize: 100 },
    { partnerScope },
  );
  const bulkProcessBills = useBulkProcessBills();

  const bills = React.useMemo(
    () => (data?.items ?? []) as Billing[],
    [data?.items],
  );

  const downloadInvoice = React.useCallback(async (billId: string, billNumber: string) => {
    try {
      const response = await api.get(`/rent-billings/${billId}/download`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${billNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      showError("Failed to download invoice", {
        description: "Please try again.",
      });
    }
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description={
          partnerScope
            ? "Partner-scoped billing overview for governance and support operations."
            : "Platform-wide billing overview. View all rent bills across all partners."
        }
      />

      {/* Stats Section */}
      <PMStatsDashboard
        stats={stats}
        isLoading={statsLoading}
        sections={["billing"]}
      />

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bills</CardTitle>
          <CardDescription>
            All rent bills across all partners and properties.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-destructive py-8 text-center">
              Failed to load bills. Please try again.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={bills}
              isLoading={isLoading}
              searchPlaceholder="Search by bill number..."
              searchColumnId="billNumber"
              facetedFilters={facetedFilters}
              enableExport
              exportFileName="platform-bills"
              exportColumns={exportColumns}
              enablePrint
              pageSize={20}
              emptyMessage="No bills found."
              rowActions={(bill) => [
                {
                  label: "View details",
                  icon: Eye,
                  onClick: () => router.push(`/dashboard/platform/billing/${bill.id}`),
                },
                {
                  label: "Download invoice",
                  icon: Download,
                  onClick: () => downloadInvoice(bill.id, bill.billNumber),
                },
                { type: "separator" as const },
                {
                  label: "Send bill",
                  icon: Check,
                  onClick: async () => {
                    try {
                      await bulkProcessBills.mutateAsync({
                        billingIds: [bill.id],
                        action: "send",
                      });
                      showSuccess("Bill sent", {
                        description: `${bill.billNumber} has been sent.`,
                      });
                    } catch {
                      showError("Failed to send bill", {
                        description: "Please try again.",
                      });
                    }
                  },
                  hidden: ![BillingStatus.DRAFT, BillingStatus.GENERATED].includes(bill.status),
                },
                {
                  label: "Void bill",
                  icon: Ban,
                  onClick: async () => {
                    try {
                      await bulkProcessBills.mutateAsync({
                        billingIds: [bill.id],
                        action: "write-off",
                      });
                      showSuccess("Bill written off", {
                        description: `${bill.billNumber} marked as written-off.`,
                      });
                    } catch {
                      showError("Failed to void bill", {
                        description: "Please try again.",
                      });
                    }
                  },
                  variant: "destructive" as const,
                  hidden: bill.status === BillingStatus.WRITTEN_OFF,
                },
              ]}
              onRowClick={(bill) => router.push(`/dashboard/platform/billing/${bill.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
