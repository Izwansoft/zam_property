// =============================================================================
// UpgradePrompt — Informational upgrade CTA (no checkout)
// =============================================================================
// Shows a prompt to upgrade when limits are reached or higher features needed.
// Per Part-12: purely informational, no direct checkout, CTAs point to
// contact sales or view plan comparison only.
// =============================================================================

"use client";

import {
  ArrowUpRight,
  Mail,
  Sparkles,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UpgradePromptProps {
  /** Context: why upgrade is being suggested */
  reason?: "limit_reached" | "feature_locked" | "plan_comparison" | "general";
  /** The feature or limit that triggered this prompt */
  featureLabel?: string;
  /** Current plan name (for context) */
  currentPlan?: string;
  /** Handler for "View Plans" action */
  onViewPlans?: () => void;
  /** Handler for "Contact Sales" action */
  onContactSales?: () => void;
  /** Compact variant (smaller, inline) */
  variant?: "card" | "inline" | "banner";
  className?: string;
}

// ---------------------------------------------------------------------------
// Content by reason
// ---------------------------------------------------------------------------

function getPromptContent(
  reason: UpgradePromptProps["reason"],
  featureLabel?: string,
  currentPlan?: string
) {
  switch (reason) {
    case "limit_reached":
      return {
        title: "Limit Reached",
        description: featureLabel
          ? `You've reached your ${featureLabel} limit${currentPlan ? ` on the ${currentPlan} plan` : ""}. Upgrade to increase your limits.`
          : "You've reached a usage limit. Upgrade to increase your allowance.",
        icon: Sparkles,
      };
    case "feature_locked":
      return {
        title: "Feature Not Available",
        description: featureLabel
          ? `${featureLabel} is not included in your current plan. Upgrade to unlock this feature.`
          : "This feature is not included in your current plan.",
        icon: Sparkles,
      };
    case "plan_comparison":
      return {
        title: "Compare Plans",
        description: "View all available plans and find the best fit for your business needs.",
        icon: Sparkles,
      };
    default:
      return {
        title: "Upgrade Your Plan",
        description: "Get more features and higher limits for your growing business.",
        icon: Sparkles,
      };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UpgradePrompt({
  reason = "general",
  featureLabel,
  currentPlan,
  onViewPlans,
  onContactSales,
  variant = "card",
  className,
}: UpgradePromptProps) {
  const content = getPromptContent(reason, featureLabel, currentPlan);

  // ---- Banner variant ----
  if (variant === "banner") {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <content.icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{content.title}</p>
            <p className="text-xs text-muted-foreground">
              {content.description}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {onViewPlans && (
            <Button variant="outline" size="sm" onClick={onViewPlans}>
              <ArrowUpRight className="mr-1 h-3 w-3" />
              View Plans
            </Button>
          )}
          {onContactSales && (
            <Button variant="ghost" size="sm" onClick={onContactSales}>
              <Mail className="mr-1 h-3 w-3" />
              Contact Sales
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ---- Inline variant ----
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-md border bg-muted/30 px-4 py-3",
          className
        )}
      >
        <content.icon className="h-4 w-4 shrink-0 text-primary" />
        <p className="flex-1 text-sm text-muted-foreground">
          {content.description}
        </p>
        {onViewPlans && (
          <Button variant="link" size="sm" onClick={onViewPlans} className="h-auto p-0">
            View Plans
            <ArrowUpRight className="ml-0.5 h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  // ---- Card variant (default) ----
  return (
    <Card className={cn("border-primary/20 bg-gradient-to-br from-primary/5 to-transparent", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <content.icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{content.title}</CardTitle>
            <CardDescription>{content.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex gap-3">
        {onViewPlans && (
          <Button variant="default" size="sm" onClick={onViewPlans}>
            <ArrowUpRight className="mr-1.5 h-4 w-4" />
            View Plans
          </Button>
        )}
        {onContactSales && (
          <Button variant="outline" size="sm" onClick={onContactSales}>
            <Mail className="mr-1.5 h-4 w-4" />
            Contact Sales
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
