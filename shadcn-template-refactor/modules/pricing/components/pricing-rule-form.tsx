// =============================================================================
// PricingRuleFormDialog — Create a new pricing rule
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2Icon } from "lucide-react";
import { useCreatePricingRule } from "../hooks/use-create-pricing-rule";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const pricingRuleSchema = z.object({
  pricingConfigId: z.string().min(1, "Pricing config ID is required"),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  conditionJson: z.string().min(2, "Condition is required"),
  multiplier: z.coerce.number().min(0, "Multiplier must be positive"),
  priority: z.coerce.number().int().min(0).default(0),
});

type PricingRuleFormValues = z.infer<typeof pricingRuleSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PricingRuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultConfigId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PricingRuleFormDialog({
  open,
  onOpenChange,
  defaultConfigId,
}: PricingRuleFormDialogProps) {
  const createMutation = useCreatePricingRule();

  const form = useForm<PricingRuleFormValues>({
    resolver: zodResolver(pricingRuleSchema) as unknown as Resolver<PricingRuleFormValues>,
    defaultValues: {
      pricingConfigId: defaultConfigId ?? "",
      name: "",
      description: "",
      conditionJson: "{}",
      multiplier: 1,
      priority: 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        pricingConfigId: defaultConfigId ?? "",
        name: "",
        description: "",
        conditionJson: "{}",
        multiplier: 1,
        priority: 0,
      });
    }
  }, [open, defaultConfigId, form]);

  async function onSubmit(values: PricingRuleFormValues) {
    const { conditionJson, ...rest } = values;
    let condition: Record<string, unknown>;

    try {
      condition = JSON.parse(conditionJson);
    } catch {
      form.setError("conditionJson", {
        message: "Invalid JSON format",
      });
      return;
    }

    await createMutation.mutateAsync({ ...rest, condition });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Pricing Rule</DialogTitle>
          <DialogDescription>
            Create a new pricing rule to modify charge calculations.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Config ID (hidden if pre-set) */}
            {!defaultConfigId && (
              <FormField
                control={form.control}
                name="pricingConfigId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pricing Config ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Config ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Premium Location Surcharge" {...field} />
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

            {/* Condition JSON */}
            <FormField
              control={form.control}
              name="conditionJson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"region": "klang-valley"}'
                      className="resize-none font-mono text-sm"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    JSON condition that triggers this rule
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Multiplier + Priority */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="multiplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Multiplier</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="1.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Applied to base amount
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Lower = higher priority
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Rule
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
