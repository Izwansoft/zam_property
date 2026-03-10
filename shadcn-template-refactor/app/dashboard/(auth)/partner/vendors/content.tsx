"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye, PlusIcon } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/common/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useVendors } from "@/modules/vendor/hooks/use-vendors";
import {
  useApproveVendor,
  useReactivateVendor,
  useRejectVendor,
  useSuspendVendor,
} from "@/modules/vendor/hooks/use-vendor-mutations";
import { CreateVendorDialog } from "@/modules/vendor/components/create-vendor-dialog";
import type { Vendor } from "@/modules/vendor/types";
import { formatDate, getVendorTypeLabel } from "@/modules/vendor/utils";
import { useActiveVerticalDefinitions } from "@/modules/vertical/hooks/use-vertical-definitions";

interface VendorRow {
  id: string;
  name: string;
  email?: string;
  type: string;
  verticalType: string | null;
  status: string;
  listingCount: number;
  rating: number;
  createdAt: string;
}

const typeFilterOptions = [
  { label: "Company", value: "COMPANY" },
  { label: "Individual", value: "INDIVIDUAL" },
];

const statusFilterOptions = [
  { label: "Approved", value: "APPROVED" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Pending", value: "PENDING" },
];

const facetedFilters: FacetedFilterConfig[] = [
  { columnId: "type", title: "Vendor Type", options: typeFilterOptions },
  { columnId: "status", title: "Status", options: statusFilterOptions },
];

const columns: ColumnDef<VendorRow, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor" />,
    cell: ({ row }) => {
      const vendor = row.original;
      return (
        <div className="min-w-0">
          <p className="truncate font-medium">{vendor.name}</p>
          <p className="truncate text-xs text-muted-foreground">{vendor.email || "-"}</p>
        </div>
      );
    },
    filterFn: (row, _id, value) => {
      const vendor = row.original;
      const searchLower = String(value).toLowerCase();
      return (
        vendor.name.toLowerCase().includes(searchLower) ||
        (vendor.email ?? "").toLowerCase().includes(searchLower)
      );
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor Type" />,
    cell: ({ row }) => {
      const type = row.getValue("type") as "COMPANY" | "INDIVIDUAL";
      return <Badge variant="outline">{getVendorTypeLabel(type)}</Badge>;
    },
    filterFn: (row, id, value) => {
      return (value as string[]).includes(String(row.getValue(id)));
    },
  },
  {
    accessorKey: "verticalType",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vertical" />,
    cell: ({ row }) => {
      const verticalType = row.getValue("verticalType") as string | null;
      return <span className="text-sm">{verticalType || "-"}</span>;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant="outline">{status}</Badge>;
    },
    filterFn: (row, id, value) => {
      return (value as string[]).includes(String(row.getValue(id)));
    },
  },
  {
    accessorKey: "listingCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Listings" />,
    cell: ({ row }) => <span className="text-sm">{row.original.listingCount}</span>,
  },
  {
    accessorKey: "rating",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rating" />,
    cell: ({ row }) => <span className="text-sm">{row.original.rating.toFixed(1)}</span>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => <span className="text-sm">{formatDate(row.original.createdAt)}</span>,
  },
];

function toRow(vendor: Vendor): VendorRow {
  return {
    id: vendor.id,
    name: vendor.name,
    email: vendor.email,
    type: vendor.type,
    verticalType: vendor.verticalType,
    status: vendor.status,
    listingCount: Number(vendor.listingCount ?? 0),
    rating: Number(vendor.rating ?? 0),
    createdAt: vendor.createdAt,
  };
}

export function PartnerVendorsContent() {
  const router = useRouter();

  const [openCreateDialog, setOpenCreateDialog] = React.useState(false);
  const [verticalFilter, setVerticalFilter] = React.useState<string>("ALL");

  const approveVendor = useApproveVendor();
  const rejectVendor = useRejectVendor();
  const suspendVendor = useSuspendVendor();
  const reactivateVendor = useReactivateVendor();

  const { data: verticalsData } = useActiveVerticalDefinitions();

  const vendorFilters = React.useMemo(
    () => ({
      page: 1,
      pageSize: 100,
      verticalType: verticalFilter === "ALL" ? undefined : verticalFilter,
    }),
    [verticalFilter],
  );

  const vendorsQuery = useVendors(vendorFilters);
  const pendingQuery = useVendors({ ...vendorFilters, status: "PENDING" });

  const allRows = React.useMemo(
    () => (vendorsQuery.data?.items ?? []).map(toRow),
    [vendorsQuery.data?.items],
  );

  const activeRows = React.useMemo(
    () => allRows.filter((row) => row.status !== "PENDING"),
    [allRows],
  );

  const applicationRows = React.useMemo(
    () => (pendingQuery.data?.items ?? []).map(toRow),
    [pendingQuery.data?.items],
  );

  const verticalOptions = React.useMemo(
    () =>
      (verticalsData ?? []).map((item) => ({
        label: item.name,
        value: item.type,
      })),
    [verticalsData],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description="Manage active vendors and review new vendor applications in one workspace."
        actions={[
          {
            label: "Create Vendor",
            icon: PlusIcon,
            onClick: () => setOpenCreateDialog(true),
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Global Filters</CardTitle>
          <CardDescription>
            Vertical filter applies to both active vendors and vendor applications tables.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-sm">
          <Select value={verticalFilter} onValueChange={setVerticalFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by vertical" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Verticals</SelectItem>
              {verticalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {(vendorsQuery.error || pendingQuery.error) && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load vendors. Please try again.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vendor Registry</CardTitle>
          <CardDescription>
            Approved, suspended, and rejected vendors. Use this table for operational management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={activeRows}
            isLoading={vendorsQuery.isLoading}
            searchPlaceholder="Search vendors by name or email..."
            searchColumnId="name"
            facetedFilters={facetedFilters}
            enableRowSelection
            enableExport
            enablePrint
            exportFileName="partner-vendor-registry"
            pageSize={20}
            emptyMessage="No vendors found for this filter."
            rowActions={(row) => [
              {
                label: "View details",
                icon: Eye,
                onClick: () => router.push(`/dashboard/partner/vendors/${row.id}`),
              },
              ...(row.status === "APPROVED"
                ? [
                    {
                      label: "Suspend vendor",
                      onClick: async () => {
                        const reason = window.prompt("Suspension reason:");
                        if (!reason) return;
                        await suspendVendor.mutateAsync({ id: row.id, reason });
                      },
                      variant: "destructive" as const,
                    },
                  ]
                : []),
              ...(row.status === "SUSPENDED"
                ? [
                    {
                      label: "Reactivate vendor",
                      onClick: async () => {
                        await reactivateVendor.mutateAsync(row.id);
                      },
                    },
                  ]
                : []),
            ]}
            onRowClick={(row) => router.push(`/dashboard/partner/vendors/${row.id}`)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Vendor Applications</CardTitle>
          <CardDescription>
            Application flow: submit -&gt; PENDING -&gt; approve or reject with reason.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={applicationRows}
            isLoading={pendingQuery.isLoading}
            searchPlaceholder="Search applications by name or email..."
            searchColumnId="name"
            facetedFilters={facetedFilters}
            enableRowSelection
            enableExport
            enablePrint
            exportFileName="partner-vendor-applications"
            pageSize={20}
            emptyMessage="No pending vendor applications."
            rowActions={(row) => [
              {
                label: "View details",
                icon: Eye,
                onClick: () => router.push(`/dashboard/partner/vendors/${row.id}`),
              },
              {
                label: "Approve application",
                onClick: async () => {
                  await approveVendor.mutateAsync(row.id);
                },
              },
              {
                label: "Reject application",
                variant: "destructive" as const,
                onClick: async () => {
                  const reason = window.prompt("Rejection reason:");
                  if (!reason) return;
                  await rejectVendor.mutateAsync({ id: row.id, reason });
                },
              },
            ]}
            onRowClick={(row) => router.push(`/dashboard/partner/vendors/${row.id}`)}
          />
        </CardContent>
      </Card>

      <CreateVendorDialog
        open={openCreateDialog}
        onOpenChange={setOpenCreateDialog}
        verticalOptions={verticalOptions}
      />
    </div>
  );
}
