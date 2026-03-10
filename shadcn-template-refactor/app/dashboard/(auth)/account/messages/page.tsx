import { generateMeta } from "@/lib/utils";
import { MessagesContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Messages - Zam Property",
    description: "View your conversations with agents and vendors",
    canonical: "/dashboard/account/messages",
  });
}

export default function MessagesPage() {
  return <MessagesContent />;
}
