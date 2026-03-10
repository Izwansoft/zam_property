// =============================================================================
// HighlightedText — Renders OpenSearch highlight snippets safely
// =============================================================================

"use client";

import { useMemo } from "react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface HighlightedTextProps {
  /** Original text field */
  text?: string;
  /** Highlight snippets (contain <mark> tags from OpenSearch) */
  highlights?: string[];
  /** Fallback if both are empty */
  fallback: string;
  /** Optional className */
  className?: string;
}

// ---------------------------------------------------------------------------
// Sanitizer — only allow <mark> tags
// ---------------------------------------------------------------------------

function sanitizeHighlight(html: string): string {
  // Simple sanitizer: only keep <mark> and </mark>
  return html
    .replace(/<(?!\/?mark\b)[^>]*>/gi, "")
    .replace(/</g, (match, offset, str) => {
      // Allow <mark> and </mark>
      const upcoming = str.slice(offset, offset + 7);
      if (upcoming.startsWith("<mark>") || upcoming.startsWith("</mark>")) {
        return match;
      }
      return "&lt;";
    });
}

// Simpler approach: strip everything except <mark> tags
function safeSanitize(html: string): string {
  // Replace any tag that isn't <mark> or </mark>
  return html.replace(/<\/?(?!mark\b)[a-z][^>]*>/gi, "");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HighlightedText({
  text,
  highlights,
  fallback,
  className,
}: HighlightedTextProps) {
  const content = useMemo(() => {
    if (highlights && highlights.length > 0) {
      return safeSanitize(highlights.join("..."));
    }
    return text || fallback;
  }, [text, highlights, fallback]);

  // Render with dangerouslySetInnerHTML for <mark> tags
  if (highlights && highlights.length > 0) {
    return (
      <span
        dangerouslySetInnerHTML={{ __html: content }}
        className={`[&>mark]:rounded-sm [&>mark]:bg-yellow-200 [&>mark]:px-0.5 [&>mark]:text-yellow-900 dark:[&>mark]:bg-yellow-900/40 dark:[&>mark]:text-yellow-200 ${className || ""}`}
      />
    );
  }

  return <span className={className}>{content}</span>;
}
