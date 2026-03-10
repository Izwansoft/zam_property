// =============================================================================
// Search Module — Utility Functions
// =============================================================================

import type { SearchParams, FacetBucket, RangeBucket, FacetOption } from "../types";

// ---------------------------------------------------------------------------
// Serialize search params to URL query params
// ---------------------------------------------------------------------------

export function serializeSearchParams(
  params: SearchParams,
): Record<string, string> {
  const result: Record<string, string> = {};

  if (params.q) result.q = params.q;
  if (params.verticalType) result.verticalType = params.verticalType;
  if (params.priceMin != null) result.priceMin = params.priceMin.toString();
  if (params.priceMax != null) result.priceMax = params.priceMax.toString();
  if (params.city) result.city = params.city;
  if (params.state) result.state = params.state;
  if (params.lat != null) result.lat = params.lat.toString();
  if (params.lng != null) result.lng = params.lng.toString();
  if (params.radius != null) result.radius = params.radius.toString();
  if (params.sort) result.sort = params.sort;
  if (params.page) result.page = params.page.toString();
  if (params.pageSize) result.pageSize = params.pageSize.toString();
  if (params.highlight) result.highlight = "true";
  if (params.featuredOnly) result.featuredOnly = "true";

  // Top-level shorthand attribute filters
  if (params.listingType) result.listingType = params.listingType;
  if (params.propertyType) result.propertyType = params.propertyType;
  if (params.bedroomsMin != null) result.bedroomsMin = params.bedroomsMin.toString();

  // Serialize attribute filters (skip shorthand keys already sent as top-level params)
  if (params.attributes) {
    const SHORTHAND_KEYS = new Set(["listingType", "propertyType", "bedrooms"]);
    for (const [key, filter] of Object.entries(params.attributes)) {
      if (filter == null) continue;
      // Skip keys already serialized as top-level params
      if (SHORTHAND_KEYS.has(key)) continue;
      if (filter.eq !== undefined) {
        result[`attributes[${key}]`] = String(filter.eq);
      }
      if (filter.in !== undefined) {
        result[`attributes[${key}]`] = filter.in.join(",");
      }
      if (filter.gte !== undefined) {
        result[`attributes[${key}][gte]`] = String(filter.gte);
      }
      if (filter.lte !== undefined) {
        result[`attributes[${key}][lte]`] = String(filter.lte);
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Parse URL search params to SearchParams
// ---------------------------------------------------------------------------

export function parseUrlSearchParams(
  urlParams: URLSearchParams,
  defaults?: Partial<SearchParams>,
): SearchParams {
  // Parse attribute filters from URL (attributes[key]=value or attributes[key][op]=value)
  const attributes: SearchParams["attributes"] = {};
  urlParams.forEach((value, key) => {
    const matchEq = key.match(/^attributes\[([\w]+)\]$/);
    if (matchEq) {
      attributes[matchEq[1]] = { eq: value };
    }
    const matchOp = key.match(/^attributes\[([\w]+)\]\[(gte|lte)\]$/);
    if (matchOp) {
      attributes[matchOp[1]] = {
        ...attributes[matchOp[1]],
        [matchOp[2]]: Number(value),
      };
    }
  });

  // Also read shorthand params (listingType, propertyType, bedroomsMin)
  const listingType = urlParams.get("listingType") || undefined;
  const propertyType = urlParams.get("propertyType") || undefined;
  const bedroomsMin = urlParams.get("bedroomsMin")
    ? Number(urlParams.get("bedroomsMin"))
    : undefined;

  // Merge shorthand into attributes for filter UI
  if (listingType) attributes.listingType = { eq: listingType };
  if (propertyType) attributes.propertyType = { eq: propertyType };
  if (bedroomsMin != null) attributes.bedrooms = { ...attributes.bedrooms, gte: bedroomsMin };

  return {
    q: urlParams.get("q") || defaults?.q || "",
    verticalType: urlParams.get("vertical") || defaults?.verticalType,
    listingType,
    propertyType,
    bedroomsMin,
    priceMin: urlParams.get("priceMin")
      ? Number(urlParams.get("priceMin"))
      : undefined,
    priceMax: urlParams.get("priceMax")
      ? Number(urlParams.get("priceMax"))
      : undefined,
    city: urlParams.get("city") || undefined,
    state: urlParams.get("state") || undefined,
    lat: urlParams.get("lat") ? Number(urlParams.get("lat")) : undefined,
    lng: urlParams.get("lng") ? Number(urlParams.get("lng")) : undefined,
    radius: urlParams.get("radius")
      ? Number(urlParams.get("radius"))
      : undefined,
    sort:
      (urlParams.get("sort") as SearchParams["sort"]) ||
      defaults?.sort ||
      "relevance",
    page: urlParams.get("page") ? Number(urlParams.get("page")) : 1,
    pageSize: defaults?.pageSize || 20,
    highlight: true,
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
  };
}

// ---------------------------------------------------------------------------
// Build URL query string from SearchParams
// ---------------------------------------------------------------------------

export function buildSearchQueryString(params: SearchParams): string {
  const urlParams = new URLSearchParams();

  if (params.q) urlParams.set("q", params.q);
  if (params.verticalType) urlParams.set("vertical", params.verticalType);
  if (params.listingType) urlParams.set("listingType", params.listingType);
  if (params.propertyType) urlParams.set("propertyType", params.propertyType);
  if (params.bedroomsMin != null)
    urlParams.set("bedroomsMin", params.bedroomsMin.toString());
  if (params.priceMin != null)
    urlParams.set("priceMin", params.priceMin.toString());
  if (params.priceMax != null)
    urlParams.set("priceMax", params.priceMax.toString());
  if (params.city) urlParams.set("city", params.city);
  if (params.state) urlParams.set("state", params.state);
  if (params.lat != null) urlParams.set("lat", params.lat.toString());
  if (params.lng != null) urlParams.set("lng", params.lng.toString());
  if (params.radius != null)
    urlParams.set("radius", params.radius.toString());
  if (params.sort && params.sort !== "relevance")
    urlParams.set("sort", params.sort);
  if (params.page && params.page > 1)
    urlParams.set("page", params.page.toString());

  // Serialize attribute filters to URL
  if (params.attributes) {
    for (const [key, filter] of Object.entries(params.attributes)) {
      if (!filter) continue;
      // Skip shorthand keys already serialized above
      if (["listingType", "propertyType"].includes(key) && filter.eq !== undefined) continue;
      if (key === "bedrooms" && filter.gte !== undefined) continue;
      if (filter.eq !== undefined) urlParams.set(`attributes[${key}]`, String(filter.eq));
      if (filter.in !== undefined) urlParams.set(`attributes[${key}]`, filter.in.join(","));
      if (filter.gte !== undefined) urlParams.set(`attributes[${key}][gte]`, String(filter.gte));
      if (filter.lte !== undefined) urlParams.set(`attributes[${key}][lte]`, String(filter.lte));
    }
  }

  return urlParams.toString();
}

// ---------------------------------------------------------------------------
// Facet formatting
// ---------------------------------------------------------------------------

const VERTICAL_TYPE_LABELS: Record<string, string> = {
  REAL_ESTATE: "Real Estate",
  AUTOMOTIVE: "Automotive",
  ELECTRONICS: "Electronics",
  JOBS: "Jobs",
  FASHION: "Fashion",
  FURNITURE: "Furniture",
};

export function formatFacetLabel(value: string): string {
  return (
    VERTICAL_TYPE_LABELS[value] ||
    value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/**
 * Normalize facet input — handles both pre-transformed arrays and
 * raw OpenSearch aggregation objects ({ buckets: [...] }).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeBuckets(input: unknown): any[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (
    typeof input === "object" &&
    input !== null &&
    "buckets" in input &&
    Array.isArray((input as { buckets?: unknown[] }).buckets)
  ) {
    return (input as { buckets: unknown[] }).buckets;
  }
  return [];
}

export function formatFacets(
  buckets?: FacetBucket[] | { buckets?: unknown[] },
  limit?: number,
): FacetOption[] {
  // Handle raw OpenSearch aggregation objects: { buckets: [...] }
  const arr = normalizeBuckets(buckets);
  if (arr.length === 0) return [];

  const mapped: FacetBucket[] = arr.map((b: Record<string, unknown>) => ({
    value: String((b as { value?: unknown }).value ?? (b as { key?: unknown }).key ?? ""),
    count: Number((b as { count?: unknown }).count ?? (b as { doc_count?: unknown }).doc_count ?? 0),
  }));

  const sorted = mapped.sort((a, b) => b.count - a.count);
  const limited = limit ? sorted.slice(0, limit) : sorted;
  return limited.map((b) => ({
    value: b.value,
    label: formatFacetLabel(b.value),
    count: b.count,
  }));
}

export function formatPriceRanges(buckets?: RangeBucket[] | { buckets?: unknown[] }): FacetOption[] {
  const arr = normalizeBuckets(buckets);
  if (arr.length === 0) return [];

  // Map raw OpenSearch range buckets (key/from/to/doc_count) to our shape
  const normalized: RangeBucket[] = arr.map((b: Record<string, unknown>) => ({
    from: (b as { from?: number }).from,
    to: (b as { to?: number }).to,
    count: Number((b as { count?: unknown }).count ?? (b as { doc_count?: unknown }).doc_count ?? 0),
    key: String((b as { key?: unknown }).key ?? ""),
  }));

  return normalized.map((b) => {
    let label: string;
    if (b.from != null && b.to != null) {
      label = `RM ${formatCompactPrice(b.from)} – RM ${formatCompactPrice(b.to)}`;
    } else if (b.from != null) {
      label = `RM ${formatCompactPrice(b.from)}+`;
    } else if (b.to != null) {
      label = `Under RM ${formatCompactPrice(b.to)}`;
    } else {
      label = "All";
    }
    return { value: `${b.from ?? 0}-${b.to ?? ""}`, label, count: b.count };
  });
}

function formatCompactPrice(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString("en-MY");
}

// ---------------------------------------------------------------------------
// Currency formatting
// ---------------------------------------------------------------------------

export function formatCurrency(
  value: number,
  currency: string = "MYR",
): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Active filter counting
// ---------------------------------------------------------------------------

export function countActiveFilters(params: SearchParams): number {
  let count = 0;
  if (params.verticalType) count++;
  if (params.priceMin != null) count++;
  if (params.priceMax != null) count++;
  if (params.city) count++;
  if (params.state) count++;
  if (params.lat != null && params.lng != null) count++;
  if (params.featuredOnly) count++;
  if (params.attributes) {
    count += Object.keys(params.attributes).filter(
      (k) => params.attributes![k] != null,
    ).length;
  }
  return count;
}
