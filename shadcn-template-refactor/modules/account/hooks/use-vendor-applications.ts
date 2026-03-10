"use client";

import { useApiQuery } from "@/hooks/use-api-query";

export type VendorApplicationApiStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export interface VendorMyApplication {
  vendorId: string;
  vendorName: string;
  vendorSlug?: string;
  verticalType?: string | null;
  vendorType: "INDIVIDUAL" | "COMPANY";
  status: VendorApplicationApiStatus;
  userVendorRole: string;
  isPrimary: boolean;
  linkedAt: string;
  updatedAt: string;
  rejectionReason?: string | null;
}

export function useVendorApplications() {
  return useApiQuery<VendorMyApplication[]>({
    queryKey: ["vendors", "me", "applications"],
    path: "/vendors/me/applications",
    staleTime: 60_000,
    retry: 1,
  });
}
