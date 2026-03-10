// =============================================================================
// Partner Listings Sub-page — Advanced data table with filters, export, print
// =============================================================================

"use client";

import * as React from "react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building, Eye, Pencil, ArchiveRestore, Trash2 } from "lucide-react";
import { showInfo } from "@/lib/errors/toast-helpers";
import { useAdminArchiveListing } from "@/modules/admin/hooks/admin-listings";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import { type ColumnDef } from "@tanstack/react-table";
import type { AdminListing } from "@/modules/admin/types";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PartnerDetailTabs } from "@/modules/partner/components/partner-detail-tabs";
import { PartnerDetailHeader } from "@/modules/partner/components/partner-detail";
import { useAdminListings } from "@/modules/admin/hooks/admin-listings";
import { formatRelativeDate } from "@/modules/listing";
import { usePartnerDetail } from "@/modules/partner/hooks/use-partner-detail";
import { useVerticalContextStore, getVerticalDisplayName } from "@/modules/vertical";
import {
  DataTable,
  DataTableColumnHeader,
  type RowAction,
  type FacetedFilterConfig,
} from "@/components/common/data-table";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListingItem {
  id: string;
  title: string;
  status: string;
  propertyType?: string;
  listingPurpose?: string;
  price?: number;
  currency?: string;
  vendorName?: string;
  postedByType?: string;
  createdAt: string;
  updatedAt: string;
  primaryImage?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_VARIANTS: Record<string, string> = {
  PUBLISHED: "default",
  DRAFT: "outline",
  PENDING_REVIEW: "secondary",
  ARCHIVED: "outline",
  EXPIRED: "outline",
  UNPUBLISHED: "outline",
};

const POSTER_TYPE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  AGENT: "default",
  COMPANY: "secondary",
  VENDOR: "secondary",
  OWNER: "outline",
  SYSTEM: "outline",
};

function toTitleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function getAttrString(attrs: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = attrs[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function normalizeListingPurpose(raw?: string): string | undefined {
  if (!raw) return undefined;
  const normalized = raw.toLowerCase();
  if (normalized === "rent" || normalized === "for_rent" || normalized === "lease") return "RENT";
  if (normalized === "sale" || normalized === "for_sale" || normalized === "sell") return "SALE";
  return raw.toUpperCase();
}

function mapListingToRow(listing: AdminListing): ListingItem {
  const attrs = (listing.attributes ?? {}) as Record<string, unknown>;

  const rawPropertyType =
    getAttrString(attrs, ["propertyType", "property_type", "type", "category"]) ?? undefined;
  const rawListingPurpose =
    getAttrString(attrs, ["listingType", "listing_type", "purpose", "listingPurpose"]) ?? undefined;

  const vendorName = listing.vendor?.name ?? getAttrString(attrs, ["vendorName", "vendor_name"]);

  // Determine poster type from managementType + agent assignment
  const mgmtType = listing.managementType?.toUpperCase();
  const postedByType = listing.agentName
    ? "AGENT"
    : mgmtType === "COMPANY_MANAGED"
      ? "COMPANY"
      : mgmtType === "AGENT_MANAGED"
        ? "AGENT"
        : vendorName
          ? "VENDOR"
          : "SYSTEM";

  return {
    id: listing.id,
    title: listing.title,
    status: listing.status,
    propertyType: rawPropertyType ? toTitleCase(rawPropertyType) : "—",
    listingPurpose: normalizeListingPurpose(rawListingPurpose) ?? "—",
    price: listing.price,
    currency: listing.currency,
    vendorName: vendorName ?? "—",
    postedByType,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    primaryImage: listing.primaryImage,
  };
}

function formatCurrency(value: number, currency = "MYR"): string {
  return `${currency} ${value.toLocaleString("en-MY", { minimumFractionDigits: 0 })}`;
}

// ---------------------------------------------------------------------------
// Column Definitions
// ---------------------------------------------------------------------------

const columns: ColumnDef<ListingItem, unknown>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-0.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      const listing = row.original;
      return (
        <div className="flex items-center gap-3 max-w-75">
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
          <span className="truncate font-medium">{listing.title}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "propertyType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue("propertyType") ?? "—"}</span>
    ),
    filterFn: (row, id, value) =>
      (value as string[]).includes(row.getValue(id) ?? ""),
  },
  {
    accessorKey: "listingPurpose",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="For" />
    ),
    cell: ({ row }) => {
      const purpose = row.getValue("listingPurpose") as string;
      return (
        <Badge variant="outline" className="text-xs">
          {purpose === "RENT" ? "For Rent" : purpose === "SALE" ? "For Sale" : purpose}
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
      return (
        <Badge variant={(STATUS_VARIANTS[status] ?? "outline") as "default"}>
          {status.replace(/_/g, " ")}
        </Badge>
      );
    },
    filterFn: (row, id, value) =>
      (value as string[]).includes(row.getValue(id)),
  },
  {
    accessorKey: "postedByType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Posted By" />
    ),
    cell: ({ row }) => {
      const postedByType = (row.getValue("postedByType") as string) || "SYSTEM";
      return (
        <Badge variant={POSTER_TYPE_VARIANTS[postedByType] ?? "outline"} className="text-xs">
          {toTitleCase(postedByType)}
        </Badge>
      );
    },
    filterFn: (row, id, value) =>
      (value as string[]).includes(row.getValue(id) as string),
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Price" />
    ),
    cell: ({ row }) => {
      const listing = row.original;
      return (
        <span className="text-right font-mono text-sm">
          {listing.price ? formatCurrency(listing.price, listing.currency) : "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "vendorName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vendor" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.getValue("vendorName") ?? "—"}
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
        {formatRelativeDate(row.getValue("updatedAt"))}
      </span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Faceted Filters
// ---------------------------------------------------------------------------

const statusFilterOptions = [
  { label: "Published", value: "PUBLISHED" },
  { label: "Draft", value: "DRAFT" },
  { label: "Pending Review", value: "PENDING_REVIEW" },
  { label: "Archived", value: "ARCHIVED" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Unpublished", value: "UNPUBLISHED" },
];

const propertyTypeFilterOptions = [
  { label: "House", value: "HOUSE" },
  { label: "Apartment", value: "APARTMENT" },
  { label: "Condo", value: "CONDO" },
  { label: "Townhouse", value: "TOWNHOUSE" },
  { label: "Land", value: "LAND" },
  { label: "Commercial", value: "COMMERCIAL" },
  { label: "Shop Lot", value: "SHOP_LOT" },
  { label: "Factory", value: "FACTORY" },
  { label: "Warehouse", value: "WAREHOUSE" },
];

const exportColumns: Record<string, string> = {
  title: "Title",
  propertyType: "Property Type",
  listingPurpose: "For",
  postedByType: "Posted By",
  status: "Status",
  price: "Price",
  currency: "Currency",
  vendorName: "Vendor",
  updatedAt: "Updated At",
};



// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartnerListingsContent() {
  const params = useParams<{ id: string }>();
  const partnerId = params.id;
  const router = useRouter();

  const { data: partner } = usePartnerDetail(partnerId);
  const selectedVertical = useVerticalContextStore((s) => s.selectedVertical);

  // Mutation hooks
  const archiveListing = useAdminArchiveListing();

  // Dialog state
  const [confirmAction, setConfirmAction] = useState<{
    type: "archive";
    listing: ListingItem;
  } | null>(null);

  const { data, isLoading, error } = useAdminListings(
    {
      page: 1,
      pageSize: 100,
      verticalType: selectedVertical ?? undefined,
    },
    { partnerScope: partnerId },
  );

  const listings = React.useMemo(
    () => ((data?.items ?? []) as AdminListing[]).map(mapListingToRow),
    [data?.items],
  );

  const listingPurposeFilterOptions = React.useMemo(() => {
    const values = Array.from(new Set(listings.map((l) => l.listingPurpose).filter(Boolean))) as string[];
    return values.map((value) => ({
      label: value === "RENT" ? "For Rent" : value === "SALE" ? "For Sale" : toTitleCase(value),
      value,
    }));
  }, [listings]);

  const posterTypeFilterOptions = React.useMemo(() => {
    const values = Array.from(new Set(listings.map((l) => l.postedByType).filter(Boolean))) as string[];
    return values.map((value) => ({
      label: toTitleCase(value),
      value,
    }));
  }, [listings]);

  const propertyTypeOptions = React.useMemo(() => {
    const dynamicTypes = Array.from(
      new Set(listings.map((l) => l.propertyType).filter((t) => t && t !== "—")),
    ) as string[];
    if (dynamicTypes.length > 0) {
      return dynamicTypes.map((type) => ({ label: type, value: type }));
    }
    return propertyTypeFilterOptions;
  }, [listings]);

  const facetedFilters = React.useMemo<FacetedFilterConfig[]>(
    () => [
      { columnId: "status", title: "Status", options: statusFilterOptions },
      { columnId: "propertyType", title: "Property Type", options: propertyTypeOptions },
      { columnId: "listingPurpose", title: "For", options: listingPurposeFilterOptions },
      { columnId: "postedByType", title: "Posted By", options: posterTypeFilterOptions },
    ],
    [listingPurposeFilterOptions, posterTypeFilterOptions, propertyTypeOptions],
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
            Partner Listings
            {displayVertical && (
              <Badge variant="secondary" className="ml-2 font-normal">
                {displayVertical}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {selectedVertical
              ? `Showing ${displayVertical} listings for this partner.`
              : "All property listings managed by this partner."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-destructive py-8 text-center">
              Failed to load listings. Please try again.
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={listings}
              isLoading={isLoading}
              enableRowSelection
              searchPlaceholder="Search listings by title..."
              searchColumnId="title"
              facetedFilters={facetedFilters}
              enableExport
              exportFileName={`partner-listings-${partnerId.slice(0, 8)}`}
              exportColumns={exportColumns}
              enablePrint
              pageSize={25}
              emptyMessage="No listings found for this partner."
              rowActions={(listing) => [
                {
                  label: "View listing",
                  icon: Eye,
                  onClick: () => router.push(`/dashboard/platform/partners/${partnerId}/listings/${listing.id}`),
                },
                {
                  label: "Edit listing",
                  icon: Pencil,
                  onClick: () => router.push(`/dashboard/platform/partners/${partnerId}/listings/${listing.id}`),
                },
                { type: "separator" as const },
                {
                  label: "Archive listing",
                  icon: ArchiveRestore,
                  onClick: () => setConfirmAction({ type: "archive", listing }),
                  variant: "destructive" as const,
                  hidden: listing.status === "ARCHIVED",
                },
                {
                  label: "Delete listing",
                  icon: Trash2,
                  onClick: () => showInfo("Listing deletion requires backend endpoint"),
                  variant: "destructive" as const,
                },
              ]}
              onRowClick={(listing) => router.push(`/dashboard/platform/partners/${partnerId}/listings/${listing.id}`)}
            />
          )}
        </CardContent>
      </Card>

      {/* Archive Listing */}
      <ConfirmActionDialog
        open={confirmAction?.type === "archive"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Archive Listing"
        description={`Archive "${confirmAction?.listing.title}"? It will be hidden from search results.`}
        confirmLabel="Archive"
        confirmVariant="destructive"
        requiresReason
        reasonLabel="Archive Reason"
        reasonPlaceholder="Why is this listing being archived?"
        isPending={archiveListing.isPending}
        onConfirm={(reason) =>
          archiveListing.mutate(
            { id: confirmAction!.listing.id, reason },
            { onSuccess: () => setConfirmAction(null) },
          )
        }
      />
    </div>
  );
}
