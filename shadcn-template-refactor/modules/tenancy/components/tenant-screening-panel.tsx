// =============================================================================
// PartnerScreeningPanel — Display partner screening results for owners
// =============================================================================
// Shows partner screening information during the booking review phase.
// Includes credit score, income verification, references, and background check.
// =============================================================================

"use client";

import {
  UserCheck,
  CreditCard,
  Briefcase,
  Phone,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { TenancyStatus, type TenancyDetail } from "../types";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScreeningResult {
  category: string;
  status: "PASSED" | "FLAGGED" | "PENDING" | "NOT_AVAILABLE";
  score?: number;
  maxScore?: number;
  details?: string;
  verifiedAt?: string;
}

interface PartnerScreening {
  overallStatus: "APPROVED" | "FLAGGED" | "PENDING" | "REJECTED";
  overallScore: number;
  maxScore: number;
  creditCheck: ScreeningResult;
  incomeVerification: ScreeningResult;
  employmentVerification: ScreeningResult;
  rentalHistory: ScreeningResult;
  backgroundCheck: ScreeningResult;
  references: {
    total: number;
    verified: number;
    pending: number;
  };
  documents: {
    name: string;
    status: "VERIFIED" | "PENDING" | "REJECTED";
    uploadedAt: string;
  }[];
  notes?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusConfig(status: ScreeningResult["status"]) {
  switch (status) {
    case "PASSED":
      return {
        icon: CheckCircle2,
        color: "text-green-600",
        bgColor: "bg-green-100",
        label: "Passed",
      };
    case "FLAGGED":
      return {
        icon: AlertTriangle,
        color: "text-amber-600",
        bgColor: "bg-amber-100",
        label: "Flagged",
      };
    case "PENDING":
      return {
        icon: Clock,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        label: "Pending",
      };
    case "NOT_AVAILABLE":
      return {
        icon: XCircle,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        label: "N/A",
      };
  }
}

function getOverallStatusConfig(status: PartnerScreening["overallStatus"]) {
  switch (status) {
    case "APPROVED":
      return {
        variant: "success" as const,
        label: "Screening Approved",
        description: "All checks passed",
      };
    case "FLAGGED":
      return {
        variant: "warning" as const,
        label: "Review Needed",
        description: "Some items require attention",
      };
    case "PENDING":
      return {
        variant: "secondary" as const,
        label: "In Progress",
        description: "Screening checks ongoing",
      };
    case "REJECTED":
      return {
        variant: "destructive" as const,
        label: "Not Recommended",
        description: "Significant issues found",
      };
  }
}

// Mock screening data generator
function generateMockScreening(): PartnerScreening {
  return {
    overallStatus: "APPROVED",
    overallScore: 85,
    maxScore: 100,
    creditCheck: {
      category: "Credit Check",
      status: "PASSED",
      score: 720,
      maxScore: 850,
      details: "Good credit history with no defaults",
      verifiedAt: new Date().toISOString(),
    },
    incomeVerification: {
      category: "Income Verification",
      status: "PASSED",
      score: 90,
      maxScore: 100,
      details: "Monthly income 3.5x monthly rent",
      verifiedAt: new Date().toISOString(),
    },
    employmentVerification: {
      category: "Employment",
      status: "PASSED",
      score: 95,
      maxScore: 100,
      details: "Employed full-time for 3+ years",
      verifiedAt: new Date().toISOString(),
    },
    rentalHistory: {
      category: "Rental History",
      status: "PASSED",
      score: 80,
      maxScore: 100,
      details: "2 previous rentals, positive references",
      verifiedAt: new Date().toISOString(),
    },
    backgroundCheck: {
      category: "Background Check",
      status: "PASSED",
      score: 100,
      maxScore: 100,
      details: "No criminal records found",
      verifiedAt: new Date().toISOString(),
    },
    references: {
      total: 3,
      verified: 2,
      pending: 1,
    },
    documents: [
      { name: "IC/Passport", status: "VERIFIED", uploadedAt: new Date().toISOString() },
      { name: "Pay Slip (3 months)", status: "VERIFIED", uploadedAt: new Date().toISOString() },
      { name: "Bank Statement", status: "VERIFIED", uploadedAt: new Date().toISOString() },
      { name: "Employment Letter", status: "PENDING", uploadedAt: new Date().toISOString() },
    ],
    notes: "Applicant has a stable employment history and good references.",
  };
}

// ---------------------------------------------------------------------------
// Screening Item Component
// ---------------------------------------------------------------------------

interface ScreeningItemProps {
  result: ScreeningResult;
  icon: React.ComponentType<{ className?: string }>;
}

function ScreeningItem({ result, icon: Icon }: ScreeningItemProps) {
  const statusConfig = getStatusConfig(result.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className={`rounded-md p-2 ${statusConfig.bgColor}`}>
        <Icon className={`h-4 w-4 ${statusConfig.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm">{result.category}</span>
          <Badge
            variant={
              result.status === "PASSED"
                ? "success"
                : result.status === "FLAGGED"
                ? "warning"
                : "secondary"
            }
            className="text-xs"
          >
            <StatusIcon className="mr-1 h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
        {result.score !== undefined && result.maxScore !== undefined && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Score</span>
              <span>
                {result.score} / {result.maxScore}
              </span>
            </div>
            <Progress value={(result.score / result.maxScore) * 100} className="h-1.5" />
          </div>
        )}
        {result.details && (
          <p className="mt-2 text-xs text-muted-foreground">{result.details}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PartnerScreeningPanelProps {
  tenancy: TenancyDetail;
  /** Optional screening data (will use mock if not provided) */
  screening?: PartnerScreening;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PartnerScreeningPanel({
  tenancy,
  screening: providedScreening,
}: PartnerScreeningPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Only show during booking review phase
  if (tenancy.status !== TenancyStatus.PENDING_BOOKING) {
    return null;
  }

  // Use provided or mock data
  const screening = providedScreening || generateMockScreening();
  const overallConfig = getOverallStatusConfig(screening.overallStatus);

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Partner Screening</CardTitle>
                <CardDescription>{overallConfig.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={overallConfig.variant}
                className="h-7 px-3"
              >
                {overallConfig.label}
              </Badge>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* Overall score */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Screening Score</span>
              <span className="font-semibold">
                {screening.overallScore}/{screening.maxScore}
              </span>
            </div>
            <Progress
              value={(screening.overallScore / screening.maxScore) * 100}
              className="h-2"
            />
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Screening checks grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <ScreeningItem result={screening.creditCheck} icon={CreditCard} />
              <ScreeningItem result={screening.incomeVerification} icon={Briefcase} />
              <ScreeningItem result={screening.employmentVerification} icon={Briefcase} />
              <ScreeningItem result={screening.rentalHistory} icon={FileText} />
              <ScreeningItem result={screening.backgroundCheck} icon={Shield} />
            </div>

            {/* References summary */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">References</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{screening.references.verified} Verified</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>{screening.references.pending} Pending</span>
                </div>
                <div className="text-muted-foreground">
                  Total: {screening.references.total}
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-3">
              <span className="font-medium text-sm">Documents Submitted</span>
              <div className="grid gap-2">
                {screening.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                  >
                    <span>{doc.name}</span>
                    <Badge
                      variant={
                        doc.status === "VERIFIED"
                          ? "success"
                          : doc.status === "PENDING"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {screening.notes && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Screening Notes:</strong> {screening.notes}
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
