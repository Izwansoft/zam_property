import { ClaimDetailSkeleton } from "@/modules/claim/components/claim-detail";

export default function TenantClaimDetailLoading() {
  return (
    <div className="p-4 md:p-6">
      <ClaimDetailSkeleton />
    </div>
  );
}
