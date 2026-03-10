// =============================================================================
// CompareButton — Add / remove a listing from comparison tray
// =============================================================================

"use client";

import { Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import {
  useComparisonStore,
  type ComparisonItem,
} from "../store/comparison-store";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CompareButtonProps {
  item: ComparisonItem;
  /** Show label text (default false — icon only) */
  showLabel?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CompareButton({
  item,
  showLabel = false,
}: CompareButtonProps) {

  const { addItem, removeItem, isInComparison, items, maxItems } =
    useComparisonStore();

  const isAdded = isInComparison(item.id);
  const isFull = items.length >= maxItems;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdded) {
      removeItem(item.id);
      showSuccess("Removed from comparison");
      return;
    }

    const ok = addItem(item);
    if (ok) {
      showSuccess("Added to comparison", {
        description: `${items.length + 1}/${maxItems} listings selected.`,
      });
    } else {
      showError("Comparison full", {
        description: `You can compare up to ${maxItems} listings. Remove one first.`,
      });
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isAdded ? "secondary" : "outline"}
          size={showLabel ? "sm" : "icon"}
          className={showLabel ? "gap-1.5" : "h-8 w-8"}
          onClick={handleClick}
          disabled={!isAdded && isFull}
        >
          <Scale className="h-4 w-4" />
          {showLabel && (isAdded ? "Comparing" : "Compare")}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isAdded
          ? "Remove from comparison"
          : isFull
            ? `Comparison full (${maxItems} max)`
            : "Add to comparison"}
      </TooltipContent>
    </Tooltip>
  );
}
