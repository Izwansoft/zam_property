// =============================================================================
// PricingConfigFormDialog — Create/Edit pricing config dialog
// =============================================================================

"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Loader2Icon } from "lucide-react";
import { useCreatePricingConfig } from "../hooks/use-create-pricing-config";
import { useUpdatePricingConfig } from "../hooks/use-update-pricing-config";
import type { PricingConfig } from "../types";
import {
  CHARGE_TYPES,
  CHARGE_TYPE_LABELS,
  PRICING_MODELS,
  PRICING_MODEL_LABELS,
} from "../types";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const pricingConfigSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  chargeType: z.enum([
    "SUBSCRIPTION",
    "LEAD",
    "INTERACTION",
    "COMMISSION",
    "LISTING",
    "ADDON",
    "OVERAGE",
  ]),
  pricingModel: z.enum(["SAAS", "LEAD_BASED", "COMMISSION", "LISTING_BASED", "HYBRID"]),
  currency: z.string().min(3, "Currency code is required").max(3).default("MYR"),
  baseAmount: z.coerce
    .number()
    .min(0, "Base amount must be positive")
    .max(999999.99, "Amount exceeds maximum"),
  metadataJson: z.string().optional(),
  isActive: z.boolean().default(true),
});

type PricingConfigFormValues = z.infer<typeof pricingConfigSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PricingConfigFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: PricingConfig | null; // null = create mode
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PricingConfigFormDialog({
  open,
  onOpenChange,
  config,
}: PricingConfigFormDialogProps) {
  const isEditing = !!config;
  const createMutation = useCreatePricingConfig();
  const updateMutation = useUpdatePricingConfig();

  const form = useForm<PricingConfigFormValues>({
    resolver: zodResolver(pricingConfigSchema) as unknown as Resolver<PricingConfigFormValues>,
    defaultValues: {
      name: "",
      description: "",
      chargeType: "LISTING",
      pricingModel: "SAAS",
      currency: "MYR",
      baseAmount: 0,
      metadataJson: "",
      isActive: true,
    },
  });

  // Reset form when config changes or dialog opens
  useEffect(() => {
    if (open) {
      if (config) {
        form.reset({
          name: config.name,
          description: config.description ?? "",
          chargeType: config.chargeType,
          pricingModel: config.pricingModel,
          currency: config.currency,
          baseAmount: config.baseAmount,
          metadataJson: config.metadata
            ? JSON.stringify(config.metadata, null, 2)
            : "",
          isActive: config.isActive,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          chargeType: "LISTING",
          pricingModel: "SAAS",
          currency: "MYR",
          baseAmount: 0,
          metadataJson: "",
          isActive: true,
        });
      }
    }
  }, [open, config, form]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(values: PricingConfigFormValues) {
    const { metadataJson, ...rest } = values;
    let metadata: Record<string, unknown> | undefined;

    if (metadataJson) {
      try {
        metadata = JSON.parse(metadataJson);
      } catch {
        form.setError("metadataJson", {
          message: "Invalid JSON format",
        });
        return;
      }
    }

    const payload = { ...rest, metadata };

    if (isEditing && config) {
      await updateMutation.mutateAsync({ id: config.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Pricing Config" : "Create Pricing Config"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the pricing configuration details."
              : "Create a new pricing configuration for vendor charges."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Standard Listing Fee" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Charge Type + Pricing Model */}
            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="pricingModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pricing Model</FormLabel>
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
                        {PRICING_MODELS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {PRICING_MODEL_LABELS[m]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Currency + Base Amount */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input placeholder="MYR" maxLength={3} {...field} />
                    </FormControl>
                    <FormDescription>ISO 4217 code</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="baseAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Metadata JSON */}
            <FormField
              control={form.control}
              name="metadataJson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metadata (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"key": "value"}'
                      className="resize-none font-mono text-sm"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional JSON metadata for custom pricing logic
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active toggle */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Enable this pricing config for charge calculations
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Save Changes" : "Create Config"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
