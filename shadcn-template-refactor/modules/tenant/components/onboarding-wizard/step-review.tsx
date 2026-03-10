// =============================================================================
// Step 4: Review — Review all information before submission
// =============================================================================

"use client";

import { Check, FileText, User2 } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { useTenantOnboardingStore } from "../../store/onboarding-store";
import { TenantDocumentType } from "../../types";
import { EMPLOYMENT_STATUS_OPTIONS, RELATIONSHIP_OPTIONS } from "./onboarding-types";

// Document type labels
const DOCUMENT_TYPE_LABELS: Record<TenantDocumentType, string> = {
  [TenantDocumentType.IC_FRONT]: "IC Front",
  [TenantDocumentType.IC_BACK]: "IC Back",
  [TenantDocumentType.PASSPORT]: "Passport",
  [TenantDocumentType.EMPLOYMENT_LETTER]: "Employment Letter",
  [TenantDocumentType.PAYSLIP]: "Payslip",
  [TenantDocumentType.BANK_STATEMENT]: "Bank Statement",
  [TenantDocumentType.UTILITY_BILL]: "Utility Bill",
  [TenantDocumentType.REFERENCE_LETTER]: "Reference Letter",
  [TenantDocumentType.OTHER]: "Other",
};

export function StepReview() {
  const { data } = useTenantOnboardingStore();

  const employmentLabel =
    EMPLOYMENT_STATUS_OPTIONS.find((e) => e.value === data.employmentStatus)
      ?.label || data.employmentStatus;

  const hasIdDocument = data.documents.some(
    (d) =>
      d.type === TenantDocumentType.IC_FRONT ||
      d.type === TenantDocumentType.PASSPORT
  );

  const hasEmergencyContact = data.emergencyContacts.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="size-5" />
            Review Your Information
          </CardTitle>
          <CardDescription>
            Please review all the information below before submitting your
            onboarding application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Validation summary */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={data.fullName ? "default" : "destructive"}>
              {data.fullName ? "✓" : "✗"} Personal Info
            </Badge>
            <Badge variant={hasIdDocument ? "default" : "destructive"}>
              {hasIdDocument ? "✓" : "✗"} ID Document
            </Badge>
            <Badge variant={hasEmergencyContact ? "default" : "destructive"}>
              {hasEmergencyContact ? "✓" : "✗"} Emergency Contact
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Full Name" value={data.fullName} />
            <InfoRow
              label="IC Number"
              value={data.icNumber || "Not provided"}
            />
            <InfoRow
              label="Passport Number"
              value={data.passportNumber || "Not provided"}
            />
            <InfoRow
              label="Date of Birth"
              value={data.dateOfBirth || "Not provided"}
            />
            <InfoRow label="Nationality" value={data.nationality} />
            <InfoRow label="Phone" value={data.phone} />
          </div>

          <Separator />

          <h4 className="text-sm font-medium">Employment Information</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Status" value={employmentLabel} />
            {data.employerName && (
              <>
                <InfoRow label="Employer" value={data.employerName || "N/A"} />
                <InfoRow label="Job Title" value={data.jobTitle || "N/A"} />
                <InfoRow
                  label="Monthly Income"
                  value={
                    data.monthlyIncome ? `RM ${data.monthlyIncome}` : "N/A"
                  }
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4" />
            Uploaded Documents ({data.documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.documents.length > 0 ? (
            <ul className="space-y-2">
              {data.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Check className="size-4 text-green-500" />
                  <span className="font-medium">
                    {DOCUMENT_TYPE_LABELS[doc.type]}
                  </span>
                  <span className="text-muted-foreground">
                    — {doc.fileName}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No documents uploaded
            </p>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User2 className="size-4" />
            Emergency Contacts ({data.emergencyContacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.emergencyContacts.length > 0 ? (
            <div className="space-y-4">
              {data.emergencyContacts.map((contact, index) => {
                const relationshipLabel =
                  RELATIONSHIP_OPTIONS.find(
                    (r) => r.value === contact.relationship
                  )?.label || contact.relationship;

                return (
                  <div
                    key={index}
                    className="rounded-lg border bg-muted/30 p-3"
                  >
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {relationshipLabel}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {contact.phone}
                      {contact.email && ` • ${contact.email}`}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No emergency contacts added
            </p>
          )}
        </CardContent>
      </Card>

      {/* Submission notice */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm">
            By clicking <strong>Submit Application</strong>, you confirm that:
          </p>
          <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground space-y-1">
            <li>All information provided is accurate and truthful</li>
            <li>
              You consent to the verification of your documents and personal
              information
            </li>
            <li>
              You agree to be contacted at the phone number and email provided
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Info Row Component
// ---------------------------------------------------------------------------

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}
