// =============================================================================
// AdminListingTable — DataTable with Partner, Vendor, Featured, status, actions
// =============================================================================

"use client";

import * as React from "react";
import Link from "next/link";
import { Building, StarIcon } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  DataTableColumnHeader,
  type FacetedFilterConfig,
} from "@/components/common/data-table";

import {
  LISTING_STATUS_CONFIG,
  formatPrice,
  formatRelativeDate,
  type ListingStatus,
} from "@/modules/listing";
import { getVerticalDisplayName } from "@/modules/vertical/utils/display-names";
import type { AdminListing } from "../types";
import { useAdminListings } from "../hooks/admin-listings";
import { AdminListingActions } from "./admin-listing-actions";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AdminListingTableProps {
  /** Show partner column (platform admin only) */
  showPartner?: boolean;
  /** Base path for listing detail links */
  basePath: string;
  /** Injected vertical filter (from vertical context store) */
  verticalType?: string | null;
  /** Optional fixed status filter (e.g. DRAFT for approval queue) */
  status?: ListingStatus | "";
}

// ---------------------------------------------------------------------------
// Faceted filters
// ---------------------------------------------------------------------------

const statusFilters: FacetedFilterConfig[] = [
  {
    columnId: "status",
    title: "Status",
    options: Object.entries(LISTING_STATUS_CONFIG).map(([value, cfg]) => ({
      label: cfg.label,
      value,
    })),
  },
  {
    columnId: "isFeatured",
    title: "Featured",
    options: [
      { label: "Yes", value: "true" },
      { label: "No", value: "false" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminListingTable({
  showPartner = false,
  basePath,
  verticalType,
  status,
}: AdminListingTableProps) {
  const { data, isLoading, error } = useAdminListings({
    page: 1,
    pageSize: 100,
    verticalType: verticalType ?? undefined,
    status,
  });

  const items = React.useMemo(
    () => (data?.items ?? []) as AdminListing[],
    [data?.items],
  );

  const columns = React.useMemo(() => {
    const cols: ColumnDef<AdminListing, unknown>[] = [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Title" />
        ),
        cell: ({ row }) => {
          const listing = row.original;
          return (
            <Link
              href={`${basePath}/${listing.id}`}
              className="flex items-center gap-3 group max-w-75"
            >
              <Avatar className="h-10 w-10 rounded-md shrink-0">
                <AvatarImage
                  src={listing.primaryImage ?? undefined}
                  alt={listing.title}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-md bg-muted">
                  <Building className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium group-hover:underline truncate">
                  {listing.title}
                </p>
                <span className="text-xs text-muted-foreground">
                  {getVerticalDisplayName(listing.verticalType)}
                </span>
              </div>
            </Link>
          );
        },
      },
      ...(showPartner
        ? [
            {
              id: "partner",
              accessorFn: (row: AdminListing) => row.partner?.name ?? "",
              header: ({ column }: { column: unknown }) => (
                <DataTableColumnHeader
                  column={column as never}
                  title="Partner"
                />
              ),
              cell: ({ row }: { row: { original: AdminListing } }) => (
                <span className="text-sm">
                  {row.original.partner?.name ?? "—"}
                </span>
              ),
            } as ColumnDef<AdminListing, unknown>,
          ]
        : []),
      {
        id: "vendor",
        accessorFn: (row) => row.vendor?.name ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Vendor" />
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.vendor?.name ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const cfg = LISTING_STATUS_CONFIG[row.original.status];
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
        accessorKey: "isFeatured",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Featured" />
        ),
        cell: ({ row }) =>
          row.original.isFeatured ? (
            <Badge
              variant="default"
              className="bg-amber-500 text-xs hover:bg-amber-600"
            >
              <StarIcon className="mr-1 h-3 w-3" />
              Featured
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
        filterFn: (row, _id, value: string[]) =>
          value.includes(String(row.original.isFeatured)),
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Price" />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {formatPrice(row.original.price, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Updated" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(row.original.updatedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <AdminListingActions listing={row.original} />,
        enableSorting: false,
        enableHiding: false,
      },
    ];
    return cols;
  }, [showPartner, basePath]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load listings. Please try again.
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        searchPlaceholder="Search listings..."
        searchColumnId="title"
        facetedFilters={statusFilters}
        enableExport
        exportFileName="listings"
        pageSize={20}
        emptyMessage="No listings found."
      />
    </div>
  );
}
