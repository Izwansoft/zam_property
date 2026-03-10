// =============================================================================
// PricingConfigDetail — Config detail view with associated rules
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { format } from "date-fns";
import { usePricingConfig } from "../hooks/use-pricing-config";
import { PricingConfigFormDialog } from "./pricing-config-form";
import { PricingRulesList } from "./pricing-rules-list";
import type { PricingConfig } from "../types";
import {
  CHARGE_TYPE_LABELS,
  CHARGE_TYPE_COLORS,
  PRICING_MODEL_LABELS,
  PRICING_MODEL_COLORS,
  formatAmount,
} from "../types";

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-64" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PricingConfigDetailProps {
  configId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PricingConfigDetail({ configId }: PricingConfigDetailProps) {
  const { data: config, isLoading, error } = usePricingConfig(configId);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <DetailSkeleton />;

  if (error || !config) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/platform/pricing"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Pricing
        </Link>
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {error
            ? "Failed to load pricing config. Please try again."
            : "Pricing config not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/platform/pricing"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold">{config.name}</h1>
          <Badge variant={config.isActive ? "default" : "secondary"}>
            {config.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <PencilIcon className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Config Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Details</CardTitle>
          {config.description && (
            <CardDescription>{config.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Charge Type</span>
              <p className="mt-1">
                <Badge
                  variant="secondary"
                  className={CHARGE_TYPE_COLORS[config.chargeType]}
                >
                  {CHARGE_TYPE_LABELS[config.chargeType]}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Pricing Model</span>
              <p className="mt-1">
                <Badge
                  variant="outline"
                  className={PRICING_MODEL_COLORS[config.pricingModel]}
                >
                  {PRICING_MODEL_LABELS[config.pricingModel]}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Currency</span>
              <p className="mt-1 font-medium">{config.currency}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Base Amount</span>
              <p className="mt-1 font-mono font-semibold">
                {formatAmount(config.baseAmount, config.currency)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Created</span>
              <p className="mt-1">
                {format(new Date(config.createdAt), "dd MMM yyyy, HH:mm")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Updated</span>
              <p className="mt-1">
                {format(new Date(config.updatedAt), "dd MMM yyyy, HH:mm")}
              </p>
            </div>
          </div>

          {config.metadata && Object.keys(config.metadata).length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="text-sm">
                <span className="text-muted-foreground">Metadata</span>
                <pre className="mt-1 rounded-md bg-muted p-3 text-xs font-mono overflow-auto max-h-48">
                  {JSON.stringify(config.metadata, null, 2)}
                </pre>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Associated Rules */}
      <PricingRulesList pricingConfigId={configId} />

      {/* Edit Dialog */}
      <PricingConfigFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        config={config}
      />
    </div>
  );
}
