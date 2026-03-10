// =============================================================================
// Company Registration Schema — Zod validation schemas for each step
// =============================================================================

import { z } from "zod";
import { CompanyType } from "../../types";

// ---------------------------------------------------------------------------
// Phone validation helper
// ---------------------------------------------------------------------------

const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(
    /^(\+?6?0)?[0-9]{8,15}$/,
    "Please enter a valid phone number"
  );

// ---------------------------------------------------------------------------
// Step 1: Company Details Schema
// ---------------------------------------------------------------------------

export const companyDetailsSchema = z.object({
  companyName: z
    .string()
    .min(1, "Company name is required")
    .min(2, "Company name must be at least 2 characters")
    .max(200, "Company name must be at most 200 characters"),
  registrationNo: z
    .string()
    .min(1, "Registration number is required")
    .min(5, "Registration number must be at least 5 characters")
    .max(50, "Registration number must be at most 50 characters"),
  companyType: z
    .nativeEnum(CompanyType, {
      errorMap: () => ({ message: "Please select a company type" }),
    }),
  companyEmail: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  companyPhone: phoneSchema,
  companyAddress: z
    .string()
    .max(500, "Address must be at most 500 characters")
    .optional()
    .or(z.literal("")),
});

// ---------------------------------------------------------------------------
// Step 2: Admin Details Schema
// ---------------------------------------------------------------------------

export const adminDetailsSchema = z
  .object({
    adminFullName: z
      .string()
      .min(1, "Full name is required")
      .min(3, "Name must be at least 3 characters"),
    adminEmail: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    adminPhone: phoneSchema,
    adminPassword: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain lowercase, uppercase, and number"
      ),
    adminConfirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.adminPassword === data.adminConfirmPassword, {
    message: "Passwords do not match",
    path: ["adminConfirmPassword"],
  });

// ---------------------------------------------------------------------------
// Step 3: Documents Schema
// ---------------------------------------------------------------------------

export const documentsSchema = z.object({
  ssmDocumentUrl: z
    .string()
    .min(1, "SSM document is required"),
  businessLicenseUrl: z.string().optional().or(z.literal("")),
});

// ---------------------------------------------------------------------------
// Step 4: Package Selection Schema
// ---------------------------------------------------------------------------

export const packageSelectionSchema = z.object({
  selectedPlanId: z.string().min(1, "Please select a subscription plan"),
  billingCycle: z.enum(["monthly", "yearly"]),
});

// ---------------------------------------------------------------------------
// Step 5: Payment Schema
// ---------------------------------------------------------------------------

export const paymentSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment is required"),
});

// ---------------------------------------------------------------------------
// Full Form Schema (for final step / review)
// ---------------------------------------------------------------------------

export const registrationFormSchema = z
  .object({
    companyName: z.string().min(2).max(200),
    registrationNo: z.string().min(5).max(50),
    companyType: z.nativeEnum(CompanyType),
    companyEmail: z.string().email(),
    companyPhone: phoneSchema,
    companyAddress: z.string().max(500).optional().or(z.literal("")),

    adminFullName: z.string().min(3),
    adminEmail: z.string().email(),
    adminPhone: phoneSchema,
    adminPassword: z.string().min(8),
    adminConfirmPassword: z.string(),

    ssmDocumentUrl: z.string().min(1),
    businessLicenseUrl: z.string().optional().or(z.literal("")),

    selectedPlanId: z.string().min(1),
    billingCycle: z.enum(["monthly", "yearly"]),

    paymentIntentId: z.string().optional().or(z.literal("")),
  })
  .refine((data) => data.adminPassword === data.adminConfirmPassword, {
    message: "Passwords do not match",
    path: ["adminConfirmPassword"],
  });

export type RegistrationFormValues = z.infer<typeof registrationFormSchema>;
export type CompanyDetailsValues = z.infer<typeof companyDetailsSchema>;
export type AdminDetailsValues = z.infer<typeof adminDetailsSchema>;
export type DocumentsValues = z.infer<typeof documentsSchema>;
export type PackageSelectionValues = z.infer<typeof packageSelectionSchema>;
export type PaymentValues = z.infer<typeof paymentSchema>;

// ---------------------------------------------------------------------------
// Per-step schema mapping
// ---------------------------------------------------------------------------

export const REGISTRATION_STEP_SCHEMAS: Record<
  number,
  z.ZodSchema | undefined
> = {
  1: companyDetailsSchema,
  2: adminDetailsSchema,
  3: documentsSchema,
  4: packageSelectionSchema,
  5: undefined, // Payment step — handled by payment dialog
  6: undefined, // Confirmation step — no validation
};
