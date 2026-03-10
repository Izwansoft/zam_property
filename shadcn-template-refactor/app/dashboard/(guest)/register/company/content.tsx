"use client";

import dynamic from "next/dynamic";
import { CompanyRegistrationWizardSkeleton } from "@/modules/company/components/registration-wizard";

const CompanyRegistrationWizard = dynamic(
  () =>
    import("@/modules/company/components/registration-wizard").then(
      (mod) => mod.CompanyRegistrationWizard
    ),
  {
    ssr: false,
    loading: () => <CompanyRegistrationWizardSkeleton />,
  }
);

export function CompanyRegistrationContent() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">
              Company Registration
            </h1>
            <p className="text-muted-foreground">
              Register your property company to get started with Zam Property
            </p>
          </div>
        </div>
      </div>

      {/* Wizard */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <CompanyRegistrationWizard />
      </div>
    </div>
  );
}
