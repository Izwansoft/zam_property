// =============================================================================
// Step 4: Package Selection — Choose a subscription plan
// =============================================================================

"use client";

import { useFormContext } from "react-hook-form";
import { Package, Check, Crown } from "lucide-react";

import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import type { RegistrationFormValues } from "./registration-schema";

// ---------------------------------------------------------------------------
// Mock plans — will be replaced by usePlans hook integration
// ---------------------------------------------------------------------------

interface RegistrationPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  popular?: boolean;
  features: string[];
}

const MOCK_PLANS: RegistrationPlan[] = [
  {
    id: "plan-starter",
    name: "Starter",
    description: "Perfect for small property businesses",
    priceMonthly: 99,
    priceYearly: 990,
    currency: "MYR",
    features: [
      "Up to 10 properties",
      "Up to 3 users",
      "Basic reporting",
      "Email support",
    ],
  },
  {
    id: "plan-professional",
    name: "Professional",
    description: "For growing property management companies",
    priceMonthly: 299,
    priceYearly: 2990,
    currency: "MYR",
    popular: true,
    features: [
      "Up to 50 properties",
      "Up to 10 users",
      "Advanced reporting",
      "Priority support",
      "Maintenance module",
      "Partner portal",
    ],
  },
  {
    id: "plan-enterprise",
    name: "Enterprise",
    description: "For large-scale property operations",
    priceMonthly: 599,
    priceYearly: 5990,
    currency: "MYR",
    features: [
      "Unlimited properties",
      "Unlimited users",
      "Custom reports",
      "Dedicated support",
      "All modules included",
      "API access",
      "Custom integrations",
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepPackageSelection() {
  const { control, watch, setValue } =
    useFormContext<RegistrationFormValues>();
  const billingCycle = watch("billingCycle");
  const selectedPlanId = watch("selectedPlanId");

  return (
    <div className="space-y-6">
      {/* Billing cycle toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Choose Your Plan
          </CardTitle>
          <CardDescription>
            Select the subscription plan that best fits your business needs.
            You can upgrade or downgrade anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4">
            <FormField
              control={control}
              name="billingCycle"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                      className="bg-muted rounded-lg p-1"
                    >
                      <ToggleGroupItem
                        value="monthly"
                        className="px-4 data-[state=on]:bg-background"
                      >
                        Monthly
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="yearly"
                        className="px-4 data-[state=on]:bg-background"
                      >
                        Yearly
                        <Badge
                          variant="secondary"
                          className="ml-1.5 text-[10px]"
                        >
                          Save 17%
                        </Badge>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Plan cards */}
      <FormField
        control={control}
        name="selectedPlanId"
        render={() => (
          <FormItem>
            <FormControl>
              <div className="grid gap-4 md:grid-cols-3">
                {MOCK_PLANS.map((plan) => {
                  const price =
                    billingCycle === "yearly"
                      ? plan.priceYearly
                      : plan.priceMonthly;
                  const isSelected = selectedPlanId === plan.id;

                  return (
                    <Card
                      key={plan.id}
                      className={cn(
                        "relative cursor-pointer transition-all hover:shadow-md",
                        isSelected &&
                          "border-primary ring-2 ring-primary/20",
                        plan.popular && !isSelected && "border-primary/50"
                      )}
                      onClick={() =>
                        setValue("selectedPlanId", plan.id, {
                          shouldValidate: true,
                        })
                      }
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="gap-1">
                            <Crown className="size-3" />
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span>{plan.name}</span>
                          {isSelected && (
                            <Check className="size-5 text-primary" />
                          )}
                        </CardTitle>
                        <CardDescription>
                          {plan.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="mb-4">
                          <span className="text-3xl font-bold">
                            {plan.currency}{" "}
                            {price.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">
                            /{billingCycle === "yearly" ? "yr" : "mo"}
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {plan.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Check className="size-4 shrink-0 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setValue("selectedPlanId", plan.id, {
                              shouldValidate: true,
                            });
                          }}
                        >
                          {isSelected ? "Selected" : "Select Plan"}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// Skeleton
export function StepPackageSelectionSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="flex justify-center">
          <Skeleton className="h-10 w-48" />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-36" />
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
