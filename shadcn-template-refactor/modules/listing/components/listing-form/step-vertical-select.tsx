// =============================================================================
// Step 1: Vertical Type Selection
// =============================================================================
// The vertical type is IMMUTABLE after listing creation.
// When availableVerticals prop is provided (partner context), the selection
// is constrained to only the partner's enabled verticals. Otherwise falls
// back to the static VERTICAL_OPTIONS list.
// =============================================================================

"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Check } from "lucide-react";

import { VERTICAL_OPTIONS, type VerticalOption } from "./listing-form-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StepVerticalSelectProps {
  /** Currently selected vertical type */
  value: string;
  /** Called when user selects a vertical */
  onChange: (verticalType: string) => void;
  /** Whether the listing is already created (vertical becomes immutable) */
  isEdit: boolean;
  /** Validation error message */
  error?: string;
  /** Constrained options from partner's enabled verticals (optional) */
  availableVerticals?: VerticalOption[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepVerticalSelect({
  value,
  onChange,
  isEdit,
  error,
  availableVerticals,
}: StepVerticalSelectProps) {
  const options = availableVerticals ?? VERTICAL_OPTIONS;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Select Vertical Type</h2>
        <p className="text-muted-foreground text-sm">
          Choose the type of listing you want to create. This cannot be changed
          after the listing is saved.
        </p>
      </div>

      {isEdit && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="size-4 shrink-0" />
          <span>
            Vertical type cannot be changed for existing listings.
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option) => (
          <VerticalCard
            key={option.value}
            option={option}
            selected={value === option.value}
            disabled={isEdit}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}

      {!isEdit && options.length === 1 && (
        <p className="text-xs text-muted-foreground">
          More vertical types will be available as they are enabled by your
          partner administrator.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VerticalCard
// ---------------------------------------------------------------------------

function VerticalCard({
  option,
  selected,
  disabled,
  onClick,
}: {
  option: VerticalOption;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      role="radio"
      aria-checked={selected}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "relative cursor-pointer transition-all",
        selected && "border-primary ring-2 ring-primary/20",
        disabled && "cursor-not-allowed opacity-60",
        !disabled && !selected && "hover:border-primary/50 hover:shadow-sm",
      )}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <span className="text-3xl" aria-hidden="true">
          {option.icon}
        </span>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{option.label}</h3>
            {selected && (
              <Badge variant="default" className="text-xs">
                <Check className="mr-1 size-3" />
                Selected
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{option.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
