import { generateMeta } from "@/lib/utils";

export function generateMetadata() {
  return generateMeta({
    title: "User Detail - Platform Admin",
    description: "View and manage user details",
    canonical: "/dashboard/platform/users",
  });
}

export default function PlatformUserDetailPage() {
  return <PlatformUserDetailContent />;
}

// Separate import to avoid SSR issues with 'use client' components
import { PlatformUserDetailContent } from "./content";
