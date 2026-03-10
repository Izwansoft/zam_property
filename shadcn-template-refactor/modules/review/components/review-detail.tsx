// =============================================================================
// ReviewDetailView — Composite detail view with moderation & reply
// =============================================================================

"use client";

import {
  Star,
  Clock,
  User,
  Building2,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import { PageHeader } from "@/components/common/page-header";

import type { ReviewDetail as ReviewDetailType } from "../types";
import {
  REVIEW_STATUS_CONFIG,
  getRatingColor,
  getRatingLabel,
  formatDate,
  formatDateTime,
} from "../utils";
import { StarRating } from "./review-card";
import { ReviewModerationActions } from "./review-moderation-actions";
import { ReviewReplyForm } from "./review-reply-form";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div>
        <span className="text-muted-foreground">{label}: </span>
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReviewDetailViewProps {
  review: ReviewDetailType;
  /** "vendor" or "partner" — controls which actions are available */
  portalType: "vendor" | "partner";
  /** Back link path */
  backPath: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewDetailView({
  review,
  portalType,
  backPath,
}: ReviewDetailViewProps) {
  const statusConfig = REVIEW_STATUS_CONFIG[review.status];
  const showModerationActions = portalType === "partner";
  const showReplyForm = portalType === "vendor" && review.status === "APPROVED";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={review.title || "Review Detail"}
        description={`Review by ${review.customerName}`}
        breadcrumbOverrides={[
          { segment: "reviews", label: "Reviews" },
          { segment: review.id, label: review.title || `Review #${review.id.slice(-6)}` },
        ]}
      >
        <div className="flex items-center gap-2">
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          {showModerationActions && (
            <ReviewModerationActions
              reviewId={review.id}
              currentStatus={review.status}
            />
          )}
        </div>
      </PageHeader>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — Review content (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Review content card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <span
                      className={`text-3xl font-bold ${getRatingColor(review.rating)}`}
                    >
                      {review.rating}
                    </span>
                    <div className="mt-0.5">
                      <StarRating rating={review.rating} size="md" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getRatingLabel(review.rating)}
                    </p>
                  </div>
                  <Separator orientation="vertical" className="h-16" />
                  <div>
                    <CardTitle className="text-base">
                      {review.title || "Untitled Review"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      by {review.customerName} · {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {review.content}
              </p>
            </CardContent>
          </Card>

          {/* Vendor Reply */}
          {review.vendorReply && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Vendor Reply</CardTitle>
                </div>
                {review.vendorReplyDate && (
                  <p className="text-xs text-muted-foreground">
                    Replied on {formatDate(review.vendorReplyDate)}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {review.vendorReply}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Reply Form (vendor only, if no existing reply) */}
          {showReplyForm && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Reply to Review</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Your reply will be publicly visible once approved.
                </p>
              </CardHeader>
              <CardContent>
                <ReviewReplyForm
                  reviewId={review.id}
                  hasExistingReply={review.hasVendorReply}
                />
              </CardContent>
            </Card>
          )}

          {/* Internal notes (partner admin only) */}
          {portalType === "partner" &&
            review.internalNotes &&
            review.internalNotes.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-base">Internal Notes</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    These notes are only visible to administrators.
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {review.internalNotes.map((note, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2"
                      >
                        {note}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

          {/* Report reasons (partner admin only) */}
          {portalType === "partner" &&
            review.reportReasons &&
            review.reportReasons.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <CardTitle className="text-base">Report Reasons</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {review.reportReasons.map((reason, idx) => (
                      <li
                        key={idx}
                        className="text-sm flex items-center gap-2"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
        </div>

        {/* Right — Sidebar (1 col) */}
        <div className="space-y-4">
          {/* Listing details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Listing Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                icon={FileText}
                label="Listing"
                value={review.listingTitle}
              />
              <InfoRow
                icon={Building2}
                label="Vendor"
                value={review.vendorName}
              />
            </CardContent>
          </Card>

          {/* Customer details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                icon={User}
                label="Name"
                value={review.customerName}
              />
              {portalType === "partner" && (
                <>
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={review.customerEmail}
                  />
                  <InfoRow
                    icon={Phone}
                    label="Phone"
                    value={review.customerPhone}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Moderation info */}
          {review.moderationReason && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Moderation Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Status: </span>
                  <Badge variant={statusConfig.variant} className="ml-1">
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Reason: </span>
                  <span>{review.moderationReason}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                icon={Clock}
                label="Created"
                value={formatDateTime(review.createdAt)}
              />
              <InfoRow
                icon={Clock}
                label="Updated"
                value={formatDateTime(review.updatedAt)}
              />
              {review.vendorReplyDate && (
                <InfoRow
                  icon={MessageSquare}
                  label="Reply"
                  value={formatDateTime(review.vendorReplyDate)}
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
// Skeleton
// ---------------------------------------------------------------------------

export function ReviewDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Right */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
