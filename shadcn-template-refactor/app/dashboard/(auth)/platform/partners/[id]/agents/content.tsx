// =============================================================================
// Partner Agents Sub-page — DataTable with filters, export, print
// =============================================================================
// Shows agents scoped to this partner.
// Backend: GET /api/v1/agents (scoped via X-Partner-ID header)
// =============================================================================

"use client";

import * as React from "react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, Pencil, Ban, UserCheck } from "lucide-react";
import { showInfo } from "@/lib/errors/toast-helpers";
import { useSuspendAgent, useReactivateAgent } from "@/modules/agent/hooks/useAgents";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import { EditAgentDialog } from "@/modules/agent/components/edit-agent-dialog";
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
import type { Agent, AgentStatus } from "@/modules/agent/types";
import { AGENT_STATUS_CONFIG } from "@/modules/agent/types";
import { cn, getAvatarFallbackClass, getInitials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Hook: admin-scoped agent list for a partner
// ---------------------------------------------------------------------------

function usePartnerAgents(partnerScope?: string, verticalType?: string | null) {
  const params: Record<string, unknown> = { page: 1, limit: 100 };
  if (verticalType) params.verticalType = verticalType;

  return useApiPaginatedQuery<Agent>({
    queryKey: queryKeys.agents.list(partnerScope ?? "__partner_scope_pending__", { page: 1, limit: 100, verticalType: verticalType ?? undefined }),
    path: "/agents",
    params,
    partnerScope,
    format: "A",
    enabled: !!partnerScope,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Column Definitions
// ---------------------------------------------------------------------------

const columns: ColumnDef<Agent, unknown>[] = [
  {
    id: "agentName",
    accessorFn: (row) => row.user?.fullName ?? "—",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Agent" />
    ),
    cell: ({ row }) => {
      const agent = row.original;
      const name = agent.user?.fullName ?? "Unknown";
      const email = agent.user?.email ?? "";
      return (
        <div className="flex items-center gap-3 max-w-72">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className={cn("text-xs font-semibold", getAvatarFallbackClass(name))}>
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </div>
      );
    },
    filterFn: (row, _id, value) =>
      (row.original.user?.fullName ?? "")
        .toLowerCase()
        .includes(String(value).toLowerCase()),
  },
  {
    accessorKey: "renNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="REN #" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.getValue("renNumber") ?? "—"}
      </span>
    ),
  },
  {
    id: "company",
    accessorFn: (row) => row.company?.name ?? "Independent",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
    cell: ({ row }) => {
      const companyName = row.getValue("company") as string;
      return companyName === "Independent" ? (
        <Badge variant="outline" className="text-xs">
          Independent
        </Badge>
      ) : (
        <span className="text-sm">{companyName}</span>
      );
    },
    filterFn: (row, _id, value) => {
      const companyName = row.original.company?.name ?? "Independent";
      return (value as string[]).includes(
        row.original.companyId ? "company" : "independent",
      );
    },
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
      const status = row.getValue("status") as AgentStatus;
      const config = AGENT_STATUS_CONFIG[status];
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
    accessorKey: "totalListings",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Listings" />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {row.getValue("totalListings")}
      </span>
    ),
  },
  {
    accessorKey: "totalDeals",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Deals" />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {row.getValue("totalDeals")}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Registered" />
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
    options: Object.entries(AGENT_STATUS_CONFIG).map(([value, cfg]) => ({
      label: cfg.label,
      value,
    })),
  },
  {
    columnId: "company",
    title: "Affiliation",
    options: [
      { label: "Company Agent", value: "company" },
      { label: "Independent", value: "independent" },
    ],
  },
];

const exportColumns: Record<string, string> = {
  agentName: "Agent Name",
  renNumber: "REN #",
  company: "Company",
  status: "Status",
  totalListings: "Listings",
  totalDeals: "Deals",
  createdAt: "Registered",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartnerAgentsContent() {
  const params = useParams<{ id: string }>();
  const partnerId = params.id;
  const router = useRouter();

  const { data: partner } = usePartnerDetail(partnerId);
  const selectedVertical = useVerticalContextStore((s) => s.selectedVertical);
  const partnerScope = partner?.slug;
  const { data, isLoading, error } = usePartnerAgents(partnerScope, selectedVertical);

  // Mutation hooks
  const suspendAgent = useSuspendAgent();
  const reactivateAgent = useReactivateAgent();

  // Dialog state
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "suspend" | "reactivate";
    agent: Agent;
  } | null>(null);

  const agents = React.useMemo(
    () => (data?.items ?? []) as Agent[],
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
            Partner Agents
            {displayVertical && (
              <Badge variant="secondary" className="ml-2 font-normal">
                {displayVertical}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {selectedVertical
              ? `Showing ${displayVertical} agents for this partner.`
              : "All agents registered under this partner."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-destructive py-8 text-center">
              Failed to load agents. Please try again.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={agents}
              isLoading={isLoading}
              enableRowSelection
              searchPlaceholder="Search agents by name..."
              searchColumnId="agentName"
              facetedFilters={facetedFilters}
              enableExport
              exportFileName={`partner-agents-${partnerId.slice(0, 8)}`}
              exportColumns={exportColumns}
              enablePrint
              pageSize={25}
              emptyMessage="No agents found for this partner."
              rowActions={(agent) => [
                {
                  label: "View agent",
                  icon: Eye,
                  onClick: () => router.push(`/dashboard/platform/partners/${partnerId}/agents/${agent.id}`),
                },
                {
                  label: "Edit agent",
                  icon: Pencil,
                  onClick: () => setEditAgent(agent),
                },
                { type: "separator" as const },
                {
                  label: "Activate",
                  icon: UserCheck,
                  onClick: () => setConfirmAction({ type: "reactivate", agent }),
                  hidden: agent.status !== "INACTIVE" && agent.status !== "SUSPENDED",
                },
                {
                  label: "Suspend",
                  icon: Ban,
                  onClick: () => setConfirmAction({ type: "suspend", agent }),
                  variant: "destructive" as const,
                  hidden: agent.status === "SUSPENDED",
                },
              ]}
              onRowClick={(agent) => router.push(`/dashboard/platform/partners/${partnerId}/agents/${agent.id}`)}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Agent Dialog */}
      {editAgent && (
        <EditAgentDialog
          agent={editAgent}
          open={!!editAgent}
          onOpenChange={(open) => !open && setEditAgent(null)}
        />
      )}

      {/* Activate / Reactivate Agent */}
      <ConfirmActionDialog
        open={confirmAction?.type === "reactivate"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Activate Agent"
        description={`Activate "${confirmAction?.agent.user?.fullName ?? "this agent"}"? They will be able to manage listings.`}
        confirmLabel="Activate"
        isPending={reactivateAgent.isPending}
        onConfirm={() =>
          reactivateAgent.mutate(confirmAction!.agent.id, {
            onSuccess: () => setConfirmAction(null),
          })
        }
      />

      {/* Suspend Agent */}
      <ConfirmActionDialog
        open={confirmAction?.type === "suspend"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Suspend Agent"
        description={`Suspend "${confirmAction?.agent.user?.fullName ?? "this agent"}"? Their access will be revoked.`}
        confirmLabel="Suspend"
        confirmVariant="destructive"
        isPending={suspendAgent.isPending}
        onConfirm={() =>
          suspendAgent.mutate(confirmAction!.agent.id, {
            onSuccess: () => setConfirmAction(null),
          })
        }
      />
    </div>
  );
}
