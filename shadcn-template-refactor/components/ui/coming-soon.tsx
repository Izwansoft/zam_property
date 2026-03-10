// =============================================================================
// ComingSoon — Graceful placeholder for unimplemented features
// =============================================================================
// Used in pages that depend on backend endpoints not yet available.
// Shows a clean placeholder with optional feature description.
// =============================================================================

"use client";

import { Clock, Construction, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ComingSoonProps {
  /** Feature title */
  title: string;
  /** Feature description */
  description?: string;
  /** Icon variant */
  icon?: "clock" | "construction" | "sparkles";
  /** Additional CSS classes */
  className?: string;
  /** Whether this is a compact inline variant vs. full-page card */
  variant?: "card" | "inline";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const iconMap = {
  clock: Clock,
  construction: Construction,
  sparkles: Sparkles,
};

export function ComingSoon({
  title,
  description,
  icon = "construction",
  className = "",
  variant = "card",
}: ComingSoonProps) {
  const IconComponent = iconMap[icon];

  if (variant === "inline") {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg border border-dashed p-4 text-muted-foreground ${className}`}
      >
        <IconComponent className="h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground/70">{description}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`mx-auto max-w-md text-center ${className}`}>
      <CardHeader className="items-center">
        <div className="mb-2 rounded-full bg-muted p-3">
          <IconComponent className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This feature is under development and will be available soon.
        </p>
      </CardContent>
    </Card>
  );
}
