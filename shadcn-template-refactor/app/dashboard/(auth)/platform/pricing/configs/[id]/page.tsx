import { generateMeta } from "@/lib/utils";
import { PricingConfigDetailContent } from "./content";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateMetadata() {
  return generateMeta({
    title: "Pricing Config Detail - Platform Admin",
    description: "View and edit pricing configuration details and associated rules",
    canonical: "/dashboard/platform/pricing/configs",
  });
}

export default async function PricingConfigDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <PricingConfigDetailContent configId={id} />;
}
