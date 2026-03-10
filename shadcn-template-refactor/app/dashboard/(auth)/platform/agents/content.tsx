"use client";

import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { DataTable, DataTableColumnHeader } from "@/components/common/data-table";
import { useApiPaginatedQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { formatRelativeDate } from "@/modules/listing";
import type { Agent } from "@/modules/agent/types";

const columns: ColumnDef<Agent, unknown>[] = [
  {
    id: "name",
    accessorFn: (row) => row.user?.fullName ?? "-",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Agent" />,
  },
  {
    accessorKey: "renNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="REN" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
  },
  {
    accessorKey: "totalListings",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Listings" />,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Registered" />,
    cell: ({ row }) => <span className="text-xs">{formatRelativeDate(row.getValue("createdAt"))}</span>,
  },
];

export function PlatformAgentsContent() {
  const router = useRouter();
  const { data, isLoading, error } = useApiPaginatedQuery<Agent>({
    queryKey: queryKeys.agents.list("__admin__", { page: 1, pageSize: 100 }),
    path: "/agents",
    params: { page: 1, limit: 100 },
    format: "A",
  });

  const agents = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Agents" description="All agents across all partners." />
      {error ? (
        <div className="text-destructive py-8 text-center">Failed to load agents.</div>
      ) : (
        <DataTable
          columns={columns}
          data={agents}
          isLoading={isLoading}
          searchPlaceholder="Search agents..."
          searchColumnId="name"
          rowActions={(agent) => [
            {
              label: "View agent",
              icon: Eye,
              onClick: () => router.push(`/dashboard/platform/agents/${agent.id}`),
            },
          ]}
          onRowClick={(agent) => router.push(`/dashboard/platform/agents/${agent.id}`)}
        />
      )}
    </div>
  );
}
