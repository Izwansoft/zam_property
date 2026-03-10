import { generateMeta } from "@/lib/utils";
import { PlatformCreateUserContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Create User - Platform Admin",
    description: "Create platform and partner users with RBAC roles",
    canonical: "/dashboard/platform/users/create",
  });
}

export default function PlatformCreateUserPage() {
  return <PlatformCreateUserContent />;
}
