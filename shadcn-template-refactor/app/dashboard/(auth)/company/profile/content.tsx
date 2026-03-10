"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyProfileForm } from "@/modules/company/components/company-profile-form";
import { useCompanyContext } from "@/modules/company/hooks/useCompanyContext";

export function CompanyProfileContent() {
  const { company, isLoading, error } = useCompanyContext();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-destructive">Failed to load company</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="rounded-md border bg-muted/50 p-6 text-center">
        <h2 className="text-lg font-semibold">Company not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You don&apos;t have a company assigned yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
        <p className="text-muted-foreground">
          Update your company information, bio, and public brand details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>
            Keep your company profile up to date for better trust and discoverability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyProfileForm companyId={company.id} />
        </CardContent>
      </Card>
    </div>
  );
}
