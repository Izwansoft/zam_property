// =============================================================================
// VendorDetail — Composite detail view for a single vendor
// =============================================================================

"use client";

import Link from "next/link";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Star,
  FileText,
  Clock,
  Eye,
  MessageSquare,
  Calendar,
  Shield,
  AlertTriangle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { PageHeader } from "@/components/common/page-header";
import { ViewAuditHistoryLink } from "@/modules/audit";

import type { VendorDetail as VendorDetailType } from "../types";
import {
  VENDOR_STATUS_CONFIG,
  getVendorTypeLabel,
  formatVendorAddress,
  formatRating,
  formatDate,
  formatDateTime,
} from "../utils";
import { VendorApprovalActions } from "./vendor-approval-actions";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VendorDetailViewProps {
  vendor: VendorDetailType;
  /** Portal type */
  portal: "partner" | "platform";
  /** Base path for navigation */
  basePath: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VendorDetailView({
  vendor,
  portal,
  basePath,
}: VendorDetailViewProps) {
  const statusConfig = VENDOR_STATUS_CONFIG[vendor.status];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={vendor.name}
        description={vendor.description}
        status={{ label: statusConfig.label, variant: statusConfig.variant }}
        backHref={basePath}
        actions={[]}
      />

      {/* Contextual audit history link */}
      {(portal === "partner" || portal === "platform") && (
        <div className="flex justify-end">
          <ViewAuditHistoryLink
            targetType="vendor"
            targetId={vendor.id}
            portal={portal === "platform" ? "platform" : "partner"}
          />
        </div>
      )}

      {/* Approval Actions (for pending/approved vendors) */}
      <VendorApprovalActions vendor={vendor} portal={portal} />

      {/* Rejection/Suspension reason */}
      {vendor.status === "REJECTED" && vendor.rejectionReason && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Rejection Reason</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {vendor.rejectionReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {vendor.status === "SUSPENDED" && vendor.suspensionReason && (
        <div className="rounded-lg border border-orange-500/50 bg-orange-50 dark:bg-orange-950/20 p-4">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                Suspension Reason
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {vendor.suspensionReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Info (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Vendor Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Vendor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Name" value={vendor.name} />
              <InfoRow label="Type" value={getVendorTypeLabel(vendor.type)} />
              <InfoRow label="Registration No." value={vendor.registrationNumber ?? "—"} />
              <Separator />
              <InfoRow
                label="Email"
                value={
                  <a
                    href={`mailto:${vendor.email}`}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {vendor.email}
                  </a>
                }
              />
              <InfoRow
                label="Phone"
                value={
                  vendor.phone ? (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {vendor.phone}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <InfoRow
                label="Address"
                value={
                  <span className="flex items-start gap-1">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    {formatVendorAddress(vendor.address)}
                  </span>
                }
              />
            </CardContent>
          </Card>

          {/* Description / Notes card */}
          {vendor.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {vendor.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Listings link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{vendor.activeListingCount}</p>
                  <p className="text-xs text-muted-foreground">
                    Active of {vendor.listingCount} total
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/dashboard/${portal}/listings?vendorId=${vendor.id}`}
                  >
                    View Listings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Stats sidebar (1 col) */}
        <div className="space-y-6">
          {/* Stats card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatItem
                icon={Star}
                label="Rating"
                value={
                  vendor.rating > 0
                    ? `${formatRating(vendor.rating)} (${vendor.reviewCount} reviews)`
                    : "No reviews yet"
                }
              />
              <StatItem
                icon={FileText}
                label="Total Listings"
                value={String(vendor.listingCount)}
              />
              <StatItem
                icon={Eye}
                label="Active Listings"
                value={String(vendor.activeListingCount)}
              />
              {vendor.totalInteractions !== undefined && (
                <StatItem
                  icon={MessageSquare}
                  label="Total Interactions"
                  value={String(vendor.totalInteractions)}
                />
              )}
            </CardContent>
          </Card>

          {/* Timeline card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TimelineItem
                icon={Calendar}
                label="Registered"
                value={formatDate(vendor.createdAt)}
              />
              <TimelineItem
                icon={Clock}
                label="Last Updated"
                value={formatDateTime(vendor.updatedAt)}
              />
              {vendor.lastActivityAt && (
                <TimelineItem
                  icon={Eye}
                  label="Last Activity"
                  value={formatDateTime(vendor.lastActivityAt)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub components
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex items-baseline justify-between gap-2 flex-1 min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium truncate">{value}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function VendorDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-9 w-28" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <div className="flex justify-between flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
