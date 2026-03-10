// =============================================================================
// Saved Searches — Client content component
// =============================================================================

"use client";

import { PageHeader } from "@/components/common/page-header";
import { SavedSearchesList } from "@/modules/search/components/saved-searches-list";

export function SavedSearchesContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Searches"
        description="Manage your saved search criteria and notification alerts."
        breadcrumbOverrides={[
          { segment: "account", label: "My Account" },
          { segment: "saved-searches", label: "Saved Searches" },
        ]}
      />

      <SavedSearchesList />
    </div>
  );
}
