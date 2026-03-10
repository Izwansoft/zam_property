// =============================================================================
// ClaimDetail — Composite detail view for a single claim
// =============================================================================
// Shows: header, status timeline, claim info, amounts, evidence, dispute.
// =============================================================================

"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Home,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Scale,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import type { Claim, ClaimEvidence } from "../types";
import {
  CLAIM_TYPE_CONFIG,
  CLAIM_STATUS_CONFIG,
  ClaimStatus,
  SETTLEMENT_METHOD_LABELS,
  formatClaimAmount,
  canDisputeClaim,
} from "../types";
import { ClaimStatusBadge } from "./claim-status-badge";
import { ClaimEvidenceUploader } from "./claim-evidence-uploader";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ClaimDetailProps {
  claim: Claim;
  /** Path for back navigation */
  backPath?: string;
  /** Whether this is the owner/vendor view */
  isOwnerView?: boolean;
  /** Callback to refresh data */
  onRefresh?: () => void;
  /** Slot for dispute action (tenant view) */
  disputeSlot?: React.ReactNode;
  /** Slot for review panel (owner view) */
  reviewSlot?: React.ReactNode;
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
  status: ClaimStatus;
  label: string;
}[] = [
  { status: ClaimStatus.SUBMITTED, label: "Submitted" },
  { status: ClaimStatus.UNDER_REVIEW, label: "Under Review" },
  { status: ClaimStatus.APPROVED, label: "Decision" },
  { status: ClaimStatus.SETTLED, label: "Settled" },
];

function getStatusIndex(status: ClaimStatus): number {
  if (status === ClaimStatus.PARTIALLY_APPROVED || status === ClaimStatus.REJECTED) {
    return 2; // Same slot as APPROVED (decision)
  }
  if (status === ClaimStatus.DISPUTED) {
    return 1; // Back to review
  }
  return STATUS_TIMELINE.findIndex((s) => s.status === status);
}

function getDecisionLabel(status: ClaimStatus): string {
  switch (status) {
    case ClaimStatus.APPROVED:
      return "Approved";
    case ClaimStatus.PARTIALLY_APPROVED:
      return "Partially Approved";
    case ClaimStatus.REJECTED:
      return "Rejected";
    default:
      return "Decision";
  }
}

// ---------------------------------------------------------------------------
// Evidence Gallery
// ---------------------------------------------------------------------------

function EvidenceGallery({ evidence }: { evidence: ClaimEvidence[] }) {
  if (!evidence.length) return null;

  const photos = evidence.filter((e) => e.type === "PHOTO");
  const documents = evidence.filter((e) => e.type !== "PHOTO");

  return (
    <div className="space-y-3">
      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((ev) => (
            <a
              key={ev.id}
              href={ev.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ev.fileUrl}
                alt={ev.description || ev.fileName}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              {ev.description && (
                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5">
                  <p className="text-[10px] text-white truncate">
                    {ev.description}
                  </p>
                </div>
              )}
            </a>
          ))}
        </div>
      )}

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="space-y-1">
          {documents.map((ev) => (
            <a
              key={ev.id}
              href={ev.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/50"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 truncate">{ev.fileName}</span>
              <Badge variant="outline" className="text-[10px]">
                {ev.type}
              </Badge>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClaimDetail({
  claim,
  backPath = "/dashboard/tenant/claims",
  isOwnerView = false,
  onRefresh,
  disputeSlot,
  reviewSlot,
}: ClaimDetailProps) {
  const typeConfig = CLAIM_TYPE_CONFIG[claim.type];
  const TypeIcon = typeConfig?.icon;
  const currentStatusIndex = getStatusIndex(claim.status);

  // Determine if claim can receive evidence uploads
  const canUploadEvidence = [
    ClaimStatus.SUBMITTED,
    ClaimStatus.UNDER_REVIEW,
    ClaimStatus.DISPUTED,
  ].includes(claim.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backPath}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              {TypeIcon && <TypeIcon className="h-5 w-5 text-muted-foreground" />}
              <h1 className="text-xl font-semibold">{claim.title}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {claim.claimNumber} &middot; {typeConfig?.label ?? claim.type}
            </p>
          </div>
        </div>
        <ClaimStatusBadge status={claim.status} showIcon />
      </div>

      {/* Status Timeline */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {STATUS_TIMELINE.map((step, index) => {
              const isActive = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const label =
                index === 2
                  ? getDecisionLabel(claim.status)
                  : step.label;

              return (
                <div key={step.status} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors ${
                        isCurrent
                          ? "border-primary bg-primary text-primary-foreground"
                          : isActive
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-muted-foreground/30 text-muted-foreground"
                      }`}
                    >
                      {isActive && !isCurrent ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`text-[10px] text-center max-w-16 ${
                        isActive
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {index < STATUS_TIMELINE.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 ${
                        index < currentStatusIndex
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/20"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Disputed Alert */}
      {claim.isDisputed && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Claim Disputed</AlertTitle>
          <AlertDescription>
            {claim.disputeReason || "This claim decision has been disputed."}
            {claim.disputedAt && (
              <span className="block mt-1 text-xs">
                Disputed on {formatDateTime(claim.disputedAt)}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Claim Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{claim.description}</p>
              </div>

              {/* Property */}
              {claim.tenancy?.listing && (
                <div className="flex items-center gap-2 text-sm">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span>{claim.tenancy.listing.title}</span>
                </div>
              )}

              {/* Submitted By */}
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>
                  Submitted by{" "}
                  {claim.submittedRole === "OWNER"
                    ? claim.tenancy?.owner?.name || "Owner"
                    : claim.tenancy?.tenant?.name || "Tenant"}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Submitted on {formatDateTime(claim.submittedAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Evidence */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              {claim.evidence && claim.evidence.length > 0 ? (
                <EvidenceGallery evidence={claim.evidence} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No evidence has been uploaded yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Evidence Uploader (if claim is still open) */}
          {canUploadEvidence && (
            <ClaimEvidenceUploader
              claimId={claim.id}
              existingEvidence={claim.evidence}
              onUploadComplete={onRefresh}
            />
          )}

          {/* Review Notes */}
          {claim.reviewNotes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Review Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {claim.reviewNotes}
                </p>
                {claim.reviewedAt && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Reviewed on {formatDateTime(claim.reviewedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Review Panel Slot (owner view) */}
          {isOwnerView && reviewSlot}

          {/* Dispute Slot (tenant view) */}
          {!isOwnerView && disputeSlot}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Amount Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Claimed Amount
                </span>
                <span className="font-medium">
                  {formatClaimAmount(claim.claimedAmount)}
                </span>
              </div>

              {claim.approvedAmount !== undefined && claim.approvedAmount !== null && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Approved Amount
                    </span>
                    <span className="font-medium text-emerald-600">
                      {formatClaimAmount(claim.approvedAmount)}
                    </span>
                  </div>
                  {claim.approvedAmount < claim.claimedAmount && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Difference
                      </span>
                      <span className="text-sm text-destructive">
                        -{formatClaimAmount(
                          claim.claimedAmount - claim.approvedAmount
                        )}
                      </span>
                    </div>
                  )}
                </>
              )}

              {claim.settlementMethod && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Settlement
                    </span>
                    <span className="text-sm">
                      {SETTLEMENT_METHOD_LABELS[claim.settlementMethod] ??
                        claim.settlementMethod}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Claim Number</span>
                <span className="font-mono text-xs">{claim.claimNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span>{typeConfig?.label ?? claim.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted By</span>
                <Badge variant="outline" className="text-[10px]">
                  {claim.submittedRole}
                </Badge>
              </div>
              {claim.maintenanceId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Linked Maintenance</span>
                  <span className="text-xs font-mono truncate max-w-24">
                    {claim.maintenanceId.slice(0, 8)}...
                  </span>
                </div>
              )}
              {claim.evidence && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Evidence</span>
                  <span>{claim.evidence.length} file(s)</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(claim.createdAt)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(claim.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function ClaimDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded" />
        <div className="space-y-1">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {/* Timeline */}
      <Skeleton className="h-16 w-full rounded-lg" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
