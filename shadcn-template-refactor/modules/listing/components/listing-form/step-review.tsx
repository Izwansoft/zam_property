// =============================================================================
// Step 5: Review — Summary before saving as draft
// =============================================================================

"use client";

import { useFormContext } from "react-hook-form";
import {
  MapPin,
  DollarSign,
  Tag,
  FileText,
  Layers,
  ImageIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { getVerticalLabel, formatPrice } from "../../utils";
import { PRICE_TYPE_OPTIONS } from "./listing-form-types";
import type { ListingFormValues } from "./listing-form-schema";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepReview() {
  const form = useFormContext<ListingFormValues>();
  const values = form.getValues();

  const priceTypeLabel =
    PRICE_TYPE_OPTIONS.find((o) => o.value === values.priceType)?.label ??
    values.priceType;

  const locationParts = [
    values.location?.address,
    values.location?.city,
    values.location?.state,
    values.location?.postalCode,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Review Your Listing</h2>
        <p className="text-sm text-muted-foreground">
          Review the information below before saving. Your listing will be saved
          as a <strong>Draft</strong> — you can publish it later when ready.
        </p>
      </div>

      {/* Vertical */}
      <ReviewCard
        icon={<Layers className="size-4" />}
        title="Vertical Type"
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {getVerticalLabel(values.verticalType)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Schema v{values.schemaVersion}
          </span>
        </div>
      </ReviewCard>

      {/* Listing Info */}
      <ReviewCard
        icon={<FileText className="size-4" />}
        title="Listing Information"
      >
        <div className="space-y-3">
          <ReviewItem label="Title" value={values.title || "—"} />
          {values.description && (
            <ReviewItem
              label="Description"
              value={values.description}
              multiline
            />
          )}
        </div>
      </ReviewCard>

      {/* Pricing */}
      <ReviewCard
        icon={<DollarSign className="size-4" />}
        title="Pricing"
      >
        <div className="flex flex-wrap items-center gap-4">
          <ReviewItem
            label="Price"
            value={
              values.price !== undefined
                ? formatPrice(values.price, values.currency)
                : "—"
            }
          />
          <ReviewItem label="Type" value={priceTypeLabel} />
        </div>
      </ReviewCard>

      {/* Location */}
      <ReviewCard
        icon={<MapPin className="size-4" />}
        title="Location"
      >
        <p className="text-sm">
          {locationParts.length > 0 ? locationParts.join(", ") : "—"}
        </p>
      </ReviewCard>

      {/* Attributes */}
      <ReviewCard
        icon={<Tag className="size-4" />}
        title="Attributes"
      >
        {Object.keys(values.attributes ?? {}).length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(values.attributes).map(([key, val]) => (
              <ReviewItem
                key={key}
                label={key}
                value={val != null ? String(val) : "—"}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No attributes specified. You can add them after saving.
          </p>
        )}
      </ReviewCard>

      {/* Media */}
      <ReviewCard
        icon={<ImageIcon className="size-4" />}
        title="Media"
      >
        {values.mediaIds.length > 0 ? (
          <p className="text-sm">
            {values.mediaIds.length} file{values.mediaIds.length !== 1 ? "s" : ""} attached
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No media attached. You can upload media after saving the draft.
          </p>
        )}
      </ReviewCard>

      <Separator />

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">What happens next?</strong>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Your listing will be saved as a <strong>Draft</strong>.</li>
          <li>
            You can edit it, add media, and fill in attribute details at any
            time.
          </li>
          <li>
            When ready, publish the listing to make it visible to the public.
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
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className={multiline ? "mt-1 text-sm whitespace-pre-wrap" : "mt-0.5 text-sm"}>
        {value}
      </dd>
    </div>
  );
}
