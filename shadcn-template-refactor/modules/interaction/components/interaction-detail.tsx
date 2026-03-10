// =============================================================================
// InteractionDetail — Composite detail view with conversation thread
// =============================================================================

"use client";

import {
  Inbox,
  MessageSquare,
  CalendarCheck,
  Clock,
  User,
  Building2,
  FileText,
  Tag,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { PageHeader } from "@/components/common/page-header";

import type {
  InteractionDetail as InteractionDetailType,
  InteractionMessage,
  InteractionType,
} from "../types";
import {
  INTERACTION_STATUS_CONFIG,
  getInteractionTypeLabel,
  formatDateTime,
  formatDate,
} from "../utils";
import { InteractionStatusActions } from "./interaction-status-actions";
import { InteractionReplyForm } from "./interaction-reply-form";

// ---------------------------------------------------------------------------
// Type icon mapping
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<InteractionType, React.ComponentType<{ className?: string }>> = {
  LEAD: Inbox,
  ENQUIRY: MessageSquare,
  BOOKING: CalendarCheck,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InteractionDetailViewProps {
  interaction: InteractionDetailType;
  /** Base path for back navigation */
  basePath: string;
}

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
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: InteractionMessage }) {
  const isVendor = message.senderRole === "VENDOR";
  const isSystem = message.senderRole === "SYSTEM";

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <p className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex ${isVendor ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isVendor
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <p className={`text-xs font-medium ${isVendor ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
            {message.senderName}
          </p>
          <span className={`text-xs ${isVendor ? "text-primary-foreground/60" : "text-muted-foreground/70"}`}>
            {formatDateTime(message.createdAt)}
          </span>
        </div>
        <p className={`text-sm whitespace-pre-wrap ${isVendor ? "text-primary-foreground" : "text-foreground"}`}>
          {message.content}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InteractionDetailView({
  interaction,
  basePath,
}: InteractionDetailViewProps) {
  const statusConfig = INTERACTION_STATUS_CONFIG[interaction.status];
  const TypeIcon = TYPE_ICONS[interaction.type];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={interaction.listingTitle}
        description={`${getInteractionTypeLabel(interaction.type)} · ${interaction.referenceId}`}
        status={{ label: statusConfig.label, variant: statusConfig.variant }}
        backHref={basePath}
        breadcrumbOverrides={[
          { segment: "inbox", label: "Inbox" },
          { segment: interaction.id, label: interaction.referenceId },
        ]}
        actions={[]}
      />

      {/* Status Actions */}
      <InteractionStatusActions interaction={interaction} />

      {/* Layout: conversation + sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column: conversation thread + reply */}
        <div className="space-y-6">
          {/* Conversation thread */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Conversation ({interaction.messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interaction.messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {interaction.messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No messages yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reply form (only show if not closed/invalid) */}
          {interaction.status !== "CLOSED" &&
            interaction.status !== "INVALID" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reply</CardTitle>
                </CardHeader>
                <CardContent>
                  <InteractionReplyForm interactionId={interaction.id} />
                </CardContent>
              </Card>
            )}
        </div>

        {/* Right column: info sidebar */}
        <div className="space-y-4">
          {/* Interaction info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow
                icon={TypeIcon}
                label="Type"
                value={
                  <Badge variant="outline" className="text-xs">
                    {getInteractionTypeLabel(interaction.type)}
                  </Badge>
                }
              />
              <Separator />
              <InfoRow
                icon={Tag}
                label="Reference"
                value={interaction.referenceId}
              />
              <Separator />
              <InfoRow
                icon={FileText}
                label="Listing"
                value={interaction.listingTitle}
              />
              <Separator />
              <InfoRow
                icon={Building2}
                label="Vendor"
                value={interaction.vendorName}
              />
              {interaction.source && (
                <>
                  <Separator />
                  <InfoRow
                    icon={Tag}
                    label="Source"
                    value={interaction.source}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Customer info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow
                icon={User}
                label="Name"
                value={interaction.customerName}
              />
              {interaction.customerEmail && (
                <>
                  <Separator />
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={interaction.customerEmail}
                  />
                </>
              )}
              {interaction.customerPhone && (
                <>
                  <Separator />
                  <InfoRow
                    icon={Phone}
                    label="Phone"
                    value={interaction.customerPhone}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Booking details (if applicable) */}
          {interaction.bookingDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {interaction.bookingDetails.startDate && (
                  <InfoRow
                    icon={Calendar}
                    label="Start Date"
                    value={formatDate(interaction.bookingDetails.startDate)}
                  />
                )}
                {interaction.bookingDetails.endDate && (
                  <>
                    <Separator />
                    <InfoRow
                      icon={Calendar}
                      label="End Date"
                      value={formatDate(interaction.bookingDetails.endDate)}
                    />
                  </>
                )}
                {interaction.bookingDetails.notes && (
                  <>
                    <Separator />
                    <InfoRow
                      icon={FileText}
                      label="Notes"
                      value={interaction.bookingDetails.notes}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow
                icon={Clock}
                label="Created"
                value={formatDateTime(interaction.createdAt)}
              />
              <Separator />
              <InfoRow
                icon={Clock}
                label="Last Updated"
                value={formatDateTime(interaction.updatedAt)}
              />
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

export function InteractionDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Actions skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Conversation skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 1 ? "justify-end" : "justify-start"}`}
                >
                  <Skeleton
                    className={`h-20 rounded-lg ${i % 2 === 1 ? "w-3/5" : "w-4/5"}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reply form skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
              <div className="mt-3 flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
