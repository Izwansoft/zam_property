// =============================================================================
// ChargeCalculator — Preview charge calculations
// =============================================================================

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalculatorIcon, Loader2Icon, ArrowRightIcon } from "lucide-react";
import { useCalculateCharge } from "../hooks/use-calculate-charge";
import type { CalculateChargeResult } from "../types";
import {
  CHARGE_TYPES,
  CHARGE_TYPE_LABELS,
  CHARGE_TYPE_COLORS,
  formatAmount,
} from "../types";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const calculateSchema = z.object({
  chargeType: z.enum([
    "SUBSCRIPTION",
    "LEAD",
    "INTERACTION",
    "COMMISSION",
    "LISTING",
    "ADDON",
    "OVERAGE",
  ]),
  partnerId: z.string().optional(),
  vendorId: z.string().optional(),
  quantity: z.coerce.number().int().min(1).optional(),
});

type CalculateFormValues = z.infer<typeof calculateSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChargeCalculator() {
  const [result, setResult] = useState<CalculateChargeResult | null>(null);
  const calculateMutation = useCalculateCharge();

  const form = useForm<CalculateFormValues>({
    resolver: zodResolver(calculateSchema),
    defaultValues: {
      chargeType: "LISTING",
      partnerId: "",
      vendorId: "",
      quantity: 1,
    },
  });

  async function onSubmit(values: CalculateFormValues) {
    const payload = {
      chargeType: values.chargeType,
      partnerId: values.partnerId || undefined,
      vendorId: values.vendorId || undefined,
      quantity: values.quantity || undefined,
    };

    const data = await calculateMutation.mutateAsync(payload);
    setResult(data);
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalculatorIcon className="h-5 w-5" />
            Charge Calculator
          </CardTitle>
          <CardDescription>
            Preview how charges will be calculated. This does not create any
            charge events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Charge Type */}
              <FormField
                control={form.control}
                name="chargeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charge Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CHARGE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {CHARGE_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Partner ID */}
              <FormField
                control={form.control}
                name="partnerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormDescription>
                      Scope calculation to a specific partner
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vendor ID */}
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormDescription>
                      Scope calculation to a specific vendor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantity */}
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={calculateMutation.isPending}
              >
                {calculateMutation.isPending ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CalculatorIcon className="mr-2 h-4 w-4" />
                )}
                Calculate
              </Button>
            </form>
          </Form>

          {calculateMutation.error && (
            <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
              Calculation failed. Please check your inputs and try again.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      <Card>
        <CardHeader>
          <CardTitle>Calculation Result</CardTitle>
          <CardDescription>
            {result
              ? "Breakdown of the calculated charge"
              : "Submit the form to see the calculation result"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center justify-between">
                <Badge
                  variant="secondary"
                  className={CHARGE_TYPE_COLORS[result.chargeType]}
                >
                  {CHARGE_TYPE_LABELS[result.chargeType]}
                </Badge>
                <span className="text-2xl font-bold font-mono">
                  {formatAmount(result.amount, result.currency)}
                </span>
              </div>

              <Separator />

              {/* Config info */}
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pricing Config</span>
                  <span>{result.pricingConfigName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Config ID</span>
                  <span className="font-mono text-xs">
                    {result.pricingConfigId}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Breakdown */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Breakdown</h4>
                <div className="rounded-md bg-muted p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Amount</span>
                    <span className="font-mono">
                      {formatAmount(result.breakdown.baseAmount, result.currency)}
                    </span>
                  </div>

                  {result.breakdown.appliedRules.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase">
                          Applied Rules
                        </span>
                        {result.breakdown.appliedRules.map((rule, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <ArrowRightIcon className="h-3 w-3 text-muted-foreground" />
                              {rule.ruleName}
                              <Badge variant="outline" className="text-xs ml-1">
                                ×{rule.multiplier}
                              </Badge>
                            </span>
                            <span className="font-mono text-xs">
                              {rule.effect >= 0 ? "+" : ""}
                              {formatAmount(rule.effect, result.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Final Amount</span>
                    <span className="font-mono">
                      {formatAmount(result.breakdown.finalAmount, result.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CalculatorIcon className="h-12 w-12 mb-3 opacity-30" />
              <p>No calculation yet</p>
              <p className="text-xs mt-1">
                Fill out the form and click Calculate
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
