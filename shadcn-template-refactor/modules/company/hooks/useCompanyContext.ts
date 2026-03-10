// =============================================================================
// useCompanyContext — Hook for current user's company context
// =============================================================================
// Provides company data for COMPANY_ADMIN users.
// Falls back to mock data if no company is assigned.
// =============================================================================

"use client";

import { useMemo } from "react";
import { useAuth } from "@/modules/auth";
import { useCompany } from "./useCompany";
import type { Company, CompanyType, CompanyStatus } from "../types";

// ---------------------------------------------------------------------------
// Mock company for development
// ---------------------------------------------------------------------------

const MOCK_COMPANY: Company = {
  id: "mock-company-001",
  partnerId: "mock-partner-001",
  name: "Demo Agency Sdn Bhd",
  registrationNo: "202301012345",
  type: "AGENCY" as CompanyType,
  email: "contact@demoagency.com",
  phone: "+60123456789",
  address: "Level 10, Menara KL, Jalan Bukit Bintang, 55100 Kuala Lumpur",
  businessLicense: null,
  ssmDocument: null,
  status: "ACTIVE" as CompanyStatus,
  verifiedAt: "2024-01-15T00:00:00Z",
  verifiedBy: "admin-001",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T00:00:00Z",
  verticalTypes: [],
  admins: [],
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseCompanyContextResult {
  company: Company | null;
  companyId: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to get the current user's company context.
 * For COMPANY_ADMIN users, fetches their assigned company.
 * 
 * @returns Company data, loading state, and error
 */
export function useCompanyContext(): UseCompanyContextResult {
  const { user } = useAuth();
  
  // Extract company ID from user's company admin relationships
  // In a real implementation, this would come from the auth context
  const companyId = useMemo(() => {
    if (!user) return null;
    
    // Check if user has a companyId in their profile
    // This would be populated from the auth endpoint
    const userRecord = user as unknown as { companyId?: string };
    const userCompanyId = userRecord?.companyId;
    
    // For development, use mock company ID
    if (process.env.NODE_ENV === "development" && !userCompanyId) {
      return MOCK_COMPANY.id;
    }
    
    return userCompanyId ?? null;
  }, [user]);
  
  // Fetch company data
  const { data: company, isLoading, error } = useCompany(companyId ?? undefined);
  
  // In development, return mock company if no real company is loaded
  const resolvedCompany = useMemo(() => {
    if (process.env.NODE_ENV === "development" && !company && !isLoading && companyId === MOCK_COMPANY.id) {
      return MOCK_COMPANY;
    }
    return company ?? null;
  }, [company, isLoading, companyId]);
  
  return {
    company: resolvedCompany,
    companyId,
    isLoading,
    error: error as Error | null,
  };
}
