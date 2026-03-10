// =============================================================================
// Vertical Context Store — Zustand + sessionStorage persistence
// =============================================================================
// Stores the currently selected vertical filter for the Partner portal.
// "All Verticals" = null. Persists across page navigations.
// Includes validation to reset if the selected vertical is no longer valid
// (e.g. after partner switch).
// =============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface VerticalContextStore {
  /** Currently selected vertical type (null = "All Verticals") */
  selectedVertical: string | null;

  /** Set the selected vertical (null for all) */
  setSelectedVertical: (verticalType: string | null) => void;

  /** Reset to "All Verticals" */
  clearVertical: () => void;

  /**
   * Validate that selectedVertical is in the given list of available types.
   * If not, reset to null ("All Verticals").
   * Call this when partner verticals load or partner context changes.
   */
  ensureValidVertical: (availableTypes: string[]) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useVerticalContextStore = create<VerticalContextStore>()(
  persist(
    (set, get) => ({
      selectedVertical: null,

      setSelectedVertical: (verticalType) =>
        set({ selectedVertical: verticalType }),

      clearVertical: () => set({ selectedVertical: null }),

      ensureValidVertical: (availableTypes) => {
        const { selectedVertical } = get();
        if (
          selectedVertical !== null &&
          !availableTypes.includes(selectedVertical)
        ) {
          set({ selectedVertical: null });
        }
      },
    }),
    {
      name: "zam-vertical-context",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? sessionStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
    }
  )
);
