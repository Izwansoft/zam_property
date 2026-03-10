// =============================================================================
// Step 2: Core Fields — Title, description, price, location
// =============================================================================

"use client";

import { useFormContext } from "react-hook-form";

import {
  TextField,
  TextAreaField,
  NumberField,
  SelectField,
} from "@/components/forms/form-fields";
import { FormSection, FormGrid } from "@/components/forms/form-wrapper";

import { PRICE_TYPE_OPTIONS, MALAYSIAN_STATES } from "./listing-form-types";
import type { ListingFormValues } from "./listing-form-schema";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepCoreFields() {
  const form = useFormContext<ListingFormValues>();

  return (
    <div className="space-y-8">
      {/* Listing Information */}
      <FormSection
        title="Listing Information"
        description="Basic details about your listing."
      >
        <TextField<ListingFormValues>
          name="title"
          label="Title"
          placeholder="e.g. Spacious 3-Bedroom Condo in Mont Kiara"
          required
          maxLength={255}
        />

        <TextAreaField<ListingFormValues>
          name="description"
          label="Description"
          placeholder="Describe the property, its features, nearby amenities, and any special highlights..."
          rows={5}
          maxLength={5000}
          showCount
        />
      </FormSection>

      {/* Pricing */}
      <FormSection
        title="Pricing"
        description="Set the listing price and currency."
      >
        <FormGrid columns={2}>
          <NumberField<ListingFormValues>
            name="price"
            label="Price"
            placeholder="0"
            required
            min={0}
            step={1}
            prefix="RM"
          />

          <SelectField<ListingFormValues>
            name="priceType"
            label="Price Type"
            options={PRICE_TYPE_OPTIONS}
          />
        </FormGrid>
      </FormSection>

      {/* Location */}
      <FormSection
        title="Location"
        description="Where is the property located?"
      >
        <TextField<ListingFormValues>
          name="location.address"
          label="Street Address"
          placeholder="e.g. 12 Jalan Bukit Bintang"
        />

        <FormGrid columns={2}>
          <TextField<ListingFormValues>
            name="location.city"
            label="City"
            placeholder="e.g. Kuala Lumpur"
            required
          />

          <SelectField<ListingFormValues>
            name="location.state"
            label="State"
            placeholder="Select state..."
            options={MALAYSIAN_STATES}
            required
          />
        </FormGrid>

        <FormGrid columns={2}>
          <TextField<ListingFormValues>
            name="location.postalCode"
            label="Postal Code"
            placeholder="e.g. 50450"
          />

          <SelectField<ListingFormValues>
            name="location.country"
            label="Country"
            options={[{ value: "MY", label: "Malaysia" }]}
            disabled
          />
        </FormGrid>
      </FormSection>
    </div>
  );
}
