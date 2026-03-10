// =============================================================================
// Step 3: Vertical Attributes
// =============================================================================
// Renders the vertical-specific attribute form based on selected vertical type.
// Currently supports: REAL_ESTATE via RealEstateAttributeForm.
// Falls back to the generic DynamicForm for unknown verticals.
// =============================================================================

"use client";

import { useFormContext } from "react-hook-form";
import { Puzzle, Info } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getVerticalLabel } from "../../utils";
import type { ListingFormValues } from "./listing-form-schema";
import { RealEstateAttributeForm } from "@/verticals/real-estate";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepAttributes() {
  const form = useFormContext<ListingFormValues>();
  const verticalType = form.watch("verticalType");

  // Render vertical-specific form when vertical is known
  if (verticalType === "REAL_ESTATE") {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Property Attributes</h2>
          <p className="text-sm text-muted-foreground">
            Fill in the property details below. Fields marked with{" "}
            <span className="text-destructive">*</span> are required for
            publishing.
          </p>
        </div>

        <RealEstateAttributeForm basePath="attributes" />
      </div>
    );
  }

  // Fallback: unsupported or no vertical selected
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Vertical Attributes</h2>
        <p className="text-sm text-muted-foreground">
          Specific fields for your listing type. These fields are determined by
          the selected vertical.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Puzzle className="size-8 text-muted-foreground" />
          </div>

          <h3 className="text-lg font-semibold">
            {getVerticalLabel(verticalType)} Attributes
          </h3>

          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline">{verticalType || "—"}</Badge>
            <Badge variant="secondary">Schema v1.0</Badge>
          </div>

          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            No attribute form is available for this vertical type yet. Please go
            back and select a supported vertical, or continue to the next step.
          </p>

          <div className="mt-6 flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-left text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Attribute forms are available for: Real Estate. More verticals
              will be added in the future.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
