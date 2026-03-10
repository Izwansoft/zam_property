// =============================================================================
// useSearchKeyboard — Keyboard navigation for autocomplete list
// =============================================================================

"use client";

import { useCallback, useEffect, useState } from "react";

import type { Suggestion } from "../types";

export function useSearchKeyboard(
  suggestions: Suggestion[],
  onSelect: (suggestion: Suggestion) => void,
) {
  const [activeIndex, setActiveIndex] = useState(-1);

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          if (activeIndex >= 0 && suggestions[activeIndex]) {
            e.preventDefault();
            onSelect(suggestions[activeIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setActiveIndex(-1);
          break;
      }
    },
    [suggestions, activeIndex, onSelect],
  );

  return { activeIndex, handleKeyDown, setActiveIndex };
}
