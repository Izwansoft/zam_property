// =============================================================================
// ListingAttributeSummary — Generic attribute display for listing cards/details
// =============================================================================
// Renders listing attributes WITHOUT hardcoding vertical-specific field names.
// Uses schema hints (showInCard, showInDetail) when available, or falls back
// to displaying all primitive attributes generically.
// =============================================================================

"use client";

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  BedDouble,
  Bath,
  Ruler,
  LandPlot,
  Sofa,
  Tag,
  Hash,
  ToggleLeft,
  Calendar,
  type LucideProps,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AttributeDisplayItem {
  key: string;
  label: string;
  value: string;
  icon?: LucideIcon;
  /** Unit to append (e.g. "sqft") */
  unit?: string;
}

interface ListingAttributeSummaryProps {
  /** Raw listing attributes object */
  attributes: Record<string, unknown> | null | undefined;
  /** Display variant: "card" shows compact inline, "detail" shows grid */
  variant: "card" | "detail";
  /** Max attributes to show (for card variant) */
  maxItems?: number;
  /** Optional schema hints for label/icon/order customization */
  schemaHints?: AttributeSchemaHint[];
}

/**
 * Lightweight hint structure that can be provided by the vertical registry
 * to customize how attributes are displayed without breaking the boundary rule.
 */
export interface AttributeSchemaHint {
  key: string;
  label: string;
  icon?: string;
  unit?: string;
  unitPosition?: "prefix" | "suffix";
  showInCard?: boolean;
  showInDetail?: boolean;
  order?: number;
}

// ---------------------------------------------------------------------------
// Icon resolver — maps icon name strings to Lucide icons
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  BedDouble,
  Bath,
  Ruler,
  LandPlot,
  Sofa,
  Tag,
  Hash,
  ToggleLeft,
  Calendar,
};

function resolveIcon(iconName?: string): LucideIcon | undefined {
  if (!iconName) return undefined;
  return ICON_MAP[iconName];
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatAttributeValue(
  value: unknown,
  unit?: string,
  unitPosition?: "prefix" | "suffix",
): string {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    const formatted = value.toLocaleString();
    if (unit) {
      return unitPosition === "prefix" ? `${unit}${formatted}` : `${formatted} ${unit}`;
    }
    return formatted;
  }
  if (Array.isArray(value)) return value.join(", ");

  const str = String(value);
  // Convert snake_case / kebab-case to readable
  return str
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function inferLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// ---------------------------------------------------------------------------
// Core: extract displayable attributes
// ---------------------------------------------------------------------------

function extractAttributes(
  attributes: Record<string, unknown>,
  variant: "card" | "detail",
  schemaHints?: AttributeSchemaHint[],
  maxItems?: number,
): AttributeDisplayItem[] {
  const hintMap = new Map(schemaHints?.map((h) => [h.key, h]));
  const items: AttributeDisplayItem[] = [];

  // If schema hints are provided, use them for ordering and filtering
  if (schemaHints && schemaHints.length > 0) {
    const ordered = [...schemaHints].sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999),
    );

    for (const hint of ordered) {
      const val = attributes[hint.key];
      if (val == null || val === "") continue;

      const showFlag = variant === "card" ? hint.showInCard : hint.showInDetail;
      if (showFlag === false) continue;

      items.push({
        key: hint.key,
        label: hint.label,
        value: formatAttributeValue(val, hint.unit, hint.unitPosition),
        icon: resolveIcon(hint.icon),
        unit: hint.unit,
      });
    }
  } else {
    // Fallback: display all primitive attributes generically
    for (const [key, val] of Object.entries(attributes)) {
      if (val == null || val === "") continue;
      // Skip complex objects (nested objects, but allow arrays)
      if (typeof val === "object" && !Array.isArray(val)) continue;

      items.push({
        key,
        label: inferLabel(key),
        value: formatAttributeValue(val),
      });
    }
  }

  return maxItems ? items.slice(0, maxItems) : items;
}

// ---------------------------------------------------------------------------
// Card variant — compact inline display
// ---------------------------------------------------------------------------

function CardSummary({
  items,
}: {
  items: AttributeDisplayItem[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
      {items.map((item) => (
        <span key={item.key}>{item.value}</span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail variant — grid with icons
// ---------------------------------------------------------------------------

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
}) {
  const FallbackIcon = Tag;
  const DisplayIcon = Icon || FallbackIcon;

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <DisplayIcon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function DetailSummary({
  items,
}: {
  items: AttributeDisplayItem[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <DetailItem
          key={item.key}
          icon={item.icon}
          label={item.label}
          value={item.value}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ListingAttributeSummary({
  attributes,
  variant,
  maxItems,
  schemaHints,
}: ListingAttributeSummaryProps) {
  if (!attributes) return null;

  const items = extractAttributes(
    attributes as Record<string, unknown>,
    variant,
    schemaHints,
    maxItems,
  );

  if (variant === "card") {
    return <CardSummary items={items} />;
  }

  return <DetailSummary items={items} />;
}
