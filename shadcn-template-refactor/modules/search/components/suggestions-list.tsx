// =============================================================================
// SuggestionsList — Autocomplete dropdown for SearchInput
// =============================================================================

"use client";

import { MapPin } from "lucide-react";

import type { Suggestion } from "../types";
import { formatCurrency } from "../utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SuggestionsListProps {
  id: string;
  suggestions: Suggestion[];
  isLoading: boolean;
  activeIndex: number;
  onSelect: (suggestion: Suggestion) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SuggestionsList({
  id,
  suggestions,
  isLoading,
  activeIndex,
  onSelect,
}: SuggestionsListProps) {
  if (isLoading) {
    return (
      <div
        id={id}
        role="listbox"
        className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md"
      >
        <div className="flex items-center justify-center py-4">
          <span className="text-sm text-muted-foreground">
            Loading suggestions...
          </span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div
        id={id}
        role="listbox"
        className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md"
      >
        <div className="flex items-center justify-center py-4">
          <span className="text-sm text-muted-foreground">
            No suggestions found
          </span>
        </div>
      </div>
    );
  }

  return (
    <ul
      id={id}
      role="listbox"
      className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md"
    >
      {suggestions.map((suggestion, index) => (
        <li
          key={suggestion.id}
          role="option"
          aria-selected={index === activeIndex}
          className="cursor-pointer"
        >
          <button
            type="button"
            onClick={() => onSelect(suggestion)}
            className={`flex w-full items-center justify-between px-4 py-3 text-left hover:bg-accent focus:bg-accent focus:outline-none ${
              index === activeIndex ? "bg-accent" : ""
            }`}
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{suggestion.title}</p>
              {suggestion.city && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {suggestion.city}
                </p>
              )}
            </div>
            <span className="ml-3 shrink-0 text-sm font-medium text-primary">
              {formatCurrency(suggestion.price)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
