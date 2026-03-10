// =============================================================================
// Tenant Onboarding Schema — Zod validation schemas for each step
// =============================================================================

import { z } from "zod";
import { TenantDocumentType } from "../../types";

// ---------------------------------------------------------------------------
// Phone validation helper
// ---------------------------------------------------------------------------

const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(
    /^(\+?6?0)?[0-9]{9,11}$/,
    "Please enter a valid Malaysian phone number"
  );

// ---------------------------------------------------------------------------
// Step 1: Personal Details Schema (Base — no refinement)
// ---------------------------------------------------------------------------

const personalDetailsBaseSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .min(3, "Name must be at least 3 characters"),
  icNumber: z.string().optional(),
  passportNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().min(1, "Nationality is required"),
  phone: phoneSchema,

  // Employment details
  employmentStatus: z.string().min(1, "Employment status is required"),
  employerName: z.string().optional(),
  employerAddress: z.string().optional(),
  jobTitle: z.string().optional(),
  monthlyIncome: z.string().optional(),
});

// With refinement for step validation
export const personalDetailsSchema = personalDetailsBaseSchema.refine(
  (data) => data.icNumber || data.passportNumber,
  {
    message: "Either IC Number or Passport Number is required",
    path: ["icNumber"],
  }
);

// ---------------------------------------------------------------------------
// Step 2: Documents Schema (Base — for merging)
// ---------------------------------------------------------------------------

const documentSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(TenantDocumentType),
  fileName: z.string(),
  fileUrl: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
});

const documentsBaseSchema = z.object({
  documents: z.array(documentSchema),
});

// With refinement for step validation
export const documentsSchema = z.object({
  documents: z
    .array(documentSchema)
    .min(1, "At least one document is required")
    .refine(
      (docs) => {
        // Check for IC_FRONT or PASSPORT
        const hasIdDoc = docs.some(
          (d) =>
            d.type === TenantDocumentType.IC_FRONT ||
            d.type === TenantDocumentType.PASSPORT
        );
        return hasIdDoc;
      },
      {
        message: "IC Front or Passport is required for verification",
      }
    ),
});

// ---------------------------------------------------------------------------
// Step 3: Emergency Contact Schema
// ---------------------------------------------------------------------------

export const emergencyContactSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone: phoneSchema,
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

const emergencyContactsBaseSchema = z.object({
  emergencyContacts: z.array(emergencyContactSchema),
});

export const emergencyContactsSchema = z.object({
  emergencyContacts: z
    .array(emergencyContactSchema)
    .min(1, "At least one emergency contact is required"),
});

// ---------------------------------------------------------------------------
// Full Form Schema (for final submission — using base schemas w/o refinements)
// ---------------------------------------------------------------------------

export const onboardingFormSchema = personalDetailsBaseSchema
  .merge(documentsBaseSchema)
  .merge(emergencyContactsBaseSchema)
  .refine(
    (data) => data.icNumber || data.passportNumber,
    {
      message: "Either IC Number or Passport Number is required",
      path: ["icNumber"],
    }
  )
  .refine(
    (data) => data.documents.length >= 1,
    {
      message: "At least one document is required",
      path: ["documents"],
    }
  )
  .refine(
    (data) => {
      const hasIdDoc = data.documents.some(
        (d) =>
          d.type === TenantDocumentType.IC_FRONT ||
          d.type === TenantDocumentType.PASSPORT
      );
      return hasIdDoc;
    },
    {
      message: "IC Front or Passport is required for verification",
      path: ["documents"],
    }
  )
  .refine(
    (data) => data.emergencyContacts.length >= 1,
    {
      message: "At least one emergency contact is required",
      path: ["emergencyContacts"],
    }
  );

export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;
export type PersonalDetailsValues = z.infer<typeof personalDetailsSchema>;
export type DocumentsValues = z.infer<typeof documentsSchema>;
export type EmergencyContactValues = z.infer<typeof emergencyContactSchema>;
export type EmergencyContactsFormValues = z.infer<typeof emergencyContactsSchema>;

// ---------------------------------------------------------------------------
// Per-step schema mapping
// ---------------------------------------------------------------------------

export const ONBOARDING_STEP_SCHEMAS: Record<
  number,
  z.ZodSchema | undefined
> = {
  1: personalDetailsSchema,
  2: documentsSchema,
  3: emergencyContactsSchema,
  4: undefined, // Review step - no validation
};
