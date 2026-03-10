// =============================================================================
// Vendor Onboarding Schemas — Zod validation per step
// =============================================================================
// Step 1: Basic Info (name, type, email, phone, description)
// Step 2: Business Details (registration number, address)
// Step 3: Documents (placeholder — file uploads)
// Step 4: Review & Submit (no validation — summary only)
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Malaysian states — shared with listing forms
// ---------------------------------------------------------------------------

export const MALAYSIAN_STATES = [
  { value: "Johor", label: "Johor" },
  { value: "Kedah", label: "Kedah" },
  { value: "Kelantan", label: "Kelantan" },
  { value: "Kuala Lumpur", label: "Kuala Lumpur" },
  { value: "Labuan", label: "Labuan" },
  { value: "Melaka", label: "Melaka" },
  { value: "Negeri Sembilan", label: "Negeri Sembilan" },
  { value: "Pahang", label: "Pahang" },
  { value: "Penang", label: "Penang" },
  { value: "Perak", label: "Perak" },
  { value: "Perlis", label: "Perlis" },
  { value: "Putrajaya", label: "Putrajaya" },
  { value: "Sabah", label: "Sabah" },
  { value: "Sarawak", label: "Sarawak" },
  { value: "Selangor", label: "Selangor" },
  { value: "Terengganu", label: "Terengganu" },
];

// ---------------------------------------------------------------------------
// Vendor type options
// ---------------------------------------------------------------------------

export const VENDOR_TYPE_OPTIONS = [
  {
    value: "INDIVIDUAL",
    label: "Individual",
    description: "Independent property negotiator or agent",
  },
  {
    value: "COMPANY",
    label: "Company",
    description: "Registered company, agency, or developer",
  },
] as const;

export const PROFILE_MODEL_OPTIONS = [
  {
    value: "COMPANY",
    label: "Company",
    description: "Agency or management company profile",
  },
  {
    value: "PROPERTY_OWNER",
    label: "Property Owner",
    description: "Individual owner/landlord profile",
  },
  {
    value: "INDIVIDUAL_AGENT",
    label: "Individual Agent",
    description: "Independent agent not linked to a company",
  },
  {
    value: "AGENT_UNDER_COMPANY",
    label: "Agent Under Company",
    description: "Agent profile associated with an existing company",
  },
] as const;

// ---------------------------------------------------------------------------
// Step 1: Basic Info
// ---------------------------------------------------------------------------

export const basicInfoSchema = z.object({
  profileModel: z.enum(
    ["COMPANY", "PROPERTY_OWNER", "INDIVIDUAL_AGENT", "AGENT_UNDER_COMPANY"],
    {
      required_error: "Please select your registration profile",
    },
  ),
  name: z
    .string()
    .min(1, "Business name is required")
    .max(255, "Name must be at most 255 characters")
    .transform((v) => v.trim()),
  type: z.enum(["INDIVIDUAL", "COMPANY"], {
    required_error: "Please select a vendor type",
  }),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^\+?[0-9\s-]{8,15}$/,
      "Please enter a valid phone number",
    ),
  description: z
    .string()
    .max(2000, "Description must be at most 2,000 characters")
    .transform((v) => v.trim())
    .optional()
    .or(z.literal("")),
  companyId: z.string().optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  agentId: z.string().optional().or(z.literal("")),
  agentName: z.string().optional().or(z.literal("")),
}).superRefine((values, ctx) => {
  if (values.profileModel === "AGENT_UNDER_COMPANY" && !values.companyId) {
    ctx.addIssue({
      path: ["companyId"],
      code: z.ZodIssueCode.custom,
      message: "Please select a company",
    });
  }
});

export type BasicInfoValues = z.infer<typeof basicInfoSchema>;

// ---------------------------------------------------------------------------
// Step 2: Business Details
// ---------------------------------------------------------------------------

export const businessDetailsSchema = z.object({
  registrationNumber: z
    .string()
    .min(1, "Registration number is required")
    .max(50, "Registration number must be at most 50 characters")
    .transform((v) => v.trim()),
  address: z.object({
    line1: z
      .string()
      .min(1, "Address line 1 is required")
      .max(255, "Address must be at most 255 characters")
      .transform((v) => v.trim()),
    line2: z
      .string()
      .max(255, "Address must be at most 255 characters")
      .transform((v) => v.trim())
      .optional()
      .or(z.literal("")),
    city: z
      .string()
      .min(1, "City is required")
      .max(100, "City must be at most 100 characters")
      .transform((v) => v.trim()),
    state: z
      .string()
      .min(1, "State is required"),
    postalCode: z
      .string()
      .min(1, "Postal code is required")
      .max(10, "Postal code must be at most 10 characters")
      .regex(/^[0-9]{5}$/, "Please enter a valid 5-digit postal code"),
    country: z.string().default("MY"),
  }),
});

export type BusinessDetailsValues = z.infer<typeof businessDetailsSchema>;

// ---------------------------------------------------------------------------
// Step 3: Documents (placeholder — file uploads to be implemented in Session 2.9)
// ---------------------------------------------------------------------------

export const documentsSchema = z.object({
  documentNames: z.array(z.string()).default([]),
});

export type DocumentsValues = z.infer<typeof documentsSchema>;

// ---------------------------------------------------------------------------
// Combined schema (full form)
// ---------------------------------------------------------------------------

export const onboardingFormSchema = basicInfoSchema
  .and(businessDetailsSchema)
  .and(documentsSchema);

export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

// ---------------------------------------------------------------------------
// Step schemas indexed by step number
// ---------------------------------------------------------------------------

export const ONBOARDING_STEP_SCHEMAS: Record<number, z.ZodType | null> = {
  1: basicInfoSchema,
  2: businessDetailsSchema,
  3: documentsSchema,
  4: null, // Review step — no validation
};
