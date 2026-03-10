import { generateMeta } from "@/lib/utils";
import { AccountDashboardContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "My Account - Zam Property",
    description: "Customer account dashboard",
    canonical: "/dashboard/account",
  });
}

export default function AccountDashboardPage() {
  return <AccountDashboardContent />;
}
