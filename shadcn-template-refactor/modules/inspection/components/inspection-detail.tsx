// =============================================================================
// InspectionDetail — Composite detail view for a single inspection
// =============================================================================
// Shows: header, status timeline, property info, video section,
// checklist items, notes, and actions.
// =============================================================================

"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Home,
  Video,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import type { Inspection } from "../types";
import {
  INSPECTION_TYPE_CONFIG,
  INSPECTION_STATUS_CONFIG,
  INSPECTION_CONDITION_CONFIG,
  InspectionStatus,
  InspectionCondition,
  isTerminalInspectionStatus,
  canUploadVideo,
} from "../types";
import { InspectionStatusBadge } from "./inspection-status-badge";
import { VideoInspectionUploader } from "./video-inspection-uploader";
import { VideoPlayer } from "./video-player";
import { useInspectionVideo, useCancelInspection } from "../hooks";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query";
import { usePartnerId } from "@/modules/partner";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InspectionDetailProps {
  inspection: Inspection;
  /** Path for back navigation */
  backPath?: string;
  /** Whether this is the owner/vendor view */
  isOwnerView?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Status Timeline
// ---------------------------------------------------------------------------

const STATUS_TIMELINE: {
  status: InspectionStatus;
  label: string;
}[] = [
  { status: InspectionStatus.SCHEDULED, label: "Scheduled" },
  { status: InspectionStatus.VIDEO_REQUESTED, label: "Video Requested" },
  { status: InspectionStatus.VIDEO_SUBMITTED, label: "Video Submitted" },
  { status: InspectionStatus.ONSITE_PENDING, label: "Onsite Pending" },
  { status: InspectionStatus.COMPLETED, label: "Completed" },
  { status: InspectionStatus.REPORT_GENERATED, label: "Report Generated" },
];

function getStatusIndex(status: InspectionStatus): number {
  return STATUS_TIMELINE.findIndex((s) => s.status === status);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InspectionDetail({
  inspection,
  backPath = "/dashboard/tenant/inspections",
  isOwnerView = false,
}: InspectionDetailProps) {
  const typeConfig = INSPECTION_TYPE_CONFIG[inspection.type];
  const TypeIcon = typeConfig?.icon;
  const currentStatusIndex = getStatusIndex(inspection.status);
  const partnerId = usePartnerId();
  const queryClient = useQueryClient();


  // Video URL (fetch only when video submitted or completed)
  const showVideo =
    inspection.videoUrl ||
    inspection.status === InspectionStatus.VIDEO_SUBMITTED ||
    isTerminalInspectionStatus(inspection.status);

  const {
    data: videoData,
    isLoading: videoLoading,
    error: videoError,
  } = useInspectionVideo(showVideo ? inspection.id : undefined);

  // Cancel mutation
  const cancelMutation = useCancelInspection();

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({ inspectionId: inspection.id });
      showSuccess("Inspection cancelled", {
        description: "The inspection has been cancelled successfully.",
      });
    } catch {
      showError("Failed to cancel", {
        description: "Unable to cancel the inspection. Please try again.",
      });
    }
  };

  const handleVideoUploadComplete = () => {
    // Invalidate to refetch the inspection detail
    queryClient.invalidateQueries({
      queryKey: queryKeys.inspections.detail(
        partnerId ?? "__no_partner__",
        inspection.id
      ),
    });
    showSuccess("Video uploaded", {
      description: "Your video has been submitted for review.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link href={backPath}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inspections
          </Link>
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {TypeIcon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TypeIcon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold">
                {typeConfig?.label ?? inspection.type} Inspection
              </h1>
              <p className="text-sm text-muted-foreground">
                ID: {inspection.id.slice(0, 8)}…
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <InspectionStatusBadge status={inspection.status} />
            {!isTerminalInspectionStatus(inspection.status) &&
              !isOwnerView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  Cancel
                </Button>
              )}
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {STATUS_TIMELINE.map((step, idx) => {
              const isActive = idx <= currentStatusIndex;
              const isCurrent = idx === currentStatusIndex;
              return (
                <div key={step.status} className="flex items-center">
                  {idx > 0 && (
                    <div
                      className={`h-0.5 w-6 sm:w-10 ${
                        isActive
                          ? "bg-primary"
                          : "bg-muted-foreground/20"
                      }`}
                    />
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                        isCurrent
                          ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                          : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isActive ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs whitespace-nowrap ${
                        isCurrent
                          ? "font-medium text-foreground"
                          : isActive
                          ? "text-muted-foreground"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Property & Schedule Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Inspection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Property */}
              {inspection.tenancy?.property && (
                <div className="flex items-start gap-3">
                  <Home className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">
                      {inspection.tenancy.property.title}
                    </p>
                    {inspection.tenancy.property.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {inspection.tenancy.property.address}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Schedule */}
              <div className="grid gap-3 sm:grid-cols-2">
                {inspection.scheduledDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Scheduled:</span>
                    <span className="font-medium">
                      {formatDate(inspection.scheduledDate)}
                    </span>
                  </div>
                )}
                {inspection.scheduledTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">
                      {inspection.scheduledTime}
                    </span>
                  </div>
                )}
              </div>

              {/* Tenant & Owner */}
              <div className="grid gap-3 sm:grid-cols-2">
                {inspection.tenancy?.tenant && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Tenant:</span>
                    <span className="font-medium">
                      {inspection.tenancy.tenant.name}
                    </span>
                  </div>
                )}
                {inspection.tenancy?.owner && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Owner:</span>
                    <span className="font-medium">
                      {inspection.tenancy.owner.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Flags */}
              <div className="flex flex-wrap gap-2">
                {inspection.videoRequested && (
                  <Badge variant="outline" className="gap-1">
                    <Video className="h-3 w-3" />
                    Video Inspection
                  </Badge>
                )}
                {inspection.onsiteRequired && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    Onsite Required
                  </Badge>
                )}
                {inspection.reportUrl && (
                  <Badge variant="outline" className="gap-1">
                    <FileText className="h-3 w-3" />
                    Report Available
                  </Badge>
                )}
              </div>

              {/* Notes */}
              {inspection.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {inspection.notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Video Section — Upload or Player */}
          {canUploadVideo(inspection) && !isOwnerView && (
            <VideoInspectionUploader
              inspection={inspection}
              onUploadComplete={handleVideoUploadComplete}
            />
          )}

          {showVideo && (
            <VideoPlayer
              src={videoData?.url}
              title="Inspection Video"
              isLoading={videoLoading}
              error={videoError}
              showDownload={
                isOwnerView ||
                isTerminalInspectionStatus(inspection.status)
              }
            />
          )}

          {/* Checklist Items */}
          {inspection.checklist && inspection.checklist.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Checklist Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inspection.checklist.map((item) => {
                    const conditionConfig = item.condition
                      ? INSPECTION_CONDITION_CONFIG[
                          item.condition as InspectionCondition
                        ]
                      : null;
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-md border p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {item.category}
                            </Badge>
                            <span className="font-medium text-sm">
                              {item.item}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        {conditionConfig && (
                          <Badge
                            variant={conditionConfig.variant}
                            className={
                              conditionConfig.variant === "default"
                                ? ""
                                : conditionConfig.color
                            }
                          >
                            {conditionConfig.label}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                label="Type"
                value={typeConfig?.label ?? inspection.type}
              />
              <InfoRow
                label="Status"
                value={
                  INSPECTION_STATUS_CONFIG[inspection.status]?.label ??
                  inspection.status
                }
              />
              {inspection.overallRating && (
                <InfoRow
                  label="Rating"
                  value={`${inspection.overallRating}/5`}
                />
              )}
              <InfoRow label="Created" value={formatDateTime(inspection.createdAt)} />
              {inspection.completedAt && (
                <InfoRow
                  label="Completed"
                  value={formatDateTime(inspection.completedAt)}
                />
              )}
            </CardContent>
          </Card>

          {/* Report Download */}
          {inspection.reportUrl && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Inspection Report</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={inspection.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Download Report
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Onsite Inspector */}
          {inspection.onsiteInspector && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Inspector</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{inspection.onsiteInspector}</span>
                </div>
                {inspection.onsiteDate && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Scheduled: {formatDate(inspection.onsiteDate)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info Row
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function InspectionDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-1 h-4 w-24" />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="py-6">
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 py-6">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-6">
              <Skeleton className="aspect-video w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-3 py-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
