// =============================================================================
// PartnerList — DataTable view with client-side pagination
// =============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  DataTableColumnHeader,
  type RowAction,
  type FacetedFilterConfig,
} from "@/components/common/data-table";

import type { Partner, PartnerPlan } from "../types";
import { PartnerStatus } from "../types";
import { usePartners } from "../hooks/use-partners";
import {
  PARTNER_STATUS_CONFIG,
  PARTNER_PLAN_CONFIG,
  formatRelativeDate,
} from "../utils";

// ---------------------------------------------------------------------------
// Enriched partner type (matches list endpoint response)
// ---------------------------------------------------------------------------

type PartnerItem = Partner & {
  plan?: string;
  userCount?: number;
  vendorCount?: number;
  listingCount?: number;
  activeListingCount?: number;
  adminEmail?: string;
  enabledVerticals?: string[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPartnerInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const columns: ColumnDef<PartnerItem, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Partner" />
    ),
    cell: ({ row }) => {
      const partner = row.original;
      return (
        <div className="flex items-center gap-3 min-w-50">
          <Avatar className="h-9 w-9 rounded-lg shrink-0">
            <AvatarImage src={partner.logo ?? undefined} alt={partner.name} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
              {getPartnerInitials(partner.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{partner.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {partner.slug}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const cfg = PARTNER_STATUS_CONFIG[row.original.status];
      return (
        <Badge variant={cfg.variant} className="text-xs">
          {cfg.label}
        </Badge>
      );
    },
    filterFn: (row, _id, value: string[]) =>
      value.includes(row.original.status),
  },
  {
    accessorKey: "plan",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Plan" />
    ),
    cell: ({ row }) => {
      const plan = row.original.plan;
      const cfg = plan
        ? PARTNER_PLAN_CONFIG[plan as PartnerPlan]
        : null;
      return cfg ? (
        <Badge variant={cfg.variant} className="text-xs">
          {cfg.label}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
    filterFn: (row, _id, value: string[]) => {
      const plan = row.original.plan;
      return plan ? value.includes(plan) : false;
    },
  },
  {
    accessorKey: "domain",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Domain" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground max-w-45 truncate block">
        {row.original.domain ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "userCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Users" />
    ),
    cell: ({ row }) => (
      <span className="text-center text-sm block">
        {row.original.userCount ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "vendorCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vendors" />
    ),
    cell: ({ row }) => (
      <span className="text-center text-sm block">
        {row.original.vendorCount ?? "—"}
      </span>
    ),
  },
  {
    id: "listingCount",
    accessorFn: (row) => row.listingCount,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Listings" />
    ),
    cell: ({ row }) => {
      const p = row.original;
      return (
        <span className="text-center text-sm block">
          {p.listingCount !== undefined
            ? `${p.activeListingCount ?? 0}/${p.listingCount}`
            : "—"}
        </span>
      );
    },
  },
  {
    id: "enabledVerticals",
    accessorFn: (row) => row.enabledVerticals?.join(", ") ?? "",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Marketplace Types" />
    ),
    cell: ({ row }) => {
      const verticals = row.original.enabledVerticals;
      if (!verticals || verticals.length === 0) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      return (
        <div className="flex flex-wrap gap-1 max-w-45">
          {verticals.slice(0, 2).map((v) => (
            <Badge
              key={v}
              variant="outline"
              className="text-[10px] px-1.5 py-0 font-normal"
            >
              {v
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </Badge>
          ))}
          {verticals.length > 2 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 font-normal"
            >
              +{verticals.length - 2}
            </Badge>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatRelativeDate(row.original.createdAt)}
      </span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Faceted filters
// ---------------------------------------------------------------------------

const facetedFilters: FacetedFilterConfig[] = [
  {
    columnId: "status",
    title: "Status",
    options: Object.entries(PARTNER_STATUS_CONFIG).map(([value, cfg]) => ({
      label: cfg.label,
      value,
    })),
  },
  {
    columnId: "plan",
    title: "Plan",
    options: Object.entries(PARTNER_PLAN_CONFIG).map(([value, cfg]) => ({
      label: cfg.label,
      value,
    })),
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PartnerListProps {
  basePath: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartnerList({ basePath }: PartnerListProps) {
  const router = useRouter();
  const { data, isLoading } = usePartners({ page: 1, pageSize: 100 });
  const items = React.useMemo(
    () => (data?.items ?? []) as PartnerItem[],
    [data?.items],
  );

  const rowActions = React.useCallback(
    (partner: PartnerItem): RowAction<PartnerItem>[] => [
      {
        type: "item" as const,
        label: "View Details",
        icon: Eye,
        onClick: () => router.push(`${basePath}/${partner.id}`),
      },
    ],
    [basePath],
  );

  return (
    <DataTable
      columns={columns}
      data={items}
      isLoading={isLoading}
      searchPlaceholder="Search partners..."
      searchColumnId="name"
      facetedFilters={facetedFilters}
      enableExport
      exportFileName="partners"
      pageSize={20}
      emptyMessage="No partners found."
      rowActions={rowActions}
      onRowClick={(partner) => router.push(`${basePath}/${partner.id}`)}
    />
  );
}
