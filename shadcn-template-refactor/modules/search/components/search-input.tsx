// =============================================================================
// SearchInput — Search bar with autocomplete dropdown & keyboard navigation
// =============================================================================

"use client";

import { useState, useRef, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAutocomplete } from "../hooks/use-autocomplete";
import { useSearchKeyboard } from "../hooks/use-search-keyboard";
import { SuggestionsList } from "./suggestions-list";
import type { Suggestion } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SearchInputProps {
  /** Current text value */
  value: string;
  /** Called on every keystroke */
  onChange: (value: string) => void;
  /** Called when user submits (Enter / button click) */
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Size variant */
  size?: "default" | "lg";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "Search listings...",
  className,
  size = "default",
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autocomplete data
  const { data: suggestions, isLoading: suggestionsLoading } = useAutocomplete(
    value,
    isFocused && value.length >= 2,
  );

  // Keyboard navigation
  const handleSuggestionSelect = useCallback(
    (suggestion: Suggestion) => {
      onChange(suggestion.title);
      onSearch(suggestion.title);
      setIsFocused(false);
    },
    [onChange, onSearch],
  );

  const { activeIndex, handleKeyDown } = useSearchKeyboard(
    suggestions || [],
    handleSuggestionSelect,
  );

  // Form submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(value);
      setIsFocused(false);
      inputRef.current?.blur();
    },
    [value, onSearch],
  );

  // Clear
  const handleClear = useCallback(() => {
    onChange("");
    onSearch("");
    inputRef.current?.focus();
  }, [onChange, onSearch]);

  const showSuggestions =
    isFocused &&
    value.length >= 2 &&
    (suggestions?.length || suggestionsLoading);

  const isLarge = size === "lg";

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <div className="relative">
        <Search
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
            isLarge ? "h-5 w-5" : "h-4 w-4",
          )}
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "pr-24",
            isLarge ? "h-12 pl-11 text-base" : "pl-10",
          )}
          aria-label="Search listings"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={!!showSuggestions}
          role="combobox"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {suggestionsLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {value && !suggestionsLoading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              aria-label="Clear search"
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button type="submit" size={isLarge ? "default" : "sm"}>
            Search
          </Button>
        </div>
      </div>

      {showSuggestions && (
        <SuggestionsList
          id="search-suggestions"
          suggestions={suggestions || []}
          isLoading={suggestionsLoading}
          activeIndex={activeIndex}
          onSelect={handleSuggestionSelect}
        />
      )}
    </form>
  );
}
