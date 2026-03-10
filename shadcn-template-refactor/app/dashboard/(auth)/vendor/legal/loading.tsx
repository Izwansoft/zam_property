import { LegalCaseListSkeleton } from "@/modules/legal/components/legal-case-list";

export default function VendorLegalLoading() {
  return (
    <div className="p-4 md:p-6">
      <LegalCaseListSkeleton />
    </div>
  );
}
