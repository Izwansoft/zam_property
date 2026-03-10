// =============================================================================
// ComparisonBar — Sticky floating bar showing comparison tray
// =============================================================================
// Appears at the bottom when items are in the comparison store.
// Shows thumbnails, count, and link to comparison page.
// =============================================================================

"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Scale, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  useComparisonStore,
  MAX_COMPARISON_ITEMS,
} from "../store/comparison-store";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ComparisonBar() {
  const { items, removeItem, clearAll } = useComparisonStore();

  if (items.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 shadow-lg backdrop-blur-sm print:hidden">
      <div className="container mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        {/* Label */}
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">
            Compare
          </span>
          <Badge variant="secondary" className="text-xs">
            {items.length}/{MAX_COMPARISON_ITEMS}
          </Badge>
        </div>

        {/* Item thumbnails */}
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative flex shrink-0 items-center gap-2 rounded-lg border bg-card px-3 py-1.5"
            >
              {item.primaryImageUrl && (
                <div className="relative h-8 w-8 overflow-hidden rounded">
                  <Image
                    src={item.primaryImageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
              )}
              <span className="max-w-[120px] truncate text-xs font-medium">
                {item.title}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Remove ${item.title} from comparison`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: MAX_COMPARISON_ITEMS - items.length }).map(
            (_, i) => (
              <div
                key={`empty-${i}`}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed text-muted-foreground"
              >
                <span className="text-xs">+</span>
              </div>
            ),
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear
          </Button>
          <Button asChild size="sm" disabled={items.length < 2}>
            <Link href="/compare">
              Compare
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
