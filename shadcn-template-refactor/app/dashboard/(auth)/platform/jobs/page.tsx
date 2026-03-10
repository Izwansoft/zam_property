import { generateMeta } from "@/lib/utils";
import { PlatformJobsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Job Queue Dashboard - Platform Admin",
    description:
      "Monitor and manage background job queues, retry failed jobs, and trigger bulk operations",
    canonical: "/dashboard/platform/jobs",
  });
}

export default function PlatformJobsPage() {
  return <PlatformJobsContent />;
}
