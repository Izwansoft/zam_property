import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "Maintenance Detail - Tenant Portal",
    description: "View maintenance ticket status, timeline, photos, and comments",
    canonical: "/dashboard/tenant/maintenance",
  });
}

export default function MaintenanceDetailPage() {
  return <MaintenanceDetailContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { MaintenanceDetailContent } from "./content";
