// =============================================================================
// ContractViewer — Composite component for viewing contract details
// =============================================================================
// Displays PDF preview, signers list, terms summary, and signing actions.
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  Pen,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Home,
  Wallet,
  Users,
  ScrollText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatCurrency } from "@/lib/utils";

import type {
  ContractDetail,
  ContractSigner,
  ContractEvent,
  ContractTermsSummary,
} from "../types";
import {
  ContractStatus,
  SignerStatus,
  SignerRole,
  CONTRACT_STATUS_CONFIG,
} from "../types";
import { ContractStatusBadge, SignerStatusBadge } from "./contract-status-badge";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SIGNER_ROLE_LABELS: Record<SignerRole, string> = {
  [SignerRole.OWNER]: "Owner/Landlord",
  [SignerRole.TENANT]: "Partner/Tenant",
  [SignerRole.WITNESS]: "Witness",
  [SignerRole.GUARANTOR]: "Guarantor",
};

const EVENT_ICONS: Record<string, React.ElementType> = {
  CREATED: FileText,
  SENT: RefreshCw,
  VIEWED: Eye,
  SIGNED: CheckCircle2,
  DECLINED: XCircle,
  VOIDED: XCircle,
  EXPIRED: AlertCircle,
};

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

function formatDateTime(dateString?: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// ContractViewer Props
// ---------------------------------------------------------------------------

interface ContractViewerProps {
  contract: ContractDetail;
  basePath?: string;
  currentUserId?: string;
  onSign?: () => void;
  onDownload?: () => void;
  isDownloading?: boolean;
}

/**
 * Main contract viewer component with tabs for document, signers, and terms.
 */
export function ContractViewer({
  contract,
  basePath = "/dashboard/tenant/tenancy",
  currentUserId,
  onSign,
  onDownload,
  isDownloading = false,
}: ContractViewerProps) {
  const [activeTab, setActiveTab] = useState("document");

  // Check if current user needs to sign
  const currentUserSigner = currentUserId
    ? contract.signers.find(
        (s) => s.userId === currentUserId && s.status === SignerStatus.PENDING
      )
    : null;

  const canSign =
    contract.status === ContractStatus.PENDING_SIGNATURES && !!currentUserSigner;

  const signedCount = contract.signers.filter(
    (s) => s.status === SignerStatus.SIGNED
  ).length;

  const totalSigners = contract.signers.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href={basePath}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">{contract.title}</h1>
          </div>
          <p className="text-muted-foreground">
            {contract.tenancy?.propertyTitle ?? "Contract Document"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ContractStatusBadge status={contract.status} />
          <Badge variant="outline" className="text-xs">
            v{contract.version}
          </Badge>
        </div>
      </div>

      {/* Action Bar */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>
                {signedCount}/{totalSigners} signed
              </span>
            </div>
            {contract.expiresAt && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Expires {formatDate(contract.expiresAt)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              disabled={isDownloading || !contract.pdfUrl}
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? "Downloading..." : "Download PDF"}
            </Button>
            {canSign && (
              <Button size="sm" onClick={onSign}>
                <Pen className="mr-2 h-4 w-4" />
                Sign Contract
              </Button>
            )}
            {contract.externalSigningUrl && (
              <Button size="sm" variant="default" asChild>
                <a
                  href={contract.externalSigningUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Sign Externally
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="document" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Document</span>
          </TabsTrigger>
          <TabsTrigger value="signers" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Signers</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {signedCount}/{totalSigners}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="terms" className="gap-2">
            <ScrollText className="h-4 w-4" />
            <span className="hidden sm:inline">Terms</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="document" className="mt-6">
          <DocumentTab contract={contract} />
        </TabsContent>

        <TabsContent value="signers" className="mt-6">
          <SignersTab
            signers={contract.signers}
            events={contract.events}
            currentUserId={currentUserId}
          />
        </TabsContent>

        <TabsContent value="terms" className="mt-6">
          <TermsTab terms={contract.terms} tenancy={contract.tenancy} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Document Tab
// ---------------------------------------------------------------------------

interface DocumentTabProps {
  contract: ContractDetail;
}

function DocumentTab({ contract }: DocumentTabProps) {
  const hasHtmlContent = !!contract.htmlContent;
  const hasPdfUrl = !!contract.pdfUrl;

  if (!hasHtmlContent && !hasPdfUrl) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Document Not Available</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The contract document is being prepared. Please check back later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contract Document</CardTitle>
        <CardDescription>
          Review the contract terms before signing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasHtmlContent ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted/50 p-6"
            dangerouslySetInnerHTML={{ __html: contract.htmlContent! }}
          />
        ) : hasPdfUrl ? (
          <div className="relative aspect-[8.5/11] w-full overflow-hidden rounded-md border bg-muted">
            <iframe
              src={`${contract.pdfUrl}#view=FitH`}
              className="absolute inset-0 h-full w-full"
              title="Contract PDF"
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Signers Tab
// ---------------------------------------------------------------------------

interface SignersTabProps {
  signers: ContractSigner[];
  events: ContractEvent[];
  currentUserId?: string;
}

function SignersTab({ signers, events, currentUserId }: SignersTabProps) {
  // Sort signers by order
  const sortedSigners = [...signers].sort((a, b) => a.order - b.order);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Signers List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Signature Status</CardTitle>
          <CardDescription>
            Track who has signed the contract
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedSigners.map((signer, index) => (
            <div key={signer.id}>
              {index > 0 && <Separator className="my-4" />}
              <SignerCard signer={signer} isCurrentUser={signer.userId === currentUserId} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity</CardTitle>
          <CardDescription>Contract signing activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            ) : (
              events.map((event) => (
                <EventItem key={event.id} event={event} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signer Card
// ---------------------------------------------------------------------------

interface SignerCardProps {
  signer: ContractSigner;
  isCurrentUser?: boolean;
}

function SignerCard({ signer, isCurrentUser }: SignerCardProps) {
  const StatusIcon =
    signer.status === SignerStatus.SIGNED
      ? CheckCircle2
      : signer.status === SignerStatus.DECLINED
        ? XCircle
        : signer.status === SignerStatus.VIEWED
          ? Eye
          : Clock;

  const statusColors = {
    [SignerStatus.SIGNED]: "text-green-600",
    [SignerStatus.DECLINED]: "text-red-600",
    [SignerStatus.VIEWED]: "text-yellow-600",
    [SignerStatus.PENDING]: "text-muted-foreground",
  };

  return (
    <div className="flex items-start gap-4">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          signer.status === SignerStatus.SIGNED
            ? "bg-green-100 dark:bg-green-900/30"
            : "bg-muted"
        )}
      >
        <StatusIcon
          className={cn("h-5 w-5", statusColors[signer.status])}
        />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{signer.name}</span>
          {isCurrentUser && (
            <Badge variant="outline" className="text-xs">
              You
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{SIGNER_ROLE_LABELS[signer.role]}</span>
          <span>•</span>
          <span>{signer.email}</span>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <SignerStatusBadge status={signer.status} size="sm" />
          {signer.signedAt && (
            <span className="text-xs text-muted-foreground">
              {formatDateTime(signer.signedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event Item
// ---------------------------------------------------------------------------

interface EventItemProps {
  event: ContractEvent;
}

function EventItem({ event }: EventItemProps) {
  const Icon = EVENT_ICONS[event.eventType] ?? FileText;

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-0.5">
        <p className="text-sm">{event.description}</p>
        {event.actorName && (
          <p className="text-xs text-muted-foreground">
            by {event.actorName}
            {event.actorRole && ` (${SIGNER_ROLE_LABELS[event.actorRole]})`}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatDateTime(event.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Terms Tab
// ---------------------------------------------------------------------------

interface TermsTabProps {
  terms: ContractTermsSummary;
  tenancy?: ContractDetail["tenancy"];
}

function TermsTab({ terms, tenancy }: TermsTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Property Info */}
      {tenancy && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Home className="h-5 w-5" />
              Property
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Property</span>
              <p className="font-medium">{tenancy.propertyTitle}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Address</span>
              <p className="font-medium">{tenancy.propertyAddress}</p>
            </div>
            <Separator className="my-3" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Owner</span>
                <p className="font-medium">{tenancy.ownerName}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Partner</span>
                <p className="font-medium">{tenancy.tenantName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tenancy Period */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Tenancy Period
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Start Date</span>
              <p className="font-medium">
                {formatDate(terms.tenancyPeriod.startDate)}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">End Date</span>
              <p className="font-medium">
                {formatDate(terms.tenancyPeriod.endDate)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Duration</span>
              <p className="font-medium">
                {terms.tenancyPeriod.durationMonths} months
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Notice Period</span>
              <p className="font-medium">{terms.noticePeriodDays} days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Terms */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5" />
            Financial Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Monthly Rent</span>
            <span className="font-semibold">
              {formatCurrency(terms.financials.monthlyRent, terms.financials.currency)}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Security Deposit</span>
            <span className="font-medium">
              {formatCurrency(terms.financials.securityDeposit, terms.financials.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Utility Deposit</span>
            <span className="font-medium">
              {formatCurrency(terms.financials.utilityDeposit, terms.financials.currency)}
            </span>
          </div>
          {terms.financials.stampDuty && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Stamp Duty</span>
              <span className="font-medium">
                {formatCurrency(terms.financials.stampDuty, terms.financials.currency)}
              </span>
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-medium">Total Deposits</span>
            <span className="font-semibold text-primary">
              {formatCurrency(
                terms.financials.securityDeposit +
                  terms.financials.utilityDeposit +
                  (terms.financials.stampDuty ?? 0),
                terms.financials.currency
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Special Terms */}
      {(terms.specialClauses?.length ||
        terms.renewalTerms ||
        terms.petPolicy ||
        terms.maintenanceResponsibilities) && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ScrollText className="h-5 w-5" />
              Additional Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {terms.renewalTerms && (
              <div>
                <span className="text-sm font-medium">Renewal Terms</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {terms.renewalTerms}
                </p>
              </div>
            )}
            {terms.petPolicy && (
              <div>
                <span className="text-sm font-medium">Pet Policy</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {terms.petPolicy}
                </p>
              </div>
            )}
            {terms.specialClauses && terms.specialClauses.length > 0 && (
              <div>
                <span className="text-sm font-medium">Special Clauses</span>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {terms.specialClauses.map((clause, i) => (
                    <li key={i}>{clause}</li>
                  ))}
                </ul>
              </div>
            )}
            {terms.maintenanceResponsibilities && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="text-sm font-medium">Owner Responsibilities</span>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {terms.maintenanceResponsibilities.owner.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-sm font-medium">Partner Responsibilities</span>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {terms.maintenanceResponsibilities.tenant.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function ContractViewerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>

      {/* Action Bar */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-5 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="aspect-[8.5/11] w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
