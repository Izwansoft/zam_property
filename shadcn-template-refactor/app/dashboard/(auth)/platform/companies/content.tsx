"use client";

import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { DataTable, DataTableColumnHeader } from "@/components/common/data-table";
import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { formatRelativeDate } from "@/modules/listing";
import type { Company } from "@/modules/company/types";

const columns: ColumnDef<Company, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
  },
  {
    accessorKey: "registrationNo",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Registration" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Registered" />,
    cell: ({ row }) => <span className="text-xs">{formatRelativeDate(row.getValue("createdAt"))}</span>,
  },
];

export function PlatformCompaniesContent() {
  const router = useRouter();
  const { data, isLoading, error } = useApiPaginatedQuery<Company>({
    queryKey: queryKeys.companies.list("__admin__", { page: 1, pageSize: 100 }),
    path: "/companies",
    params: { page: 1, limit: 100 },
    format: "A",
  });

  const companies = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Companies" description="All companies across all partners." />
      {error ? (
        <div className="text-destructive py-8 text-center">Failed to load companies.</div>
      ) : (
        <DataTable
          columns={columns}
          data={companies}
          isLoading={isLoading}
          searchPlaceholder="Search companies..."
          searchColumnId="name"
          rowActions={(company) => [
            {
              label: "View company",
              icon: Eye,
              onClick: () => router.push(`/dashboard/platform/companies/${company.id}`),
            },
          ]}
          onRowClick={(company) => router.push(`/dashboard/platform/companies/${company.id}`)}
        />
      )}
    </div>
  );
}
