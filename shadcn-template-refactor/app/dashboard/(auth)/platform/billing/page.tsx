import { generateMeta } from "@/lib/utils";
import { PlatformBillingContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Billing - Platform Admin",
    description:
      "Platform-wide billing overview across all partners",
    canonical: "/dashboard/platform/billing",
  });
}

export default function PlatformBillingPage() {
  return <PlatformBillingContent />;
}
