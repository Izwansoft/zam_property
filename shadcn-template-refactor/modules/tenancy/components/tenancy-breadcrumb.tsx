// =============================================================================
// TenancyBreadcrumb — Shared breadcrumb helper for tenancy detail pages
// =============================================================================
// Resolves a tenancy ID to a human-readable property title for breadcrumbs.
// Wraps children with a PageHeader that has the correct breadcrumbOverrides.
// Can also be used standalone to just get the override array.
// =============================================================================

"use client";

import type { BreadcrumbOverride } from "@/components/common/auto-breadcrumb";
import { useTenancy } from "../hooks/useTenancy";

/**
 * Hook that returns breadcrumb overrides for a tenancy detail page.
 *
 * Resolves the tenancy ID segment to the property title so breadcrumbs
 * show "My Tenancy > 123 Jalan Ampang" instead of "My Tenancy > clxyz...".
 *
 * @example
 * ```tsx
 * const overrides = useTenancyBreadcrumbOverrides(params.id);
 * return <PageHeader title="Tenancy" breadcrumbOverrides={overrides} />;
 * ```
 */
export function useTenancyBreadcrumbOverrides(
  tenancyId: string
): BreadcrumbOverride[] {
  const { data: tenancy } = useTenancy(tenancyId);

  if (!tenancy) {
    return [];
  }

  const label =
    tenancy.property?.title ??
    tenancy.unit?.unitNumber ??
    tenancyId.slice(0, 8);

  return [{ segment: tenancyId, label }];
}
