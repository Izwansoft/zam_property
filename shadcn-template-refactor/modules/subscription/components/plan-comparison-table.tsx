// =============================================================================
// PlanComparisonTable — Compare subscription plans side by side
// =============================================================================
// Displays all available plans with feature categories in a comparison grid.
// UI only; never computes billing. Shows what's included per plan.
// =============================================================================

"use client";

import { Fragment, useMemo } from "react";
import { Check, X, Crown } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { Plan, PlanEntitlements } from "../types";
import { PLAN_FEATURE_CATEGORIES } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PlanComparisonTableProps {
  plans: Plan[];
  currentPlanId?: string;
  isLoading?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCellValue(value: string | number | boolean): React.ReactNode {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-5 w-5 text-green-600 dark:text-green-400" />
    ) : (
      <X className="mx-auto h-5 w-5 text-muted-foreground/40" />
    );
  }
  if (typeof value === "number") {
    return value === 0 ? (
      <span className="text-muted-foreground">—</span>
    ) : (
      <span className="font-medium">{value.toLocaleString()}</span>
    );
  }
  return value === "—" ? (
    <span className="text-muted-foreground">—</span>
  ) : (
    <span className="font-medium">{value}</span>
  );
}

function formatPrice(price: string, currency: string): string {
  const num = parseFloat(price);
  if (isNaN(num)) return "—";
  return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function PlanComparisonTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlanComparisonTable({
  plans,
  currentPlanId,
  isLoading,
  className,
}: PlanComparisonTableProps) {
  // Sort plans by monthly price (ascending)
  const sortedPlans = useMemo(
    () =>
      [...plans].sort(
        (a, b) => parseFloat(a.priceMonthly) - parseFloat(b.priceMonthly)
      ),
    [plans]
  );

  if (isLoading) {
    return <PlanComparisonTableSkeleton />;
  }

  if (sortedPlans.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center text-muted-foreground">
          No plans available at this time.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Plan Comparison</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-50 bg-muted/30">
                  Feature
                </TableHead>
                {sortedPlans.map((plan) => (
                  <TableHead
                    key={plan.id}
                    className={cn(
                      "min-w-40 text-center",
                      plan.id === currentPlanId && "bg-primary/5"
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{plan.name}</span>
                        {plan.id === currentPlanId && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs font-normal text-muted-foreground">
                        {formatPrice(plan.priceMonthly, plan.currency)}/mo
                      </div>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Pricing rows */}
              <TableRow className="bg-muted/20">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    Monthly Price
                  </div>
                </TableCell>
                {sortedPlans.map((plan) => (
                  <TableCell
                    key={plan.id}
                    className={cn(
                      "text-center font-semibold",
                      plan.id === currentPlanId && "bg-primary/5"
                    )}
                  >
                    {formatPrice(plan.priceMonthly, plan.currency)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="bg-muted/20">
                <TableCell className="font-medium pl-10">
                  Yearly Price
                </TableCell>
                {sortedPlans.map((plan) => (
                  <TableCell
                    key={plan.id}
                    className={cn(
                      "text-center",
                      plan.id === currentPlanId && "bg-primary/5"
                    )}
                  >
                    {formatPrice(plan.priceYearly, plan.currency)}/yr
                  </TableCell>
                ))}
              </TableRow>

              {/* Feature category rows */}
              <TooltipProvider>
                {PLAN_FEATURE_CATEGORIES.map((category) => (
                  <Fragment key={`cat-${category.name}`}>
                    {/* Category header */}
                    <TableRow className="bg-muted/40">
                      <TableCell
                        colSpan={sortedPlans.length + 1}
                        className="font-semibold text-sm"
                      >
                        {category.name}
                      </TableCell>
                    </TableRow>

                    {/* Feature rows */}
                    {category.features.map((feature) => (
                      <TableRow key={`feat-${category.name}-${feature.label}`}>
                        <TableCell>
                          {feature.description ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help border-b border-dotted border-muted-foreground/40">
                                  {feature.label}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                {feature.description}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            feature.label
                          )}
                        </TableCell>
                        {sortedPlans.map((plan) => (
                          <TableCell
                            key={plan.id}
                            className={cn(
                              "text-center",
                              plan.id === currentPlanId && "bg-primary/5"
                            )}
                          >
                            {formatCellValue(
                              feature.getValue(plan.entitlements as PlanEntitlements)
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TooltipProvider>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export { PlanComparisonTableSkeleton };


