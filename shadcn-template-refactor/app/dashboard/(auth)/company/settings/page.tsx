// =============================================================================
// Company Settings — Page component
// =============================================================================

import type { Metadata } from "next";
import { CompanySettingsContent } from "./content";

export const metadata: Metadata = {
  title: "Company Settings",
  description: "Manage your company profile, branding, and settings",
};

export default function CompanySettingsPage() {
  return <CompanySettingsContent />;
}
