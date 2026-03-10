/**
 * Unit Tests — Company Registration Schema
 *
 * Validates Zod schemas for each step of the company registration wizard.
 *
 * @see modules/company/components/registration-wizard/registration-schema.ts
 */

import { describe, it, expect } from 'vitest';
import {
  companyDetailsSchema,
  adminDetailsSchema,
  documentsSchema,
  packageSelectionSchema,
} from '../components/registration-wizard/registration-schema';

// ---------------------------------------------------------------------------
// Step 1: Company Details
// ---------------------------------------------------------------------------

describe('companyDetailsSchema', () => {
  const validData = {
    companyName: 'Test Property Sdn Bhd',
    registrationNo: '202301012345',
    companyType: 'PROPERTY_COMPANY' as const,
    companyEmail: 'info@testproperty.com',
    companyPhone: '+60123456789',
    companyAddress: '123 Jalan Test, KL',
  };

  it('accepts valid company details', () => {
    const result = companyDetailsSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects empty company name', () => {
    const result = companyDetailsSchema.safeParse({
      ...validData,
      companyName: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects company name shorter than 2 characters', () => {
    const result = companyDetailsSchema.safeParse({
      ...validData,
      companyName: 'A',
    });
    expect(result.success).toBe(false);
  });

  it('rejects registration number shorter than 5 characters', () => {
    const result = companyDetailsSchema.safeParse({
      ...validData,
      registrationNo: '1234',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid company type', () => {
    const result = companyDetailsSchema.safeParse({
      ...validData,
      companyType: 'INVALID_TYPE',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid company types', () => {
    for (const type of [
      'PROPERTY_COMPANY',
      'MANAGEMENT_COMPANY',
      'AGENCY',
    ]) {
      const result = companyDetailsSchema.safeParse({
        ...validData,
        companyType: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid email', () => {
    const result = companyDetailsSchema.safeParse({
      ...validData,
      companyEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid phone number', () => {
    const result = companyDetailsSchema.safeParse({
      ...validData,
      companyPhone: '12',
    });
    expect(result.success).toBe(false);
  });

  it('allows empty address (optional)', () => {
    const result = companyDetailsSchema.safeParse({
      ...validData,
      companyAddress: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects address longer than 500 characters', () => {
    const result = companyDetailsSchema.safeParse({
      ...validData,
      companyAddress: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Step 2: Admin Details
// ---------------------------------------------------------------------------

describe('adminDetailsSchema', () => {
  const validData = {
    adminFullName: 'John Doe',
    adminEmail: 'john@company.com',
    adminPhone: '+60123456789',
    adminPassword: 'Password1',
    adminConfirmPassword: 'Password1',
  };

  it('accepts valid admin details', () => {
    const result = adminDetailsSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects empty admin name', () => {
    const result = adminDetailsSchema.safeParse({
      ...validData,
      adminFullName: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects name shorter than 3 characters', () => {
    const result = adminDetailsSchema.safeParse({
      ...validData,
      adminFullName: 'AB',
    });
    expect(result.success).toBe(false);
  });

  it('rejects weak password (no uppercase)', () => {
    const result = adminDetailsSchema.safeParse({
      ...validData,
      adminPassword: 'password1',
      adminConfirmPassword: 'password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects weak password (no number)', () => {
    const result = adminDetailsSchema.safeParse({
      ...validData,
      adminPassword: 'Passwordd',
      adminConfirmPassword: 'Passwordd',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = adminDetailsSchema.safeParse({
      ...validData,
      adminPassword: 'Pass1',
      adminConfirmPassword: 'Pass1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = adminDetailsSchema.safeParse({
      ...validData,
      adminPassword: 'Password1',
      adminConfirmPassword: 'Password2',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Step 3: Documents
// ---------------------------------------------------------------------------

describe('documentsSchema', () => {
  it('accepts valid SSM document URL', () => {
    const result = documentsSchema.safeParse({
      ssmDocumentUrl: 'https://s3.example.com/ssm.pdf',
      businessLicenseUrl: '',
    });
    expect(result.success).toBe(true);
  });

  it('accepts both documents', () => {
    const result = documentsSchema.safeParse({
      ssmDocumentUrl: 'https://s3.example.com/ssm.pdf',
      businessLicenseUrl: 'https://s3.example.com/license.pdf',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty SSM document (required)', () => {
    const result = documentsSchema.safeParse({
      ssmDocumentUrl: '',
      businessLicenseUrl: '',
    });
    expect(result.success).toBe(false);
  });

  it('allows empty business license (optional)', () => {
    const result = documentsSchema.safeParse({
      ssmDocumentUrl: 'https://s3.example.com/ssm.pdf',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Step 4: Package Selection
// ---------------------------------------------------------------------------

describe('packageSelectionSchema', () => {
  it('accepts valid plan selection', () => {
    const result = packageSelectionSchema.safeParse({
      selectedPlanId: 'plan-professional',
      billingCycle: 'monthly',
    });
    expect(result.success).toBe(true);
  });

  it('accepts yearly billing cycle', () => {
    const result = packageSelectionSchema.safeParse({
      selectedPlanId: 'plan-enterprise',
      billingCycle: 'yearly',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty plan selection', () => {
    const result = packageSelectionSchema.safeParse({
      selectedPlanId: '',
      billingCycle: 'monthly',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid billing cycle', () => {
    const result = packageSelectionSchema.safeParse({
      selectedPlanId: 'plan-starter',
      billingCycle: 'quarterly',
    });
    expect(result.success).toBe(false);
  });
});
