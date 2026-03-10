// =============================================================================
// TenancyDetail — Composite component for tenancy detail page
// =============================================================================
// Assembles property info, financial summary, documents, timeline, and actions.
// =============================================================================

"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  MapPin,
  Calendar,
  Wallet,
  FileText,
  User,
  Building,
  BedDouble,
  Bath,
  Phone,
  Mail,
  AlertCircle,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { TenancyDetail as TenancyDetailType, TenancyStatusVariant } from "../types";
import { TENANCY_STATUS_CONFIG } from "../types";
import { TenancyTimeline, TenancyTimelineSkeleton } from "./tenancy-timeline";
import { TenancyActions } from "./tenancy-actions";
import {
  DepositTracker,
  DepositTrackerSkeleton,
} from "@/modules/deposit/components/deposit-tracker";
import { useDepositsByTenancy, useDepositSummary } from "@/modules/deposit/hooks/useDeposits";
import {
  InspectionSummaryCard,
} from "@/modules/inspection/components/inspection-summary-card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
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

function formatAddress(property: TenancyDetailType["property"]): string {
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

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function PropertyInfoCard({ tenancy }: { tenancy: TenancyDetailType }) {
  const { property, unit } = tenancy;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Home className="h-5 w-5" />
          Property Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Property image */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {property.thumbnailUrl ? (
            <Image
              src={property.thumbnailUrl}
              alt={property.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Home className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Property details */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">{property.title}</h3>

          {unit && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="h-4 w-4 shrink-0" />
              <span>
                Unit {unit.unitNumber}
                {unit.block && `, Block ${unit.block}`}
                {unit.floor && `, Floor ${unit.floor}`}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{formatAddress(property)}</span>
          </div>

          {property.propertyType && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Home className="h-4 w-4 shrink-0" />
              <span>{property.propertyType}</span>
            </div>
          )}

          {(property.bedrooms || property.bathrooms) && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {property.bedrooms && (
                <div className="flex items-center gap-1">
                  <BedDouble className="h-4 w-4" />
                  <span>{property.bedrooms} Beds</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-1">
                  <Bath className="h-4 w-4" />
                  <span>{property.bathrooms} Baths</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TenancyDatesCard({ tenancy }: { tenancy: TenancyDetailType }) {
  const statusConfig = TENANCY_STATUS_CONFIG[tenancy.status];
  const badgeVariant = getBadgeVariant(statusConfig.variant);
  const badgeClassName = getStatusBadgeClassName(statusConfig.variant);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Tenancy Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={badgeVariant} className={badgeClassName}>
            {statusConfig.label}
          </Badge>
        </div>

        <Separator />

        {/* Type */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Type</span>
          <span className="font-medium">{tenancy.type}</span>
        </div>

        {/* Dates */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Lease Start</span>
            <span className="font-medium">{formatDate(tenancy.startDate)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Lease End</span>
            <span className="font-medium">{formatDate(tenancy.endDate)}</span>
          </div>
          {tenancy.moveInDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Move-in Date</span>
              <span className="font-medium">{formatDate(tenancy.moveInDate)}</span>
            </div>
          )}
          {tenancy.moveOutDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Move-out Date</span>
              <span className="font-medium">{formatDate(tenancy.moveOutDate)}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Notice period */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Notice Period</span>
          <span className="font-medium">{tenancy.noticePeriodDays} days</span>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancialSummaryCard({ tenancy }: { tenancy: TenancyDetailType }) {
  const { financial } = tenancy;
  const hasOutstanding = financial.outstandingBalance > 0;

  return (
    <Card className={cn(hasOutstanding && "border-destructive/50")}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Financial Summary
          {hasOutstanding && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Monthly rent */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Monthly Rent</span>
          <span className="font-semibold text-lg">
            {formatCurrency(financial.monthlyRent, financial.currency)}
          </span>
        </div>

        <Separator />

        {/* Deposits */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Deposits</h4>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Security Deposit</span>
            <span>{formatCurrency(financial.securityDeposit, financial.currency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Utility Deposit</span>
            <span>{formatCurrency(financial.utilityDeposit, financial.currency)}</span>
          </div>
          {financial.stampDutyFee && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Stamp Duty</span>
              <span>{formatCurrency(financial.stampDutyFee, financial.currency)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm font-medium pt-1 border-t">
            <span>Total Deposits</span>
            <span>{formatCurrency(financial.totalDeposits, financial.currency)}</span>
          </div>
        </div>

        {/* Deposit collection status */}
        {financial.depositsPending > 0 && (
          <div className="rounded-md bg-amber-50 dark:bg-amber-900/10 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-800 dark:text-amber-400">
                Deposits Pending
              </span>
              <span className="font-medium text-amber-800 dark:text-amber-400">
                {formatCurrency(financial.depositsPending, financial.currency)}
              </span>
            </div>
          </div>
        )}

        {/* Outstanding balance */}
        {hasOutstanding && (
          <div className="rounded-md bg-destructive/10 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-destructive">Outstanding Balance</span>
              <span className="font-semibold text-destructive">
                {formatCurrency(financial.outstandingBalance, financial.currency)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DocumentsCard({ tenancy }: { tenancy: TenancyDetailType }) {
  const hasContract = tenancy.contractId;
  
  const contractStatusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    PENDING_SIGNATURES: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    SIGNED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasContract ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tenancy Agreement</span>
              </div>
              {tenancy.contractStatus && (
                <Badge
                  variant="secondary"
                  className={contractStatusColors[tenancy.contractStatus] || ""}
                >
                  {tenancy.contractStatus.replace("_", " ")}
                </Badge>
              )}
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/tenant/tenancy/${tenancy.id}/contract`}>
                <FileText className="mr-2 h-4 w-4" />
                View Contract
              </Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No documents available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OwnerInfoCard({ tenancy }: { tenancy: TenancyDetailType }) {
  const { owner } = tenancy;
  
  if (!owner) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Property Owner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{owner.name}</p>
          </div>
        </div>
        
        {owner.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <a href={`mailto:${owner.email}`} className="hover:underline">
              {owner.email}
            </a>
          </div>
        )}
        
        {owner.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <a href={`tel:${owner.phone}`} className="hover:underline">
              {owner.phone}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TermsCard({ tenancy }: { tenancy: TenancyDetailType }) {
  if (!tenancy.renewalTerms && !tenancy.specialTerms) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Terms & Conditions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {tenancy.renewalTerms && (
          <div>
            <h4 className="font-medium mb-1">Renewal Terms</h4>
            <p className="text-muted-foreground">{tenancy.renewalTerms}</p>
          </div>
        )}
        {tenancy.specialTerms && (
          <div>
            <h4 className="font-medium mb-1">Special Terms</h4>
            <p className="text-muted-foreground">{tenancy.specialTerms}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DepositSection({ tenancyId }: { tenancyId: string }) {
  const { data: deposits, isLoading: depositsLoading } = useDepositsByTenancy(tenancyId);
  const { data: summary, isLoading: summaryLoading } = useDepositSummary(tenancyId);

  if (depositsLoading || summaryLoading) {
    return <DepositTrackerSkeleton />;
  }

  if (!deposits || deposits.length === 0) {
    return null;
  }

  return (
    <DepositTracker
      deposits={deposits}
      summary={summary}
      compact={false}
    />
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TenancyDetailViewProps {
  tenancy: TenancyDetailType;
  /** Base path for navigation */
  basePath?: string;
  /** Whether to show back navigation and actions bar (default: true) */
  showActions?: boolean;
}

// ---------------------------------------------------------------------------
// TenancyDetailView
// ---------------------------------------------------------------------------

export function TenancyDetailView({
  tenancy,
  basePath = "/dashboard/tenant/tenancy",
  showActions = true,
}: TenancyDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* Back navigation + actions bar */}
      {showActions && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href={basePath}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tenancies
            </Link>
          </Button>
          <TenancyActions tenancy={tenancy} basePath={basePath} />
        </div>
      )}

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Property, Dates, Financial, Deposits */}
        <div className="space-y-6 lg:col-span-2">
          <PropertyInfoCard tenancy={tenancy} />
          <TenancyDatesCard tenancy={tenancy} />
          <FinancialSummaryCard tenancy={tenancy} />
          <DepositSection tenancyId={tenancy.id} />
          <DocumentsCard tenancy={tenancy} />
          <InspectionSummaryCard tenancyId={tenancy.id} />
        </div>

        {/* Right column: Timeline, Owner, Terms */}
        <div className="space-y-6">
          {tenancy.statusHistory && tenancy.statusHistory.length > 0 && (
            <TenancyTimeline history={tenancy.statusHistory} />
          )}
          <OwnerInfoCard tenancy={tenancy} />
          <TermsCard tenancy={tenancy} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function TenancyDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Property card skeleton */}
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>

          {/* Dates card skeleton */}
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Financial card skeleton */}
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Deposit tracker skeleton */}
          <DepositTrackerSkeleton />
        </div>

        <div className="space-y-6">
          <TenancyTimelineSkeleton />
          
          {/* Owner card skeleton */}
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
