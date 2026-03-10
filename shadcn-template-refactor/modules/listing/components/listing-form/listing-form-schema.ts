// =============================================================================
// Listing Form Schemas — Zod validation per step
// =============================================================================
// Step 1: Vertical selection (immutable after create)
// Step 2: Core fields (title, description, price, location)
// Step 3: Vertical attributes (placeholder — dynamic in Session 3.4)
// Step 4: Media (placeholder — Session 2.9)
// Step 5: Review (no validation — summary only)
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Step 1: Vertical Type
// ---------------------------------------------------------------------------

export const verticalStepSchema = z.object({
  verticalType: z
    .string()
    .min(1, "Please select a vertical type"),
  schemaVersion: z.string().default("1.0"),
});

export type VerticalStepValues = z.infer<typeof verticalStepSchema>;

// ---------------------------------------------------------------------------
// Step 2: Core Fields
// ---------------------------------------------------------------------------

export const coreFieldsStepSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be at most 255 characters")
    .transform((v) => v.trim()),
  description: z
    .string()
    .max(5000, "Description must be at most 5,000 characters")
    .transform((v) => v.trim())
    .optional()
    .or(z.literal("")),
  price: z.coerce
    .number({ invalid_type_error: "Price is required" })
    .min(0, "Price cannot be negative")
    .max(999_999_999.99, "Price is too large"),
  currency: z.string().default("MYR"),
  priceType: z.enum(["FIXED", "NEGOTIABLE", "STARTING_FROM", "UPON_REQUEST"]).default("FIXED"),
  location: z.object({
    address: z
      .string()
      .max(500, "Address must be at most 500 characters")
      .optional()
      .or(z.literal("")),
    city: z
      .string()
      .min(1, "City is required")
      .max(100, "City must be at most 100 characters")
      .transform((v) => v.trim()),
    state: z
      .string()
      .min(1, "State is required")
      .max(100, "State must be at most 100 characters"),
    country: z.string().default("MY"),
    postalCode: z
      .string()
      .max(10, "Postal code must be at most 10 characters")
      .optional()
      .or(z.literal("")),
  }),
});

export type CoreFieldsStepValues = z.infer<typeof coreFieldsStepSchema>;

// ---------------------------------------------------------------------------
// Step 3: Vertical Attributes (placeholder — schema-driven in Session 3.4)
// ---------------------------------------------------------------------------

export const attributesStepSchema = z.object({
  attributes: z.record(z.unknown()).default({}),
});

export type AttributesStepValues = z.infer<typeof attributesStepSchema>;

// ---------------------------------------------------------------------------
// Step 4: Media (placeholder — implemented in Session 2.9)
// ---------------------------------------------------------------------------

export const mediaStepSchema = z.object({
  mediaIds: z.array(z.string()).default([]),
});

export type MediaStepValues = z.infer<typeof mediaStepSchema>;

// ---------------------------------------------------------------------------
// Full listing form schema (for final submission)
// ---------------------------------------------------------------------------

export const listingFormSchema = verticalStepSchema
  .merge(coreFieldsStepSchema)
  .merge(attributesStepSchema)
  .merge(mediaStepSchema);

export type ListingFormValues = z.infer<typeof listingFormSchema>;
