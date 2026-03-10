// =============================================================================
// EntitlementsDisplay — Shows feature access grouped by domain
// =============================================================================
// Renders resolved entitlements as a readable card with domain groupings.
// Part-12: "Group entitlements by domain, display enabled/disabled + quotas."
// =============================================================================

"use client";

import {
  Building2,
  MessageSquare,
  ImageIcon,
  BarChart3,
  Globe,
  Zap,
  Check,
  X,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { ResolvedEntitlements } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EntitlementsDisplayProps {
  entitlements?: ResolvedEntitlements | null;
  isLoading?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface EntitlementGroup {
  icon: React.ElementType;
  label: string;
  items: { key: string; label: string; value: string | number | boolean }[];
}

function buildGroups(entitlements: ResolvedEntitlements): EntitlementGroup[] {
  const groups: EntitlementGroup[] = [];

  // Listings
  if (entitlements.listings) {
    const items: EntitlementGroup["items"] = [
      {
        key: "listings-limit",
        label: "Max Active Listings",
        value: entitlements.listings.limit,
      },
    ];
    if (entitlements.listings.verticals) {
      for (const [vertical, limit] of Object.entries(entitlements.listings.verticals)) {
        items.push({
          key: `listings-${vertical}`,
          label: `${vertical.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} Listings`,
          value: limit,
        });
      }
    }
    groups.push({ icon: Building2, label: "Listings", items });
  }

  // Interactions
  if (entitlements.interactions) {
    groups.push({
      icon: MessageSquare,
      label: "Interactions",
      items: [
        {
          key: "interactions-limit",
          label: "Monthly Interactions",
          value: entitlements.interactions.limit,
        },
      ],
    });
  }

  // Media & Storage
  if (entitlements.media) {
    groups.push({
      icon: ImageIcon,
      label: "Media & Storage",
      items: [
        {
          key: "media-upload",
          label: "Max Upload Size",
          value: `${entitlements.media.uploadSizeLimit} MB`,
        },
        {
          key: "media-storage",
          label: "Storage Limit",
          value: `${entitlements.media.storageSizeLimit} GB`,
        },
      ],
    });
  }

  // Features
  if (entitlements.features && entitlements.features.length > 0) {
    const featureLabels: Record<string, string> = {
      analytics: "Analytics Dashboard",
      priority_support: "Priority Support",
      advanced_search: "Advanced Search",
      api_access: "API Access",
      bulk_operations: "Bulk Operations",
      custom_branding: "Custom Branding",
    };

    groups.push({
      icon: Zap,
      label: "Features",
      items: entitlements.features.map((f) => ({
        key: `feature-${f}`,
        label: featureLabels[f] ?? f.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value: true,
      })),
    });
  }

  // Verticals
  if (entitlements.verticals && entitlements.verticals.length > 0) {
    groups.push({
      icon: Globe,
      label: "Verticals",
      items: entitlements.verticals.map((v) => ({
        key: `vertical-${v}`,
        label: v.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value: true,
      })),
    });
  }

  // API
  if (entitlements.api) {
    groups.push({
      icon: BarChart3,
      label: "API",
      items: [
        {
          key: "api-rate",
          label: "Rate Limit",
          value: `${entitlements.api.requestsPerMinute} req/min`,
        },
      ],
    });
  }

  return groups;
}

function renderValue(value: string | number | boolean): React.ReactNode {
  if (typeof value === "boolean") {
    return value ? (
      <Badge variant="default" className="gap-1 text-[10px]">
        <Check className="h-3 w-3" /> Enabled
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1 text-[10px]">
        <X className="h-3 w-3" /> Not included
      </Badge>
    );
  }
  if (typeof value === "number") {
    return (
      <span className="text-sm font-medium tabular-nums">
        {value.toLocaleString()}
      </span>
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function EntitlementsDisplaySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-1 h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EntitlementsDisplay({
  entitlements,
  isLoading,
  className,
}: EntitlementsDisplayProps) {
  if (isLoading) {
    return <EntitlementsDisplaySkeleton />;
  }

  if (!entitlements) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">What&apos;s Included</CardTitle>
          <CardDescription>
            No entitlement information available.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const groups = buildGroups(entitlements);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">What&apos;s Included</CardTitle>
        <CardDescription>
          Features and limits included in your current plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.map((group, groupIndex) => (
          <div key={group.label}>
            {groupIndex > 0 && <Separator className="mb-4" />}
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <group.icon className="h-4 w-4" />
              {group.label}
            </div>
            <div className="space-y-2 pl-6">
              {group.items.map((item) => (
                <div
                  key={item.key}
                  className={cn(
                    "flex items-center justify-between rounded-sm px-2 py-1",
                    "hover:bg-muted/50"
                  )}
                >
                  <span className="text-sm">{item.label}</span>
                  {renderValue(item.value)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export { EntitlementsDisplaySkeleton };
