// =============================================================================
// MaintenanceDetail — Composite detail view for a maintenance ticket
// =============================================================================
// Displays: status badge, priority, category, timeline, issue description,
// photo gallery, updates/comments thread, ticket metadata.
// =============================================================================

"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Wrench,
  Droplets,
  Zap,
  Building2,
  HelpCircle,
  MapPin,
  Calendar,
  Hash,
  ImageIcon,
  User,
  Phone,
  DollarSign,
  FileText,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";

import {
  MaintenanceStatus,
  MaintenanceCategory,
  MAINTENANCE_STATUS_CONFIG,
  MAINTENANCE_CATEGORY_CONFIG,
  MAINTENANCE_PRIORITY_CONFIG,
} from "../types";
import type { Maintenance } from "../types";
import { MaintenanceStatusBadge } from "./maintenance-status-badge";
import { MaintenancePriorityBadge } from "./maintenance-priority-badge";
import { MaintenanceTimeline, MaintenanceTimelineSkeleton } from "./maintenance-timeline";
import { MaintenanceComments, MaintenanceCommentsSkeleton } from "./maintenance-comments";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getCategoryLucideIcon(category: MaintenanceCategory): LucideIcon {
  switch (category) {
    case MaintenanceCategory.PLUMBING:
      return Droplets;
    case MaintenanceCategory.ELECTRICAL:
      return Zap;
    case MaintenanceCategory.STRUCTURAL:
      return Building2;
    case MaintenanceCategory.APPLIANCE:
      return Wrench;
    default:
      return HelpCircle;
  }
}

function getCategoryIcon(category: MaintenanceCategory) {
  switch (category) {
    case MaintenanceCategory.PLUMBING:
      return <Droplets className="h-5 w-5" />;
    case MaintenanceCategory.ELECTRICAL:
      return <Zap className="h-5 w-5" />;
    case MaintenanceCategory.STRUCTURAL:
      return <Building2 className="h-5 w-5" />;
    case MaintenanceCategory.APPLIANCE:
      return <Wrench className="h-5 w-5" />;
    default:
      return <HelpCircle className="h-5 w-5" />;
  }
}

/** Check if status is terminal (no more actions) */
function isTerminalStatus(status: MaintenanceStatus): boolean {
  return (
    status === MaintenanceStatus.CLOSED ||
    status === MaintenanceStatus.CANCELLED
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MaintenanceDetailProps {
  ticket: Maintenance;
  currentUserId?: string;
  backPath?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MaintenanceDetail({
  ticket,
  currentUserId,
  backPath = "/dashboard/tenant/maintenance",
}: MaintenanceDetailProps) {
  const categoryConfig = MAINTENANCE_CATEGORY_CONFIG[ticket.category];
  const isClosed = isTerminalStatus(ticket.status);

  // Photo attachments
  const photos = useMemo(
    () => ticket.attachments.filter((a) => a.type === "IMAGE"),
    [ticket.attachments]
  );

  // Document attachments
  const documents = useMemo(
    () => ticket.attachments.filter((a) => a.type === "DOCUMENT"),
    [ticket.attachments]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={ticket.title}
        description={`${ticket.ticketNumber} · ${categoryConfig?.label ?? ticket.category}`}
        icon={getCategoryLucideIcon(ticket.category)}
        backHref={backPath}
        status={{
          label: MAINTENANCE_STATUS_CONFIG[ticket.status]?.label ?? ticket.status,
          variant: "secondary",
        }}
      >
        <div className="flex items-center gap-2 mt-1">
          <MaintenancePriorityBadge priority={ticket.priority} />
          <MaintenanceStatusBadge status={ticket.status} />
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column — Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Issue Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>

              {ticket.location && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{ticket.location}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos */}
          {photos.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="h-4 w-4" />
                  Photos
                  <span className="text-xs font-normal text-muted-foreground">
                    ({photos.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((photo) => (
                    <a
                      key={photo.id}
                      href={photo.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                    >
                      <img
                        src={photo.fileUrl}
                        alt={photo.fileName}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {documents.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{doc.fileName}</span>
                      <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
                        {(doc.fileSize / 1024).toFixed(0)} KB
                      </Badge>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Updates & Comments */}
          <MaintenanceComments
            ticketId={ticket.id}
            updates={ticket.updates || []}
            currentUserId={currentUserId}
            isClosed={isClosed}
          />
        </div>

        {/* Right column — Sidebar */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <MaintenanceTimeline ticket={ticket} />
            </CardContent>
          </Card>

          {/* Ticket Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                icon={<Hash className="h-4 w-4" />}
                label="Ticket #"
                value={ticket.ticketNumber}
              />
              <InfoRow
                icon={getCategoryIcon(ticket.category)}
                label="Category"
                value={categoryConfig?.label ?? ticket.category}
              />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Reported"
                value={formatDateTime(ticket.reportedAt || ticket.createdAt)}
              />
              {ticket.tenancy?.property && (
                <InfoRow
                  icon={<Building2 className="h-4 w-4" />}
                  label="Property"
                  value={ticket.tenancy.property.title}
                />
              )}
              {ticket.location && (
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Location"
                  value={ticket.location}
                />
              )}

              {/* Contractor info */}
              {ticket.contractorName && (
                <>
                  <Separator />
                  <InfoRow
                    icon={<User className="h-4 w-4" />}
                    label="Contractor"
                    value={ticket.contractorName}
                  />
                  {ticket.contractorPhone && (
                    <InfoRow
                      icon={<Phone className="h-4 w-4" />}
                      label="Phone"
                      value={ticket.contractorPhone}
                    />
                  )}
                </>
              )}

              {/* Cost info */}
              {(ticket.estimatedCost != null || ticket.actualCost != null) && (
                <>
                  <Separator />
                  {ticket.estimatedCost != null && (
                    <InfoRow
                      icon={<DollarSign className="h-4 w-4" />}
                      label="Estimated Cost"
                      value={formatCurrency(ticket.estimatedCost)}
                    />
                  )}
                  {ticket.actualCost != null && (
                    <InfoRow
                      icon={<DollarSign className="h-4 w-4" />}
                      label="Actual Cost"
                      value={formatCurrency(ticket.actualCost)}
                    />
                  )}
                </>
              )}

              {/* Resolution */}
              {ticket.resolution && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Resolution</p>
                    <p className="text-sm">{ticket.resolution}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info Row helper
// ---------------------------------------------------------------------------

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm truncate">{value}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function MaintenanceDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-80" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <MaintenanceCommentsSkeleton />
        </div>

        {/* Right */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <MaintenanceTimelineSkeleton />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-4 w-4 shrink-0" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-32" />
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
