"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { detectPortal, getPortalNavConfig, type NavItem } from "@/config/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BreadcrumbOverride {
  /** The path segment to override (e.g., "[id]" or "create") */
  segment: string;
  /** The label to display instead of the auto-generated one */
  label: string;
}

export interface AutoBreadcrumbProps {
  /** Override labels for specific path segments */
  overrides?: BreadcrumbOverride[];
  /** Custom className for the breadcrumb container */
  className?: string;
  /** Hide the breadcrumb entirely (e.g., on dashboard root pages) */
  hidden?: boolean;
  /** Maximum number of breadcrumb items to show before collapsing */
  maxItems?: number;
}

// ---------------------------------------------------------------------------
// Segment Label Resolution
// ---------------------------------------------------------------------------

/**
 * Human-readable labels for known URL segments.
 * Covers all portal roots, common entity pages, and settings sub-pages.
 */
const SEGMENT_LABELS: Record<string, string> = {
  // Portal roots
  dashboard: "Dashboard",
  platform: "Platform",
  partner: "Partner",
  vendor: "Vendor",
  account: "Account",

  // Common entity pages
  partners: "Partners",
  vendors: "Vendors",
  listings: "Listings",
  reviews: "Reviews",
  interactions: "Interactions",
  inbox: "Inbox",
  analytics: "Analytics",
  audit: "Audit Logs",
  settings: "Settings",
  profile: "Profile",
  notifications: "Notifications",
  security: "Security",
  saved: "Saved Listings",
  inquiries: "My Inquiries",
  media: "Media",
  search: "Search",
  plans: "Plans & Pricing",
  pricing: "Pricing",
  jobs: "Job Queue",
  experiments: "Experiments",

  // Actions
  create: "Create",
  edit: "Edit",
  onboarding: "Onboarding",

  // Feature flags
  "feature-flags": "Feature Flags",

  // Admin
  "charge-events": "Charge Events",
  configs: "Configs",

  // --- Property Management (PM) ---

  // Tenant portal
  tenant: "Tenant",
  tenancy: "My Tenancy",
  bills: "Bills & Payments",
  maintenance: "Maintenance",
  inspections: "Inspections",
  documents: "Documents",

  // Tenancy sub-pages
  contract: "Contract",
  handover: "Handover",
  inspection: "Inspection",
  history: "History",
  deposits: "Deposits",
  terminate: "Terminate",
  booking: "Booking",

  // Vendor PM routes
  tenancies: "Tenancies",
  billing: "Billing",
  payouts: "Payouts",
  legal: "Legal Cases",
};

/**
 * Resolves a URL segment to a human-readable label.
 *
 * Priority order:
 * 1. Explicit overrides passed via props
 * 2. Match against navigation config (by href suffix)
 * 3. Known segment labels from the static map
 * 4. UUID detection → "Details"
 * 5. Fallback: title-case the segment
 */
function resolveSegmentLabel(
  segment: string,
  fullPath: string,
  overrides: BreadcrumbOverride[],
  navItems: NavItem[],
): string {
  // 1. Check explicit overrides
  const override = overrides.find((o) => o.segment === segment);
  if (override) return override.label;

  // 2. Check nav config for a matching item by href
  const navMatch = navItems.find((item) => {
    if (item.href === fullPath) return true;
    // Also check child items
    return item.items?.some((child) => child.href === fullPath);
  });
  if (navMatch?.href === fullPath) return navMatch.title;
  const childMatch = navMatch?.items?.find((child) => child.href === fullPath);
  if (childMatch) return childMatch.title;

  // 3. Known segment labels
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];

  // 4. UUID detection (common pattern for detail pages)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    return "Details";
  }

  // 5. CUID detection (Prisma default IDs — starts with c, 25 chars)
  if (/^c[a-z0-9]{24,}$/i.test(segment)) {
    return "Details";
  }

  // 6. Numeric ID
  if (/^\d+$/.test(segment)) {
    return "Details";
  }

  // 7. Fallback: Title-case with hyphens → spaces
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Flatten nav items for matching
// ---------------------------------------------------------------------------

function flattenNavItems(items: NavItem[]): NavItem[] {
  const result: NavItem[] = [];
  for (const item of items) {
    result.push(item);
    if (item.items) {
      result.push(...flattenNavItems(item.items));
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Auto-generates breadcrumbs from the current pathname.
 *
 * Features:
 * - Detects current portal and uses portal-specific nav labels
 * - Supports label overrides for dynamic segments (e.g., entity names)
 * - Handles UUID/CUID segments gracefully ("Details")
 * - Skips route groups like `(auth)`, `(public)`, `(guest)`
 * - Respects portal root as the first breadcrumb after Home
 */
export function AutoBreadcrumb({
  overrides = [],
  className,
  hidden = false,
  maxItems,
}: AutoBreadcrumbProps) {
  const pathname = usePathname();

  const crumbs = useMemo(() => {
    if (!pathname || pathname === "/") return [];

    const portal = detectPortal(pathname);
    const portalConfig = portal ? getPortalNavConfig(portal) : null;
    const allNavItems = portalConfig
      ? flattenNavItems(portalConfig.navGroups.flatMap((g) => g.items))
      : [];

    // Split pathname into segments, filter out route groups
    const rawSegments = pathname.split("/").filter(Boolean);
    const segments = rawSegments.filter(
      (seg) => !seg.startsWith("(") || !seg.endsWith(")"),
    );

    // Build breadcrumb items
    const items: { label: string; href: string; isLast: boolean }[] = [];
    let cumulativePath = "";

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      cumulativePath += `/${segment}`;
      const isLast = i === segments.length - 1;

      // Skip "dashboard" segment — portal name serves as root
      if (segment === "dashboard" && i === 0) {
        continue;
      }

      // For portal root (e.g., "platform"), use portal label if available
      if (i === 1 && portalConfig && segment === portal) {
        items.push({
          label: portalConfig.label,
          href: cumulativePath,
          isLast,
        });
        continue;
      }

      const label = resolveSegmentLabel(
        segment,
        cumulativePath,
        overrides,
        allNavItems,
      );

      items.push({ label, href: cumulativePath, isLast });
    }

    return items;
  }, [pathname, overrides]);

  if (hidden || crumbs.length === 0) return null;

  // If maxItems is set and we have more crumbs, truncate the middle
  const displayCrumbs =
    maxItems && crumbs.length > maxItems
      ? [crumbs[0], ...crumbs.slice(-(maxItems - 1))]
      : crumbs;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* Home link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard" aria-label="Home">
              <HomeIcon className="size-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {displayCrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
