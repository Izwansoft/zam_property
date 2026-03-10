// =============================================================================
// Step 4: Review & Submit — Read-only summary before submission
// =============================================================================

"use client";

import { useFormContext } from "react-hook-form";
import {
  Building2,
  User,
  Mail,
  Phone,
  FileText,
  MapPin,
  Hash,
  FileUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { VENDOR_TYPE_OPTIONS } from "./onboarding-schema";
import { PROFILE_MODEL_OPTIONS } from "./onboarding-schema";
import type { OnboardingFormValues } from "./onboarding-schema";

// ---------------------------------------------------------------------------
// Helper — vendor type icon
// ---------------------------------------------------------------------------

const VENDOR_TYPE_ICONS: Record<string, React.ReactNode> = {
  INDIVIDUAL: <User className="size-4" />,
  COMPANY: <Building2 className="size-4" />,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepReview() {
  const form = useFormContext<OnboardingFormValues>();
  const values = form.getValues();

  const vendorTypeOption = VENDOR_TYPE_OPTIONS.find(
    (o) => o.value === values.type,
  );
  const profileModelOption = PROFILE_MODEL_OPTIONS.find(
    (o) => o.value === values.profileModel,
  );

  const addressParts = [
    values.address?.line1,
    values.address?.line2,
    values.address?.city,
    values.address?.state,
    values.address?.postalCode,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Review & Submit</h2>
        <p className="text-sm text-muted-foreground">
          Please review your information below. Once submitted, your application
          will be reviewed by the platform admin.
        </p>
      </div>

      {/* Basic Info */}
      <ReviewCard
        icon={VENDOR_TYPE_ICONS[values.type] ?? <User className="size-4" />}
        title="Basic Information"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{values.name || "—"}</span>
            {profileModelOption && (
              <Badge variant="outline">{profileModelOption.label}</Badge>
            )}
            {vendorTypeOption && (
              <Badge variant="secondary">{vendorTypeOption.label}</Badge>
            )}
          </div>

          {values.profileModel === "AGENT_UNDER_COMPANY" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <ReviewItem
                label="Company"
                value={values.companyName || values.companyId || "—"}
              />
              <ReviewItem
                label="Existing Agent"
                value={values.agentName || values.agentId || "Not selected"}
              />
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <ReviewItem
              icon={<Mail className="size-3.5" />}
              label="Email"
              value={values.email || "—"}
            />
            <ReviewItem
              icon={<Phone className="size-3.5" />}
              label="Phone"
              value={values.phone || "—"}
            />
          </div>

          {values.description && (
            <ReviewItem
              icon={<FileText className="size-3.5" />}
              label="Description"
              value={values.description}
              multiline
            />
          )}
        </div>
      </ReviewCard>

      {/* Business Details */}
      <ReviewCard
        icon={<Hash className="size-4" />}
        title="Business Details"
      >
        <div className="space-y-3">
          <ReviewItem
            icon={<Hash className="size-3.5" />}
            label="Registration Number"
            value={values.registrationNumber || "—"}
          />
          <ReviewItem
            icon={<MapPin className="size-3.5" />}
            label="Address"
            value={
              addressParts.length > 0 ? addressParts.join(", ") : "—"
            }
          />
        </div>
      </ReviewCard>

      {/* Documents */}
      <ReviewCard
        icon={<FileUp className="size-4" />}
        title="Documents"
      >
        {values.documentNames && values.documentNames.length > 0 ? (
          <p className="text-sm">
            {values.documentNames.length} document
            {values.documentNames.length !== 1 ? "s" : ""} attached
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No documents uploaded. You can add documents after onboarding.
          </p>
        )}
      </ReviewCard>

      <Separator />

      {/* What happens next */}
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">What happens next?</strong>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Your vendor application will be submitted with a{" "}
            <Badge variant="outline" className="mx-0.5 text-xs">
              Pending
            </Badge>{" "}
            status.
          </li>
          <li>
            The platform administrator will review your application and
            supporting documents.
          </li>
          <li>
            You will be notified once your application has been approved or if
            additional information is needed.
          </li>
          <li>
            After approval, you can start creating property listings and
            managing your vendor profile.
          </li>
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReviewCard
// ---------------------------------------------------------------------------

function ReviewCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ReviewItem
// ---------------------------------------------------------------------------

function ReviewItem({
  icon,
  label,
  value,
  multiline,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className={multiline ? "space-y-1" : "flex items-center gap-2"}>
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}:
      </span>
      <span
        className={
          multiline
            ? "text-sm leading-relaxed whitespace-pre-wrap"
            : "text-sm"
        }
      >
        {value}
      </span>
    </div>
  );
}
