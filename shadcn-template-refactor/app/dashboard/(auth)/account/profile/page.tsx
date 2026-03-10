import { generateMeta } from "@/lib/utils";
import { ProfileContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "My Profile - Zam Property",
    description: "View and edit your profile information",
    canonical: "/dashboard/account/profile",
  });
}

export default function ProfilePage() {
  return <ProfileContent />;
}
