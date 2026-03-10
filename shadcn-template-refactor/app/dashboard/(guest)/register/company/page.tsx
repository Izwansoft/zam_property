import { generateMeta } from "@/lib/utils";
import { CompanyRegistrationContent } from "./content";

export async function generateMetadata() {
  return generateMeta({
    title: "Company Registration",
    description:
      "Register your property company, management company, or agency to get started with Zam Property platform.",
    canonical: "/register/company",
  });
}

export default function CompanyRegistrationPage() {
  return <CompanyRegistrationContent />;
}
