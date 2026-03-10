// =============================================================================
// PartnerCard — Card component for partner grid/list views
// =============================================================================

"use client";

import Link from "next/link";
import {
  Building,
  Users,
  FileText,
  Clock,
  Globe,
  Mail,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { Partner } from "../types";
import {
  PARTNER_STATUS_CONFIG,
  PARTNER_PLAN_CONFIG,
  formatRelativeDate,
} from "../utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PartnerCardProps {
  partner: Partner & {
    plan?: string;
    vendorCount?: number;
    listingCount?: number;
    activeListingCount?: number;
    adminEmail?: string;
    enabledVerticals?: string[];
  };
  /** Base path for detail link */
  basePath: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartnerCard({ partner, basePath }: PartnerCardProps) {
  const statusConfig = PARTNER_STATUS_CONFIG[partner.status];
  const planConfig = partner.plan
    ? PARTNER_PLAN_CONFIG[partner.plan as keyof typeof PARTNER_PLAN_CONFIG]
    : null;

  return (
    <Link href={`${basePath}/${partner.id}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="p-5">
          {/* Header: name + status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Icon */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-sm group-hover:text-primary transition-colors">
                  {partner.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {partner.slug}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant={statusConfig.variant} className="text-xs">
                {statusConfig.label}
              </Badge>
              {planConfig && (
                <Badge variant={planConfig.variant} className="text-xs">
                  {planConfig.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            {/* Domain */}
            {partner.domain && (
              <span className="flex items-center gap-1 truncate">
                <Globe className="h-3 w-3 shrink-0" />
                {partner.domain}
              </span>
            )}

            {/* Admin email */}
            {partner.adminEmail && !partner.domain && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 shrink-0" />
                {partner.adminEmail}
              </span>
            )}

            {/* Vendors */}
            {partner.vendorCount !== undefined && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 shrink-0" />
                {partner.vendorCount} vendors
              </span>
            )}

            {/* Listings */}
            {partner.listingCount !== undefined && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3 shrink-0" />
                {partner.activeListingCount ?? 0}/{partner.listingCount} listings
              </span>
            )}
          </div>

          {/* Verticals */}
          {partner.enabledVerticals && partner.enabledVerticals.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {partner.enabledVerticals.slice(0, 3).map((v) => (
                <Badge key={v} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {v.replace(/_/g, " ")}
                </Badge>
              ))}
              {partner.enabledVerticals.length > 3 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  +{partner.enabledVerticals.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center justify-end border-t pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeDate(partner.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function PartnerCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="mt-3 flex gap-1">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-full" />
        </div>
        <div className="mt-3 border-t pt-3 flex items-center justify-end">
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
