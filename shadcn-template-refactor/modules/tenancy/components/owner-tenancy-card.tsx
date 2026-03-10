// =============================================================================
// OwnerTenancyCard — Card component for owner's tenancy list with actions
// =============================================================================

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Calendar,
  MapPin,
  Home,
  Wallet,
  User,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  FileCheck,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import type { Tenancy, TenancyStatus, TenancyStatusVariant } from "../types";
import { TENANCY_STATUS_CONFIG, TenancyStatus as TenancyStatusEnum } from "../types";
import { useApproveTenancy, useRejectTenancy } from "../hooks/useOwnerTenancies";

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

function formatCurrency(amount: number, currency: string = "MYR"): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatAddress(property: Tenancy["property"]): string {
  const parts = [property.address, property.city, property.state].filter(Boolean);
  return parts.join(", ") || "No address";
}

function getBadgeVariant(
  variant: TenancyStatusVariant
): "default" | "secondary" | "destructive" | "outline" {
  switch (variant) {
    case "success":
      return "default";
    case "warning":
      return "secondary";
    case "destructive":
      return "destructive";
    case "outline":
      return "outline";
    default:
      return "secondary";
  }
}

function getStatusBadgeClassName(variant: TenancyStatusVariant): string {
  switch (variant) {
    case "success":
      return "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    case "warning":
      return "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
    case "destructive":
      return "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "";
  }
}

// Check if status supports quick approve/reject actions
function canApproveReject(status: TenancyStatus): boolean {
  return status === TenancyStatusEnum.PENDING_BOOKING;
}

function canConfirmDeposit(status: TenancyStatus): boolean {
  return status === TenancyStatusEnum.PENDING_CONTRACT;
}

function canSignContract(status: TenancyStatus): boolean {
  return status === TenancyStatusEnum.PENDING_SIGNATURES;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OwnerTenancyCardProps {
  tenancy: Tenancy;
  /** Base path for detail link */
  basePath?: string;
  /** Callback after successful action */
  onActionComplete?: () => void;
  /** Show compact version without actions */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OwnerTenancyCard({
  tenancy,
  basePath = "/dashboard/vendor/tenancies",
  onActionComplete,
  compact = false,
}: OwnerTenancyCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const approveMutation = useApproveTenancy();
  const rejectMutation = useRejectTenancy();

  const statusConfig = TENANCY_STATUS_CONFIG[tenancy.status];
  const badgeVariant = getBadgeVariant(statusConfig.variant);
  const badgeClassName = getStatusBadgeClassName(statusConfig.variant);

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({ tenancyId: tenancy.id });
      onActionComplete?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync({
        tenancyId: tenancy.id,
        reason: rejectReason,
      });
      setShowRejectDialog(false);
      setRejectReason("");
      onActionComplete?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Get tenant name from tenancy if available
  const tenantName = (tenancy as any).tenant?.name || "Partner";
  const property = tenancy.property;
  const propertyTitle = property?.title || `Property ${tenancy.propertyId}`;
  const propertyThumbnailUrl = property?.thumbnailUrl;

  return (
    <>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="flex flex-col sm:flex-row">
          {/* Property Thumbnail */}
          <Link
            href={`${basePath}/${tenancy.id}`}
            className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted sm:aspect-square sm:w-40 group"
          >
            {propertyThumbnailUrl ? (
              <Image
                src={propertyThumbnailUrl}
                alt={propertyTitle}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 160px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Home className="h-10 w-10 text-muted-foreground" />
              </div>
            )}

            {/* Status badge (mobile: top corner) */}
            <Badge
              variant={badgeVariant}
              className={`absolute left-2 top-2 text-xs sm:hidden ${badgeClassName}`}
            >
              {statusConfig.label}
            </Badge>
          </Link>

          {/* Content */}
          <CardContent className="flex flex-1 flex-col justify-between p-4">
            <div>
              {/* Header with title and status */}
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`${basePath}/${tenancy.id}`}
                  className="line-clamp-2 font-semibold leading-tight hover:text-primary"
                >
                  {propertyTitle}
                </Link>
                <div className="flex items-center gap-2">
                  {/* Status badge (desktop: inline) */}
                  <Badge
                    variant={badgeVariant}
                    className={`hidden shrink-0 text-xs sm:inline-flex ${badgeClassName}`}
                  >
                    {statusConfig.label}
                  </Badge>

                  {/* Actions dropdown */}
                  {!compact && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`${basePath}/${tenancy.id}`}>
                            View Details
                          </Link>
                        </DropdownMenuItem>

                        {canApproveReject(tenancy.status) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={handleApprove}
                              disabled={approveMutation.isPending}
                              className="text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve Booking
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setShowRejectDialog(true)}
                              disabled={rejectMutation.isPending}
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject Booking
                            </DropdownMenuItem>
                          </>
                        )}

                        {canConfirmDeposit(tenancy.status) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`${basePath}/${tenancy.id}?action=deposit`}>
                                <FileCheck className="mr-2 h-4 w-4" />
                                Confirm Deposit
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}

                        {canSignContract(tenancy.status) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`${basePath}/${tenancy.id}?action=sign`}>
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Sign Contract
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Unit info */}
              {tenancy.unit && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Unit {tenancy.unit.unitNumber}
                  {tenancy.unit.floor && `, Floor ${tenancy.unit.floor}`}
                  {tenancy.unit.block && `, Block ${tenancy.unit.block}`}
                </p>
              )}

              {/* Address */}
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">{formatAddress(tenancy.property)}</span>
              </p>

              {/* Partner info */}
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span>Partner: {tenantName}</span>
              </p>
            </div>

            {/* Footer: dates and rent */}
            <div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t pt-3">
              <div className="flex flex-col gap-1">
                {/* Tenancy dates */}
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDate(tenancy.startDate)} – {formatDate(tenancy.endDate)}
                  </span>
                </p>
              </div>

              {/* Monthly rent */}
              <div className="flex items-center gap-1">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">
                  {formatCurrency(tenancy.monthlyRent, tenancy.currency)}/mo
                </span>
              </div>
            </div>

            {/* Quick action buttons for pending status */}
            {!compact && canApproveReject(tenancy.status) && (
              <div className="mt-3 flex gap-2 border-t pt-3">
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="flex-1"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={rejectMutation.isPending}
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            )}

            {/* Warning for overdue */}
            {tenancy.status === TenancyStatusEnum.OVERDUE && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>Rent payment overdue - action required</span>
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this booking? This action cannot be undone.
              Please provide a reason for rejection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-reason">Reason for Rejection</Label>
            <Textarea
              id="reject-reason"
              placeholder="Enter reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function OwnerTenancyCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <Skeleton className="aspect-[4/3] w-full sm:aspect-square sm:w-40" />
        <CardContent className="flex flex-1 flex-col justify-between p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="mt-3 flex justify-between border-t pt-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
