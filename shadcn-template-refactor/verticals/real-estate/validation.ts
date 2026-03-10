// verticals/real-estate/validation.ts — Zod validation schemas for Real Estate
// Provides draft, publish, and cross-field validation.

import { z } from "zod";
import {
  PROPERTY_TYPES,
  LISTING_TYPES,
  TENURE_TYPES,
  FURNISHING_TYPES,
  FACING_TYPES,
  CONDITION_TYPES,
  RENTAL_PERIOD_TYPES,
  FACILITY_OPTIONS,
  AMENITY_OPTIONS,
  RESIDENTIAL_PROPERTY_TYPES,
  TITLE_TYPES,
  OCCUPANCY_TYPES,
} from "./types";

// ---------------------------------------------------------------------------
// Base schema — shared shape (all optional except core)
// ---------------------------------------------------------------------------

const baseSchema = z.object({
  propertyType: z.enum(PROPERTY_TYPES),
  listingType: z.enum(LISTING_TYPES),
  tenure: z.enum(TENURE_TYPES).optional(),
  builtUpSize: z.number().min(1).max(1_000_000).optional(),
  landSize: z.number().min(1).max(10_000_000).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  carParks: z.number().int().min(0).max(10).optional(),
  furnishing: z.enum(FURNISHING_TYPES).optional(),
  facing: z.enum(FACING_TYPES).optional(),
  floorLevel: z.string().max(20).optional(),
  totalFloors: z.number().int().min(1).max(200).optional(),
  facilities: z.array(z.enum(FACILITY_OPTIONS)).optional(),
  nearbyAmenities: z.array(z.enum(AMENITY_OPTIONS)).optional(),
  yearBuilt: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 5)
    .optional(),
  condition: z.enum(CONDITION_TYPES).optional(),
  titleType: z.enum(TITLE_TYPES).optional(),
  occupancy: z.enum(OCCUPANCY_TYPES).optional(),
  maintenanceFee: z.number().min(0).max(100_000).optional(),
  projectName: z.string().max(100).optional(),
  developerName: z.string().max(100).optional(),
  minimumRentalPeriod: z.enum(RENTAL_PERIOD_TYPES).optional(),
  rentalDeposit: z.string().max(50).optional(),
  referenceId: z.string().max(50).optional(),
});

// ---------------------------------------------------------------------------
// Draft schema — minimal: propertyType + listingType required
// ---------------------------------------------------------------------------

export const realEstateDraftSchema = baseSchema;

// ---------------------------------------------------------------------------
// Publish schema — enforces requiredForPublish + cross-field rules
// ---------------------------------------------------------------------------

export const realEstatePublishSchema = baseSchema
  .extend({
    builtUpSize: z
      .number({ required_error: "Built-up size is required to publish" })
      .min(1, "Must be at least 1 sq ft")
      .max(1_000_000),
    bedrooms: z
      .number({ required_error: "Bedrooms is required to publish" })
      .int()
      .min(0)
      .max(20),
    bathrooms: z
      .number({ required_error: "Bathrooms is required to publish" })
      .int()
      .min(0)
      .max(20),
  })
  // Cross-field: bedrooms required for residential properties
  .refine(
    (data) => {
      if (
        RESIDENTIAL_PROPERTY_TYPES.includes(data.propertyType) &&
        (data.bedrooms === undefined || data.bedrooms === null)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Bedrooms is required for residential properties",
      path: ["bedrooms"],
    }
  )
  // Cross-field: landSize required for land type
  .refine(
    (data) => {
      if (data.propertyType === "land") {
        return data.landSize !== undefined && data.landSize !== null;
      }
      return true;
    },
    {
      message: "Land size is required for land listings",
      path: ["landSize"],
    }
  )
  // Cross-field: builtUpSize not needed for land listings — make optional again
  .refine(
    (data) => {
      if (data.propertyType === "land") {
        // builtUpSize is not relevant for land — skip validation
        return true;
      }
      return (
        data.builtUpSize !== undefined &&
        data.builtUpSize !== null &&
        data.builtUpSize >= 1
      );
    },
    {
      message: "Built-up size is required to publish",
      path: ["builtUpSize"],
    }
  );

// ---------------------------------------------------------------------------
// Combined attributes schema — used for general validation (draft mode default)
// ---------------------------------------------------------------------------

export const realEstateAttributesSchema = baseSchema
  .refine(
    (data) => {
      if (
        RESIDENTIAL_PROPERTY_TYPES.includes(data.propertyType) &&
        data.bedrooms === undefined
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Bedrooms is required for residential properties",
      path: ["bedrooms"],
    }
  )
  .refine(
    (data) => {
      if (data.propertyType === "land" && data.landSize === undefined) {
        return false;
      }
      return true;
    },
    {
      message: "Land size is required for land listings",
      path: ["landSize"],
    }
  );

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type RealEstateDraftValues = z.infer<typeof realEstateDraftSchema>;
export type RealEstatePublishValues = z.infer<typeof realEstatePublishSchema>;
export type RealEstateAttributeValues = z.infer<
  typeof realEstateAttributesSchema
>;
