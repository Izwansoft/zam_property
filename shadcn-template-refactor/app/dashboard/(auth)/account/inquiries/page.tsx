import { generateMeta } from "@/lib/utils";
import { InquiriesContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "My Inquiries - Zam Property",
    description: "View your sent inquiries and their status",
    canonical: "/dashboard/account/inquiries",
  });
}

export default function InquiriesPage() {
  return <InquiriesContent />;
}
