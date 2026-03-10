import { LegalCaseDetailSkeleton } from "@/modules/legal/components/legal-case-detail";

export default function VendorLegalDetailLoading() {
  return (
    <div className="p-4 md:p-6">
      <LegalCaseDetailSkeleton />
    </div>
  );
}
