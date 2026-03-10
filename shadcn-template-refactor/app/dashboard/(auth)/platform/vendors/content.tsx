"use client";

import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { DataTable, DataTableColumnHeader } from "@/components/common/data-table";
import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { formatRelativeDate } from "@/modules/listing";
import type { Vendor } from "@/modules/vendor/types";

const columns: ColumnDef<Vendor, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor" />,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
  },
  {
    accessorKey: "listingCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Listings" />,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
    cell: ({ row }) => <span className="text-xs">{formatRelativeDate(row.getValue("createdAt"))}</span>,
  },
];

export function PlatformVendorsContent() {
  const router = useRouter();
  const { data, isLoading, error } = useApiPaginatedQuery<Vendor>({
    queryKey: queryKeys.vendors.list("__admin__", { page: 1, pageSize: 100 }),
    path: "/vendors",
    params: { page: 1, limit: 100 },
    format: "A",
  });

  const vendors = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Vendors" description="All vendors across all partners." />
      {error ? (
        <div className="text-destructive py-8 text-center">Failed to load vendors.</div>
      ) : (
        <DataTable
          columns={columns}
          data={vendors}
          isLoading={isLoading}
          searchPlaceholder="Search vendors..."
          searchColumnId="name"
          rowActions={(vendor) => [
            {
              label: "View vendor",
              icon: Eye,
              onClick: () => router.push(`/dashboard/platform/vendors/${vendor.id}`),
            },
          ]}
          onRowClick={(vendor) => router.push(`/dashboard/platform/vendors/${vendor.id}`)}
        />
      )}
    </div>
  );
}
