// =============================================================================
// LegalCaseDetail — Case detail view with timeline, documents, lawyer, actions
// =============================================================================

"use client";

import { useMemo } from "react";
import {
  Scale,
  FileText,
  Download,
  User2,
  Building2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  MapPin,
  Tag,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import type { LegalCase, LegalDocument } from "../types";
import {
  LegalCaseStatus,
  LegalCaseReason,
  LegalDocumentType,
  LEGAL_CASE_STATUS_CONFIG,
  LEGAL_CASE_REASON_CONFIG,
  LEGAL_DOCUMENT_TYPE_CONFIG,
  formatLegalAmount,
  getLegalStatusOrder,
  isCourtPhase,
  isTerminalLegalStatus,
} from "../types";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Status Badge for legal case */
function LegalStatusBadge({ status }: { status: LegalCaseStatus }) {
  const config = LEGAL_CASE_STATUS_CONFIG[status];
  if (!config) return <Badge variant="outline">{status}</Badge>;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Case Header
// ---------------------------------------------------------------------------

function CaseHeader({ legalCase }: { legalCase: LegalCase }) {
  const reasonConfig =
    LEGAL_CASE_REASON_CONFIG[legalCase.reason as LegalCaseReason];
  const ReasonIcon = reasonConfig?.icon ?? Scale;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{legalCase.caseNumber}</h2>
              <LegalStatusBadge status={legalCase.status} />
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              {legalCase.description}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <ReasonIcon className="h-3.5 w-3.5" />
                {reasonConfig?.label ?? legalCase.reason}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Filed {new Date(legalCase.createdAt).toLocaleDateString("en-MY", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Amount Owed
            </p>
            <p className="text-2xl font-bold text-destructive">
              {formatLegalAmount(legalCase.amountOwed)}
            </p>
            {legalCase.settlementAmount != null && (
              <p className="text-sm text-muted-foreground">
                Settlement: {formatLegalAmount(legalCase.settlementAmount)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Case Timeline
// ---------------------------------------------------------------------------

function CaseTimeline({ legalCase }: { legalCase: LegalCase }) {
  const statusOrder = getLegalStatusOrder();
  const currentIndex = statusOrder.indexOf(legalCase.status);

  // Build timeline events from case data
  const timelineEvents = useMemo(() => {
    const events: { status: LegalCaseStatus; date: string | null; isActive: boolean; isPast: boolean }[] = [];

    statusOrder.forEach((status, idx) => {
      let date: string | null = null;

      switch (status) {
        case LegalCaseStatus.NOTICE_SENT:
          date = legalCase.noticeDate ?? legalCase.createdAt;
          break;
        case LegalCaseStatus.HEARING_SCHEDULED:
          date = legalCase.courtDate ?? null;
          break;
        case LegalCaseStatus.JUDGMENT:
          date = legalCase.judgmentDate ?? null;
          break;
        case LegalCaseStatus.CLOSED:
          date = legalCase.resolvedAt ?? null;
          break;
        default:
          date = null;
      }

      events.push({
        status,
        date,
        isActive: idx === currentIndex,
        isPast: idx < currentIndex,
      });
    });

    return events;
  }, [legalCase, statusOrder, currentIndex]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Case Timeline
        </CardTitle>
        <CardDescription>Progress through legal stages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {timelineEvents.map((event, idx) => {
            const config = LEGAL_CASE_STATUS_CONFIG[event.status];
            const Icon = config.icon;
            const isLast = idx === timelineEvents.length - 1;

            return (
              <div key={event.status} className="flex gap-3 pb-6 last:pb-0">
                {/* Timeline dot & line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                      event.isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : event.isPast
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-muted bg-background text-muted-foreground"
                    }`}
                  >
                    {event.isPast ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 min-h-[24px] ${
                        event.isPast ? "bg-primary/50" : "bg-muted"
                      }`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="pt-1 pb-2 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      event.isActive
                        ? "text-foreground"
                        : event.isPast
                          ? "text-foreground/80"
                          : "text-muted-foreground"
                    }`}
                  >
                    {config.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {config.description}
                  </p>
                  {event.date && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(event.date).toLocaleDateString("en-MY", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Key Dates
// ---------------------------------------------------------------------------

function KeyDates({ legalCase }: { legalCase: LegalCase }) {
  const dates: { label: string; value: string | null | undefined; variant?: string }[] = [
    { label: "Notice Date", value: legalCase.noticeDate },
    { label: "Notice Deadline", value: legalCase.noticeDeadline },
    { label: "Court Date", value: legalCase.courtDate, variant: "destructive" },
    { label: "Judgment Date", value: legalCase.judgmentDate },
    { label: "Resolved", value: legalCase.resolvedAt },
  ];

  const activeDates = dates.filter((d) => d.value);

  if (activeDates.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Key Dates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeDates.map((d) => (
          <div key={d.label} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{d.label}</span>
            <span
              className={`text-sm font-medium ${
                d.variant === "destructive" ? "text-destructive" : ""
              }`}
            >
              {new Date(d.value!).toLocaleDateString("en-MY", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Assigned Lawyer
// ---------------------------------------------------------------------------

function AssignedLawyer({ legalCase }: { legalCase: LegalCase }) {
  if (!legalCase.lawyer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Assigned Lawyer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <User2 className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              No lawyer has been assigned yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              A panel lawyer will be assigned by the partner admin
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const lawyer = legalCase.lawyer;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Assigned Lawyer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{lawyer.name}</p>
            {lawyer.firm && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {lawyer.firm}
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <a
              href={`mailto:${lawyer.email}`}
              className="text-primary hover:underline truncate"
            >
              {lawyer.email}
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            <a
              href={`tel:${lawyer.phone}`}
              className="text-primary hover:underline"
            >
              {lawyer.phone}
            </a>
          </div>
          {lawyer.specialization.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <Tag className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {lawyer.specialization.map((s) => (
                  <Badge key={s} variant="outline" className="text-[10px]">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Tenancy Info
// ---------------------------------------------------------------------------

function TenancyInfo({ legalCase }: { legalCase: LegalCase }) {
  if (!legalCase.tenancy) return null;
  const tenancy = legalCase.tenancy;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Tenancy Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tenancy.listing && (
          <div>
            <p className="text-xs text-muted-foreground">Property</p>
            <p className="text-sm font-medium">{tenancy.listing.title}</p>
          </div>
        )}
        {tenancy.tenant && (
          <div>
            <p className="text-xs text-muted-foreground">Tenant</p>
            <p className="text-sm font-medium">{tenancy.tenant.name}</p>
            {tenancy.tenant.email && (
              <p className="text-xs text-muted-foreground">
                {tenancy.tenant.email}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Document List
// ---------------------------------------------------------------------------

function DocumentList({ documents }: { documents: LegalDocument[] }) {
  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              No documents attached yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Documents ({documents.length})
        </CardTitle>
        <CardDescription>Case-related documents and notices</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.map((doc) => {
            const typeConfig =
              LEGAL_DOCUMENT_TYPE_CONFIG[doc.type as LegalDocumentType];
            const DocIcon = typeConfig?.icon ?? FileText;

            return (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                    <DocIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">
                        {typeConfig?.label ?? doc.type}
                      </Badge>
                      <span>
                        {new Date(doc.createdAt).toLocaleDateString("en-MY", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {doc.generatedBy && (
                        <span className="capitalize">
                          ({doc.generatedBy})
                        </span>
                      )}
                    </div>
                    {doc.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {doc.notes}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0" asChild>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={doc.fileName}
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download {doc.title}</span>
                  </a>
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Resolution Summary
// ---------------------------------------------------------------------------

function ResolutionSummary({ legalCase }: { legalCase: LegalCase }) {
  if (!isTerminalLegalStatus(legalCase.status) && !legalCase.resolvedAt) {
    return null;
  }

  return (
    <Card className="border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          Resolution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {legalCase.resolution && (
          <div>
            <p className="text-xs text-muted-foreground">Resolution</p>
            <p className="text-sm">{legalCase.resolution}</p>
          </div>
        )}
        {legalCase.settlementAmount != null && (
          <div>
            <p className="text-xs text-muted-foreground">Settlement Amount</p>
            <p className="text-sm font-medium">
              {formatLegalAmount(legalCase.settlementAmount)}
            </p>
          </div>
        )}
        {legalCase.resolvedAt && (
          <div>
            <p className="text-xs text-muted-foreground">Resolved On</p>
            <p className="text-sm">
              {new Date(legalCase.resolvedAt).toLocaleDateString("en-MY", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

function CaseNotes({ notes }: { notes: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {notes}
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function LegalCaseDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-4">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-3 w-16 ml-auto" />
              <Skeleton className="h-8 w-28 ml-auto" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2-column skeleton */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function LegalCaseDetail({ legalCase }: { legalCase: LegalCase }) {
  return (
    <div className="space-y-6">
      {/* Case Header */}
      <CaseHeader legalCase={legalCase} />

      {/* Resolution banner (if resolved) */}
      <ResolutionSummary legalCase={legalCase} />

      {/* 2-column layout: Main + Sidebar */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Column */}
        <div className="md:col-span-2 space-y-6">
          <CaseTimeline legalCase={legalCase} />
          <DocumentList documents={legalCase.documents ?? []} />
          {legalCase.notes && <CaseNotes notes={legalCase.notes} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AssignedLawyer legalCase={legalCase} />
          <KeyDates legalCase={legalCase} />
          <TenancyInfo legalCase={legalCase} />
        </div>
      </div>
    </div>
  );
}
