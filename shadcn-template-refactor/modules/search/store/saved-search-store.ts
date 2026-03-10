// =============================================================================
// Saved Searches Store — Zustand + localStorage persistence
// =============================================================================
// Allows users to save search criteria and optionally enable alerts.
// Persists to localStorage since no backend SavedSearch endpoint exists yet.
// =============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { SearchParams } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SavedSearch {
  /** Unique ID (timestamp-based) */
  id: string;
  /** User-supplied name */
  name: string;
  /** The search parameters at time of save */
  params: SearchParams;
  /** Optional: vertical type filter */
  verticalType?: string;
  /** When it was saved */
  createdAt: string;
  /** Whether to notify on new matches (future use) */
  notifyOnNew: boolean;
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface SavedSearchStore {
  /** All saved searches */
  searches: SavedSearch[];
  /** Maximum allowed saved searches */
  maxSearches: number;

  // Actions
  /** Save a new search */
  saveSearch: (name: string, params: SearchParams) => SavedSearch;
  /** Remove a saved search by ID */
  removeSearch: (id: string) => void;
  /** Toggle alert for a saved search */
  toggleAlert: (id: string) => void;
  /** Rename a saved search */
  renameSearch: (id: string, name: string) => void;
  /** Check if params match an existing saved search */
  isSearchSaved: (params: SearchParams) => boolean;
  /** Clear all saved searches */
  clearAll: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `ss_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Simple deep comparison for search params */
function paramsMatch(a: SearchParams, b: SearchParams): boolean {
  // Compare the key fields that define a unique search
  return (
    (a.q || "") === (b.q || "") &&
    (a.verticalType || "") === (b.verticalType || "") &&
    (a.city || "") === (b.city || "") &&
    (a.state || "") === (b.state || "") &&
    (a.priceMin ?? 0) === (b.priceMin ?? 0) &&
    (a.priceMax ?? 0) === (b.priceMax ?? 0) &&
    (a.sort || "relevance") === (b.sort || "relevance")
  );
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSavedSearchStore = create<SavedSearchStore>()(
  persist(
    (set, get) => ({
      searches: [],
      maxSearches: 20,

      saveSearch: (name, params) => {
        const newSearch: SavedSearch = {
          id: generateId(),
          name: name.trim() || "Untitled Search",
          params: { ...params },
          verticalType: params.verticalType,
          createdAt: new Date().toISOString(),
          notifyOnNew: false,
        };

        set((state) => ({
          searches: [newSearch, ...state.searches].slice(0, state.maxSearches),
        }));

        return newSearch;
      },

      removeSearch: (id) => {
        set((state) => ({
          searches: state.searches.filter((s) => s.id !== id),
        }));
      },

      toggleAlert: (id) => {
        set((state) => ({
          searches: state.searches.map((s) =>
            s.id === id ? { ...s, notifyOnNew: !s.notifyOnNew } : s,
          ),
        }));
      },

      renameSearch: (id, name) => {
        set((state) => ({
          searches: state.searches.map((s) =>
            s.id === id ? { ...s, name: name.trim() || s.name } : s,
          ),
        }));
      },

      isSearchSaved: (params) => {
        return get().searches.some((s) => paramsMatch(s.params, params));
      },

      clearAll: () => {
        set({ searches: [] });
      },
    }),
    {
      name: "zam-saved-searches",
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
