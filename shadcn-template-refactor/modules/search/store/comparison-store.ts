// =============================================================================
// Property Comparison Store — Zustand + localStorage persistence
// =============================================================================
// Allows users to add listings to a comparison tray (max 4).
// Persists selections across page navigations via localStorage.
// =============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal listing data needed for comparison */
export interface ComparisonItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  primaryImageUrl?: string;
  verticalType: string;
  location: {
    city?: string;
    state?: string;
  };
  attributes: Record<string, unknown>;
  vendor?: {
    name: string;
  };
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface ComparisonStore {
  /** Items in the comparison tray */
  items: ComparisonItem[];
  /** Maximum comparison slots */
  maxItems: number;

  // Actions
  /** Add a listing to compare (returns false if full) */
  addItem: (item: ComparisonItem) => boolean;
  /** Remove a listing by ID */
  removeItem: (id: string) => void;
  /** Check if a listing is already in comparison */
  isInComparison: (id: string) => boolean;
  /** Clear all items */
  clearAll: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const MAX_COMPARISON_ITEMS = 4;

export const useComparisonStore = create<ComparisonStore>()(
  persist(
    (set, get) => ({
      items: [],
      maxItems: MAX_COMPARISON_ITEMS,

      addItem: (item) => {
        const state = get();
        if (state.items.length >= state.maxItems) return false;
        if (state.items.some((i) => i.id === item.id)) return false;

        set((s) => ({ items: [...s.items, item] }));
        return true;
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      isInComparison: (id) => {
        return get().items.some((i) => i.id === id);
      },

      clearAll: () => {
        set({ items: [] });
      },
    }),
    {
      name: "zam-comparison",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
    },
  ),
);
