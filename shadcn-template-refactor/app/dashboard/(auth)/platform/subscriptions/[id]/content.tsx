"use client";

import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useApiQuery } from "@/hooks/use-api-query";
import { queryKeys } from "@/lib/query";
import { showError, showSuccess } from "@/lib/errors/toast-helpers";
import type { Plan } from "@/modules/subscription/types";

export function PlatformSubscriptionDetailContent() {
  const params = useParams<{ id: string }>();
  const planId = params.id;

  const { data: plan, isLoading, error } = useApiQuery<Plan>({
    queryKey: queryKeys.subscriptions.plans({ id: planId }),
    path: `/plans/${planId}`,
    enabled: !!planId,
  });

  const activatePlan = useApiMutation<unknown, string>({
    path: (id) => `/plans/${id}/activate`,
    method: "PATCH",
  });
  const deactivatePlan = useApiMutation<unknown, string>({
    path: (id) => `/plans/${id}/deactivate`,
    method: "PATCH",
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading plan details...</div>;
  }

  if (error || !plan) {
    return (
      <div className="space-y-4">
        <PageHeader title="Plan Detail" backHref="/dashboard/platform/subscriptions" />
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load plan details.
        </div>
      </div>
    );
  }

  const toggleStatus = async () => {
    try {
      if (plan.isActive) {
        await deactivatePlan.mutateAsync(plan.id);
        showSuccess("Plan deactivated", {
          description: `${plan.name} is now inactive.`,
        });
      } else {
        await activatePlan.mutateAsync(plan.id);
        showSuccess("Plan activated", {
          description: `${plan.name} is now active.`,
        });
      }
    } catch {
      showError("Failed to update plan status", {
        description: "Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={plan.name}
        description={`Plan slug: ${plan.slug}`}
        backHref="/dashboard/platform/subscriptions"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Plan Overview</CardTitle>
          <Button variant={plan.isActive ? "destructive" : "default"} onClick={toggleStatus}>
            {plan.isActive ? "Deactivate" : "Activate"}
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-sm font-medium">{plan.isActive ? "Active" : "Inactive"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Visibility</p>
            <p className="text-sm font-medium">{plan.isPublic ? "Public" : "Private"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monthly</p>
            <p className="text-sm font-medium">{plan.currency} {Number(plan.priceMonthly).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Yearly</p>
            <p className="text-sm font-medium">{plan.currency} {Number(plan.priceYearly).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
