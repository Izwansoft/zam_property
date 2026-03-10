"use client";

import { Building2, Car, Plane, Store } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { VendorVerticalItem } from "../types";

interface VendorHubCardProps {
  items: VendorVerticalItem[];
  onStart: (verticalKey: string) => void;
  onContinue: (verticalKey: string, applicationId?: string) => void;
  onViewSubmission: (verticalKey: string, applicationId?: string) => void;
  onOpenPortal: (verticalKey: string) => void;
  onResubmit: (verticalKey: string, applicationId?: string) => void;
}

const STATUS_BADGE: Record<string, { label: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
  NOT_STARTED: { label: "Not Started", variant: "outline" },
  DRAFT: { label: "Draft", variant: "secondary" },
  PENDING: { label: "Pending Review", variant: "secondary" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

function getVerticalIcon(key: string) {
  switch (key) {
    case "real_estate":
      return Building2;
    case "automotive":
      return Car;
    case "travel":
      return Plane;
    default:
      return Store;
  }
}

function ActionButtons({
  item,
  onStart,
  onContinue,
  onViewSubmission,
  onOpenPortal,
  onResubmit,
}: {
  item: VendorVerticalItem;
  onStart: (verticalKey: string) => void;
  onContinue: (verticalKey: string, applicationId?: string) => void;
  onViewSubmission: (verticalKey: string, applicationId?: string) => void;
  onOpenPortal: (verticalKey: string) => void;
  onResubmit: (verticalKey: string, applicationId?: string) => void;
}) {
  if (!item.enabled) {
    return (
      <Button type="button" size="sm" variant="outline" disabled>
        Coming Soon
      </Button>
    );
  }

  switch (item.status) {
    case "NOT_STARTED":
      return (
        <Button type="button" size="sm" onClick={() => onStart(item.verticalKey)}>
          Start Application
        </Button>
      );
    case "DRAFT":
      return (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onContinue(item.verticalKey, item.applicationId)}
        >
          Continue Application
        </Button>
      );
    case "PENDING":
      return (
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" disabled>
            Under Review
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onViewSubmission(item.verticalKey, item.applicationId)}
          >
            View
          </Button>
        </div>
      );
    case "APPROVED":
      return (
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={() => onOpenPortal(item.verticalKey)}
        >
          Open Vendor Portal
        </Button>
      );
    case "REJECTED":
      return (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => onResubmit(item.verticalKey, item.applicationId)}
        >
          Revise & Resubmit
        </Button>
      );
    default:
      return null;
  }
}

export function VendorHubCard({
  items,
  onStart,
  onContinue,
  onViewSubmission,
  onOpenPortal,
  onResubmit,
}: VendorHubCardProps) {
  return (
    <Card id="vendor-hub">
      <CardHeader>
        <CardTitle className="text-base">Vendor Hub</CardTitle>
        <CardDescription>
          Apply and manage your vendor access by vertical.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const Icon = getVerticalIcon(item.verticalKey);
          const status = STATUS_BADGE[item.status];

          return (
            <div
              key={item.verticalKey}
              className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="bg-muted text-muted-foreground flex h-9 w-9 items-center justify-center rounded-md">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{item.verticalLabel}</p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  {item.status === "PENDING" && (
                    <p className="text-xs text-muted-foreground">
                      Your application is under review. We will notify you once approved.
                    </p>
                  )}
                  {item.status === "REJECTED" && item.rejectionReason && (
                    <p className="text-xs text-destructive">Reason: {item.rejectionReason}</p>
                  )}
                </div>
              </div>

              <ActionButtons
                item={item}
                onStart={onStart}
                onContinue={onContinue}
                onViewSubmission={onViewSubmission}
                onOpenPortal={onOpenPortal}
                onResubmit={onResubmit}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
