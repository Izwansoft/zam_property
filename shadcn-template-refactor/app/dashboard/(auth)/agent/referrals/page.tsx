import { generateMeta } from "@/lib/utils";
import { AgentReferralsContent } from "./content";

export function generateMetadata() {
  return generateMeta({
    title: "Referrals - Agent Portal",
    description: "Manage referral links and referral outcomes",
    canonical: "/dashboard/agent/referrals",
  });
}

export default function AgentReferralsPage() {
  return <AgentReferralsContent />;
}
