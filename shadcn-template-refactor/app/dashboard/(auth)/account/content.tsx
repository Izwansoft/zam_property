// =============================================================================
// Account Dashboard — Client content component
// =============================================================================

"use client";

import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { AccountDashboard } from "@/modules/account/components/account-dashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AccountDashboardContent() {
  const searchParams = useSearchParams();
  const vendorApplicationStatus = searchParams.get("vendorApplication");

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Account"
        description="Manage your profile, saved listings, and inquiries."
      />

      {vendorApplicationStatus === "submitted" && (
        <Alert>
          <AlertTitle>Vendor application submitted</AlertTitle>
          <AlertDescription>
            Your registration has been submitted successfully and is currently under review. We will notify you once it is approved.
          </AlertDescription>
        </Alert>
      )}

      <AccountDashboard />
    </div>
  );
}
