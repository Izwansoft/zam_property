// =============================================================================
// SearchSortSelect — Sort dropdown for search results
// =============================================================================

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { SEARCH_SORT_OPTIONS } from "../types";
import type { SearchSort } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SearchSortSelectProps {
  value: SearchSort;
  onChange: (sort: SearchSort) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchSortSelect({ value, onChange }: SearchSortSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SearchSort)}>
      <SelectTrigger className="w-44" aria-label="Sort results">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {SEARCH_SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
