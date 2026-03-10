import { generateMeta } from "@/lib/utils";
import { SecurityContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Security - Zam Property",
    description: "Manage your account security settings",
    canonical: "/dashboard/account/security",
  });
}

export default function SecurityPage() {
  return <SecurityContent />;
}
