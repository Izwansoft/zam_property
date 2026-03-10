// =============================================================================
// Vertical Display Names — Human-readable labels for vertical type strings
// =============================================================================
// Centralised map so UI components never show raw SCREAMING_SNAKE_CASE strings.
// =============================================================================

/**
 * Maps vertical type keys (SCREAMING_SNAKE_CASE) to human-readable labels.
 * Add new verticals here as they become available.
 */
export const VERTICAL_DISPLAY_NAMES: Record<string, string> = {
  REAL_ESTATE: "Real Estate",
  AUTOMOTIVE: "Automotive",
  JOBS: "Jobs",
  SERVICES: "Services",
  ELECTRONICS: "Electronics",
};

/**
 * Get the display name for a vertical type, falling back to a formatted version
 * of the raw key (e.g. "REAL_ESTATE" → "Real Estate").
 */
export function getVerticalDisplayName(type: string): string {
  if (VERTICAL_DISPLAY_NAMES[type]) {
    return VERTICAL_DISPLAY_NAMES[type];
  }
  // Fallback: SCREAMING_SNAKE → Title Case
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
