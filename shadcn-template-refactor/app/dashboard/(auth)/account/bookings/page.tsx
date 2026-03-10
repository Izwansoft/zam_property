import { generateMeta } from "@/lib/utils";
import { BookingsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "My Viewings - Zam Property",
    description: "Manage your property viewing appointments",
    canonical: "/dashboard/account/bookings",
  });
}

export default function BookingsPage() {
  return <BookingsContent />;
}
