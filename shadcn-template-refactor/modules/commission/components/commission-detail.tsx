// =============================================================================
// CommissionDetail — Full commission view with status timeline & actions
// =============================================================================
// Displays detailed commission information including agent info, tenancy,
// status timeline, and action buttons for approve/pay/cancel.
// =============================================================================

"use client";

import Link from "next/link";
import {
  ArrowLeft,
  WalletIcon,
  Calendar,
  Building2,
  User,
  Hash,
  FileText,
  Clock,
  CheckCircle,
  BadgeDollarSign,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import { useCommission } from "../hooks/useCommissions";
import {
  COMMISSION_STATUS_CONFIG,
  COMMISSION_TYPE_CONFIG,
  formatCommissionAmount,
} from "../types";
import type { CommissionStatus } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CommissionDetailProps {
  commissionId: string;
  /** Back link path */
  backPath?: string;
}

// ---------------------------------------------------------------------------
// Status Timeline config
// ---------------------------------------------------------------------------

const STATUS_STEPS: {
  status: CommissionStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { status: "PENDING", label: "Created", icon: Clock },
  { status: "APPROVED", label: "Approved", icon: CheckCircle },
  { status: "PAID", label: "Paid", icon: BadgeDollarSign },
];

function getStepState(
  stepStatus: CommissionStatus,
  currentStatus: CommissionStatus
): "complete" | "current" | "upcoming" | "cancelled" {
  if (currentStatus === "CANCELLED") return "cancelled";
  const order: CommissionStatus[] = ["PENDING", "APPROVED", "PAID"];
  const stepIndex = order.indexOf(stepStatus);
  const currentIndex = order.indexOf(currentStatus);
  if (stepIndex < currentIndex) return "complete";
  if (stepIndex === currentIndex) return "current";
  return "upcoming";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommissionDetail({
  commissionId,
  backPath = "/dashboard/agent/commissions",
}: CommissionDetailProps) {
  const { data: commission, isLoading, error } = useCommission(commissionId);

  if (isLoading) {
    return <CommissionDetailSkeleton />;
  }

  if (error || !commission) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backPath}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Commissions
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
          <AlertCircle className="size-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Commission not found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The commission record you&apos;re looking for doesn&apos;t exist or
            you don&apos;t have access.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={backPath}>Return to Commissions</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = COMMISSION_STATUS_CONFIG[commission.status];
  const typeConfig = COMMISSION_TYPE_CONFIG[commission.type];
  const createdDate = new Date(commission.createdAt).toLocaleDateString(
    "en-MY",
    { year: "numeric", month: "long", day: "numeric" }
  );
  const paidDate = commission.paidAt
    ? new Date(commission.paidAt).toLocaleDateString("en-MY", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Back + Title */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2" asChild>
          <Link href={backPath}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Commissions
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            Commission Detail
          </h1>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>
        <p className="text-muted-foreground">
          {typeConfig.description}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — 2 columns */}
        <div className="space-y-6 lg:col-span-2">
          {/* Commission Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <WalletIcon className="size-4" />
                Commission Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <InfoItem
                  icon={Hash}
                  label="Type"
                  value={typeConfig.label}
                />
                <InfoItem
                  icon={WalletIcon}
                  label="Amount"
                  value={formatCommissionAmount(commission.amount)}
                />
                <InfoItem
                  icon={FileText}
                  label="Rate"
                  value={`${(commission.rate * 100).toFixed(1)}%`}
                />
                <InfoItem
                  icon={Calendar}
                  label="Created"
                  value={createdDate}
                />
                {paidDate && (
                  <InfoItem
                    icon={BadgeDollarSign}
                    label="Paid Date"
                    value={paidDate}
                  />
                )}
                {commission.paidRef && (
                  <InfoItem
                    icon={Hash}
                    label="Payment Reference"
                    value={commission.paidRef}
                  />
                )}
              </dl>
              {commission.notes && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Notes
                    </p>
                    <p className="text-sm">{commission.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Listing / Tenancy Info */}
          {commission.tenancy && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="size-4" />
                  Listing & Tenancy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {commission.tenancy.listing && (
                    <InfoItem
                      icon={Building2}
                      label="Listing"
                      value={commission.tenancy.listing.title}
                    />
                  )}
                  <InfoItem
                    icon={Hash}
                    label="Tenancy ID"
                    value={commission.tenancy.id.slice(0, 8) + "..."}
                  />
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar — 1 column */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4" />
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {commission.status === "CANCELLED" ? (
                <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <XCircle className="size-5 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">Cancelled</p>
                    <p className="text-xs text-muted-foreground">
                      This commission has been cancelled
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {STATUS_STEPS.map((step, index) => {
                    const state = getStepState(
                      step.status,
                      commission.status
                    );
                    const Icon = step.icon;
                    return (
                      <div key={step.status} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex size-8 items-center justify-center rounded-full border-2 ${
                              state === "complete"
                                ? "border-primary bg-primary text-primary-foreground"
                                : state === "current"
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-muted-foreground/30 bg-muted text-muted-foreground/50"
                            }`}
                          >
                            <Icon className="size-4" />
                          </div>
                          {index < STATUS_STEPS.length - 1 && (
                            <div
                              className={`mt-1 h-6 w-0.5 ${
                                state === "complete"
                                  ? "bg-primary"
                                  : "bg-muted-foreground/30"
                              }`}
                            />
                          )}
                        </div>
                        <div className="pt-1">
                          <p
                            className={`text-sm font-medium ${
                              state === "upcoming"
                                ? "text-muted-foreground/50"
                                : ""
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Info */}
          {commission.agent && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="size-4" />
                  Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {commission.agent.user?.fullName ?? "Agent"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {commission.agent.user?.email}
                    </p>
                    {commission.agent.renNumber && (
                      <p className="text-xs text-muted-foreground">
                        REN: {commission.agent.renNumber}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info Item
// ---------------------------------------------------------------------------

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function CommissionDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-2 h-5 w-56" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="size-4 mt-0.5" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="size-4 mt-0.5" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-4 w-20 mt-2" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
