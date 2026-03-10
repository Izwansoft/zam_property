// =============================================================================
// Step 6: Confirmation — Review all data and submit for verification
// =============================================================================

"use client";

import {
  Building2,
  User,
  FileText,
  Package,
  CreditCard,
  CheckCircle,
  Clock,
  Shield,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useCompanyRegistrationStore } from "../../store/registration-store";
import { COMPANY_TYPE_CONFIG } from "../../types";
import type { CompanyType } from "../../types";

// ---------------------------------------------------------------------------
// Review section
// ---------------------------------------------------------------------------

interface ReviewSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function ReviewSection({ icon, title, children }: ReviewSectionProps) {
  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 font-medium">
        {icon}
        {title}
      </h4>
      <div className="rounded-lg border bg-muted/30 p-4">{children}</div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepConfirmation() {
  const { data } = useCompanyRegistrationStore();

  const typeConfig = data.companyType
    ? COMPANY_TYPE_CONFIG[data.companyType as CompanyType]
    : null;

  return (
    <div className="space-y-6">
      {/* Verification Notice */}
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <Clock className="size-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">
          Pending Verification
        </AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          After submission, your company registration will be reviewed by our
          team. This typically takes 1–2 business days. You will receive an
          email notification once verified.
        </AlertDescription>
      </Alert>

      {/* Review Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Registration Summary
          </CardTitle>
          <CardDescription>
            Please review your information before submitting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Details */}
          <ReviewSection
            icon={<Building2 className="size-4 text-primary" />}
            title="Company Details"
          >
            <ReviewRow label="Company Name" value={data.companyName} />
            <ReviewRow
              label="Registration No"
              value={data.registrationNo}
            />
            <ReviewRow
              label="Company Type"
              value={
                typeConfig ? (
                  <Badge variant="outline">{typeConfig.label}</Badge>
                ) : (
                  "—"
                )
              }
            />
            <ReviewRow label="Email" value={data.companyEmail} />
            <ReviewRow label="Phone" value={data.companyPhone} />
            {data.companyAddress && (
              <ReviewRow label="Address" value={data.companyAddress} />
            )}
          </ReviewSection>

          <Separator />

          {/* Admin Details */}
          <ReviewSection
            icon={<User className="size-4 text-primary" />}
            title="Admin Account"
          >
            <ReviewRow label="Full Name" value={data.adminFullName} />
            <ReviewRow label="Email" value={data.adminEmail} />
            <ReviewRow label="Phone" value={data.adminPhone} />
            <ReviewRow
              label="Password"
              value="••••••••"
            />
          </ReviewSection>

          <Separator />

          {/* Documents */}
          <ReviewSection
            icon={<FileText className="size-4 text-primary" />}
            title="Documents"
          >
            <ReviewRow
              label="SSM Certificate"
              value={
                data.ssmDocumentUrl ? (
                  <span className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle className="size-3.5" />
                    Uploaded
                  </span>
                ) : (
                  <span className="text-destructive">Not uploaded</span>
                )
              }
            />
            <ReviewRow
              label="Business License"
              value={
                data.businessLicenseUrl ? (
                  <span className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle className="size-3.5" />
                    Uploaded
                  </span>
                ) : (
                  <span className="text-muted-foreground">Not provided</span>
                )
              }
            />
          </ReviewSection>

          <Separator />

          {/* Package */}
          <ReviewSection
            icon={<Package className="size-4 text-primary" />}
            title="Subscription"
          >
            <ReviewRow
              label="Plan"
              value={
                <Badge variant="outline">
                  {data.selectedPlanId || "—"}
                </Badge>
              }
            />
            <ReviewRow
              label="Billing"
              value={
                data.billingCycle === "yearly"
                  ? "Annual"
                  : "Monthly"
              }
            />
          </ReviewSection>

          <Separator />

          {/* Payment */}
          <ReviewSection
            icon={<CreditCard className="size-4 text-primary" />}
            title="Payment"
          >
            <ReviewRow
              label="Status"
              value={
                data.paymentIntentId ? (
                  <span className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle className="size-3.5" />
                    Paid
                  </span>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )
              }
            />
            {data.paymentIntentId && (
              <ReviewRow
                label="Reference"
                value={
                  <span className="font-mono text-xs">
                    {data.paymentIntentId}
                  </span>
                }
              />
            )}
          </ReviewSection>
        </CardContent>
      </Card>
    </div>
  );
}
