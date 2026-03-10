import { z } from 'zod';

// ---------------------------------------------------------------------------
// Reusable Zod schema patterns for Zam-Property forms
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be at most 255 characters')
  .transform((v) => v.toLowerCase().trim());

// ---------------------------------------------------------------------------
// Phone (Malaysian format: +60XXXXXXXXX or 01XXXXXXXX)
// ---------------------------------------------------------------------------

export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    /^(\+?6?0[1-9]\d{7,9})$/,
    'Please enter a valid Malaysian phone number (e.g. 0123456789)',
  )
  .transform((v) => v.replace(/\s+/g, ''));

export const optionalPhoneSchema = z
  .string()
  .regex(
    /^(\+?6?0[1-9]\d{7,9})?$/,
    'Please enter a valid Malaysian phone number',
  )
  .transform((v) => v.replace(/\s+/g, '') || undefined)
  .optional();

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  );

/** Simple password field for login (no strength requirements) */
export const loginPasswordSchema = z
  .string()
  .min(1, 'Password is required');

// ---------------------------------------------------------------------------
// Price (MYR — Malaysian Ringgit)
// ---------------------------------------------------------------------------

export const priceSchema = z
  .number({ invalid_type_error: 'Price is required' })
  .min(0, 'Price cannot be negative')
  .max(999_999_999.99, 'Price is too large')
  .multipleOf(0.01, 'Price can have at most 2 decimal places');

export const optionalPriceSchema = z
  .number()
  .min(0, 'Price cannot be negative')
  .max(999_999_999.99, 'Price is too large')
  .multipleOf(0.01, 'Price can have at most 2 decimal places')
  .optional();

// ---------------------------------------------------------------------------
// Common field schemas
// ---------------------------------------------------------------------------

/** Standard required text (trimmed, 1-255 chars) */
export const requiredStringSchema = (label = 'This field') =>
  z
    .string()
    .min(1, `${label} is required`)
    .max(255, `${label} must be at most 255 characters`)
    .transform((v) => v.trim());

/** Optional text (trimmed, max 255 chars) */
export const optionalStringSchema = (maxLength = 255) =>
  z
    .string()
    .max(maxLength, `Must be at most ${maxLength} characters`)
    .transform((v) => v.trim() || undefined)
    .optional();

/** Long text / description (trimmed, 1-5000 chars) */
export const descriptionSchema = (label = 'Description') =>
  z
    .string()
    .min(1, `${label} is required`)
    .max(5000, `${label} must be at most 5,000 characters`)
    .transform((v) => v.trim());

/** Optional long text */
export const optionalDescriptionSchema = (maxLength = 5000) =>
  z
    .string()
    .max(maxLength, `Must be at most ${maxLength} characters`)
    .transform((v) => v.trim() || undefined)
    .optional();

// ---------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------

export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .max(2048, 'URL is too long');

export const optionalUrlSchema = z
  .string()
  .url('Please enter a valid URL')
  .max(2048, 'URL is too long')
  .or(z.literal(''))
  .transform((v) => v || undefined)
  .optional();

// ---------------------------------------------------------------------------
// Numeric ranges
// ---------------------------------------------------------------------------

export const positiveIntSchema = (label = 'Value') =>
  z
    .number({ invalid_type_error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .positive(`${label} must be greater than 0`);

export const nonNegativeIntSchema = (label = 'Value') =>
  z
    .number({ invalid_type_error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(0, `${label} cannot be negative`);

// ---------------------------------------------------------------------------
// Date
// ---------------------------------------------------------------------------

export const dateSchema = z
  .string()
  .datetime({ message: 'Please enter a valid date' });

export const optionalDateSchema = z
  .string()
  .datetime({ message: 'Please enter a valid date' })
  .optional();

// ---------------------------------------------------------------------------
// UUID
// ---------------------------------------------------------------------------

export const uuidSchema = z.string().uuid('Invalid ID format');

// ---------------------------------------------------------------------------
// Enum helper — create a Zod enum from a string array with a custom message
// ---------------------------------------------------------------------------

export function enumSchema<T extends [string, ...string[]]>(
  values: T,
  label = 'Selection',
) {
  return z.enum(values, {
    errorMap: () => ({ message: `Please select a valid ${label.toLowerCase()}` }),
  });
}

// ---------------------------------------------------------------------------
// Confirm password pattern
// ---------------------------------------------------------------------------

export function confirmPasswordSchema(passwordField = 'password') {
  return z
    .object({
      [passwordField]: passwordSchema,
      confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine(
      (data) =>
        data[passwordField] === data.confirmPassword,
      {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      },
    );
}

// ---------------------------------------------------------------------------
// Pagination params (for URL-driven list filters)
// ---------------------------------------------------------------------------

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// ---------------------------------------------------------------------------
// Sort params
// ---------------------------------------------------------------------------

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
