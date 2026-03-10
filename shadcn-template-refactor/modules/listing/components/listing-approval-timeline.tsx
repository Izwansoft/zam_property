"use client";

import { BellIcon, CheckCircle2Icon, Clock3Icon, FileClockIcon, XCircleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ListingDetail } from "../types";

interface ListingApprovalTimelineProps {
  listing: ListingDetail;
}

export function ListingApprovalTimeline({ listing }: ListingApprovalTimelineProps) {
  const createdLabel = formatDateTime(listing.createdAt);
  const publishedLabel = listing.publishedAt ? formatDateTime(listing.publishedAt) : null;
  const expiredLabel = listing.expiresAt ? formatDateTime(listing.expiresAt) : null;

  const reviewState =
    listing.status === "DRAFT"
      ? { text: "Pending partner review", icon: FileClockIcon, tone: "bg-amber-500/10 text-amber-700" }
      : { text: "Reviewed by partner", icon: CheckCircle2Icon, tone: "bg-emerald-500/10 text-emerald-700" };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BellIcon className="h-4 w-4 text-primary" />
          Approval Timeline
        </CardTitle>
        <CardDescription>
          Moderation progress for this listing submission.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <TimelineRow
          title="Draft submitted"
          subtitle={createdLabel}
          icon={Clock3Icon}
          badge={<Badge variant="outline">Submitted</Badge>}
        />

        <TimelineRow
          title={reviewState.text}
          subtitle="Partner admin validates listing quality and policy checks"
          icon={reviewState.icon}
          badge={<Badge className={reviewState.tone}>{listing.status}</Badge>}
        />

        {listing.status === "PUBLISHED" && (
          <TimelineRow
            title="Approved and published"
            subtitle={publishedLabel ?? "Published"}
            icon={CheckCircle2Icon}
            badge={<Badge className="bg-emerald-500/10 text-emerald-700">Approved</Badge>}
          />
        )}

        {listing.status === "EXPIRED" && (
          <TimelineRow
            title="Listing expired"
            subtitle={expiredLabel ?? "Expired"}
            icon={XCircleIcon}
            badge={<Badge variant="destructive">Expired</Badge>}
          />
        )}

        {listing.status === "ARCHIVED" && (
          <TimelineRow
            title="Listing archived"
            subtitle="No longer visible in active catalogue"
            icon={XCircleIcon}
            badge={<Badge variant="secondary">Archived</Badge>}
          />
        )}

        <p className="text-xs text-muted-foreground">
          Moderation updates also appear in your notification bell in the top bar.
        </p>
      </CardContent>
    </Card>
  );
}

function TimelineRow({
  title,
  subtitle,
  icon: Icon,
  badge,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {badge}
    </div>
  );
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
