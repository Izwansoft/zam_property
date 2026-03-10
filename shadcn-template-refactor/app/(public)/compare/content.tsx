// =============================================================================
// Property Comparison — Client Content
// =============================================================================
// Side-by-side comparison of up to 4 properties.
// Uses the comparison Zustand store (localStorage-backed).
// =============================================================================

"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Scale,
  Trash2,
  Search,
  ExternalLink,
  MapPin,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import {
  useComparisonStore,
  MAX_COMPARISON_ITEMS,
  type ComparisonItem,
} from "@/modules/search/store/comparison-store";
import { formatCurrency } from "@/modules/search";

// ---------------------------------------------------------------------------
// Attribute rows for comparison
// ---------------------------------------------------------------------------

interface ComparisonRow {
  label: string;
  key: string;
  format?: (value: unknown) => string;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { label: "Price", key: "_price" },
  { label: "Type", key: "_verticalType" },
  { label: "Location", key: "_location" },
  { label: "Property Type", key: "propertyType", format: formatAttributeValue },
  { label: "Listing Type", key: "listingType", format: formatAttributeValue },
  { label: "Bedrooms", key: "bedrooms", format: formatNumericValue },
  { label: "Bathrooms", key: "bathrooms", format: formatNumericValue },
  { label: "Floor Area", key: "floorArea", format: formatAreaValue },
  { label: "Land Area", key: "landArea", format: formatAreaValue },
  { label: "Furnishing", key: "furnishing", format: formatAttributeValue },
  { label: "Title Type", key: "titleType", format: formatAttributeValue },
  { label: "Tenure", key: "tenure", format: formatAttributeValue },
  { label: "Occupancy", key: "occupancy", format: formatAttributeValue },
  {
    label: "Maintenance Fee",
    key: "maintenanceFee",
    format: (v) => (v ? `RM ${Number(v).toLocaleString()}/mo` : "—"),
  },
  { label: "Year Built", key: "yearBuilt", format: formatNumericValue },
  { label: "Floors", key: "floors", format: formatNumericValue },
  { label: "Parking", key: "parking", format: formatNumericValue },
  { label: "Project", key: "projectName", format: formatAttributeValue },
  { label: "Developer", key: "developerName", format: formatAttributeValue },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ComparisonContent() {
  const router = useRouter();
  const { items, removeItem, clearAll } = useComparisonStore();

  // ── Empty state ───────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-3xl border border-border/50 bg-card p-10 text-center shadow-sm">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-purple-500 to-pink-500 shadow-lg">
            <Scale className="h-8 w-8 text-white" />
          </div>
          <h2 className="mb-2 text-xl font-bold">No properties to compare</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Add properties to your comparison list from search results or listing
            pages, then come back here to compare them side by side.
          </p>
          <Button className="rounded-full" onClick={() => router.push("/search")}>
            <Search className="mr-2 h-4 w-4" />
            Browse Listings
          </Button>
        </div>
      </div>
    );
  }

  // ── Minimum items check ───────────────────────────────────────
  if (items.length < 2) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-3xl border border-border/50 bg-card p-10 text-center shadow-sm">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-amber-500 to-orange-500 shadow-lg">
            <Scale className="h-7 w-7 text-white" />
          </div>
          <h2 className="mb-2 text-xl font-bold">
            Add at least 2 properties
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            You currently have {items.length} property selected. Add at least one
            more to start comparing.
          </p>
          <Button className="rounded-full" onClick={() => router.push("/search")}>
            <Search className="mr-2 h-4 w-4" />
            Add More Listings
          </Button>
        </div>
      </div>
    );
  }

  // ── Comparison table ──────────────────────────────────────────
  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
        <div>
          <p className="text-sm font-medium">
            Comparing{" "}
            <span className="font-bold">{items.length}</span> of{" "}
            {MAX_COMPARISON_ITEMS} properties
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={clearAll}>
            Clear All
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => router.push("/search")}>
            <Search className="mr-1.5 h-4 w-4" />
            Add More
          </Button>
        </div>
      </div>

      {/* Mobile: Cards layout */}
      <div className="block lg:hidden">
        <MobileComparisonCards items={items} onRemove={removeItem} />
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden lg:block">
        <DesktopComparisonTable items={items} onRemove={removeItem} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop Table
// ---------------------------------------------------------------------------

function DesktopComparisonTable({
  items,
  onRemove,
}: {
  items: ComparisonItem[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/50 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b bg-muted/30">
            <TableHead className="w-45 font-semibold">Property</TableHead>
            {items.map((item) => (
              <TableHead key={item.id} className="min-w-50">
                <div className="space-y-2">
                  {/* Image */}
                  <Link
                    href={`/listing/${item.slug || item.id}`}
                    className="block"
                  >
                    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
                      {item.primaryImageUrl ? (
                        <Image
                          src={item.primaryImageUrl}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Link>
                  {/* Title + actions */}
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/listing/${item.slug || item.id}`}
                      className="line-clamp-2 text-sm font-medium hover:text-primary"
                    >
                      {item.title}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground"
                      onClick={() => onRemove(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {COMPARISON_ROWS.map((row) => (
            <TableRow key={row.key} className="even:bg-muted/20">
              <TableCell className="font-medium text-muted-foreground">
                {row.label}
              </TableCell>
              {items.map((item) => (
                <TableCell key={item.id}>
                  {getCellValue(item, row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile Cards
// ---------------------------------------------------------------------------

function MobileComparisonCards({
  items,
  onRemove,
}: {
  items: ComparisonItem[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {COMPARISON_ROWS.map((row) => (
        <div key={row.key}>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            {row.label}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-3">
                  <p className="mb-1 truncate text-xs text-muted-foreground">
                    {item.title}
                  </p>
                  <p className="text-sm font-medium">
                    {getCellValue(item, row)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Item headers with remove */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        {items.map((item) => (
          <Card key={item.id} className="relative">
            <CardContent className="p-3">
              <Link
                href={`/listing/${item.slug || item.id}`}
                className="flex items-center gap-2"
              >
                {item.primaryImageUrl && (
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
                    <Image
                      src={item.primaryImageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{item.title}</p>
                  <ExternalLink className="mt-0.5 h-3 w-3 text-primary" />
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6"
                onClick={() => onRemove(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Value Resolution
// ---------------------------------------------------------------------------

function getCellValue(item: ComparisonItem, row: ComparisonRow): string {
  // Special computed keys
  switch (row.key) {
    case "_price":
      return formatCurrency(item.price, item.currency);
    case "_verticalType":
      return item.verticalType.replace(/_/g, " ");
    case "_location":
      return [item.location.city, item.location.state]
        .filter(Boolean)
        .join(", ") || "—";
    default: {
      const val = item.attributes[row.key];
      if (val == null || val === "") return "—";
      if (row.format) return row.format(val);
      return String(val);
    }
  }
}

function formatAttributeValue(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatNumericValue(value: unknown): string {
  if (value == null || value === "") return "—";
  const num = Number(value);
  return isNaN(num) ? String(value) : num.toLocaleString();
}

function formatAreaValue(value: unknown): string {
  if (value == null || value === "") return "—";
  const num = Number(value);
  return isNaN(num) ? String(value) : `${num.toLocaleString()} sq ft`;
}
