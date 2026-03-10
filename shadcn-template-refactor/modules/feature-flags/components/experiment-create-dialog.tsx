// =============================================================================
// ExperimentCreateDialog — Create a new experiment
// =============================================================================

"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PlusIcon, TrashIcon } from "lucide-react";

import { useCreateExperiment } from "../hooks/use-create-experiment";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

const experimentSchema = z.object({
  key: z
    .string()
    .min(1, "Required")
    .regex(/^[a-z0-9-]+$/, "Lowercase, numbers, and hyphens only"),
  description: z.string().optional(),
  owner: z.string().min(1, "Required"),
  successMetrics: z.string().optional(),
  isActive: z.boolean(),
  featureFlagKey: z.string().optional(),
  startsAt: z.string().min(1, "Required"),
  endsAt: z.string().min(1, "Required"),
  variants: z
    .array(
      z.object({
        key: z.string().min(1, "Required"),
        weight: z.coerce.number().min(0).max(100),
      })
    )
    .min(2, "At least 2 variants required"),
});

type ExperimentFormValues = z.infer<typeof experimentSchema>;

interface ExperimentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExperimentCreateDialog({
  open,
  onOpenChange,
}: ExperimentCreateDialogProps) {
  const createExperiment = useCreateExperiment();

  const form = useForm<ExperimentFormValues>({
    resolver: zodResolver(experimentSchema),
    defaultValues: {
      key: "",
      description: "",
      owner: "",
      successMetrics: "",
      isActive: false,
      featureFlagKey: "",
      startsAt: "",
      endsAt: "",
      variants: [
        { key: "control", weight: 50 },
        { key: "treatment", weight: 50 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const onSubmit = (values: ExperimentFormValues) => {
    createExperiment.mutate(
      {
        key: values.key,
        description: values.description || undefined,
        owner: values.owner,
        successMetrics: values.successMetrics || undefined,
        isActive: values.isActive,
        featureFlagKey: values.featureFlagKey || undefined,
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
        variants: values.variants,
      },
      {
        onSuccess: () => {
          showSuccess("Experiment created");
          form.reset();
          onOpenChange(false);
        },
        onError: (err) => showError(err.message),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Experiment</DialogTitle>
          <DialogDescription>
            Set up a new A/B test or feature experiment.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="my-experiment"
                      className="font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <FormControl>
                      <Input placeholder="team-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="featureFlagKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feature Flag Key (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="linked-flag-key"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What does this experiment test?"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="successMetrics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Success Metrics (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="conversion_rate, revenue_per_user"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starts At</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ends At</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel>Active on create</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Variants */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  Variants ({fields.length})
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ key: "", weight: 0 })}
                >
                  <PlusIcon className="mr-1 h-3 w-3" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-2"
                  >
                    <Input
                      placeholder="variant-key"
                      className="font-mono"
                      {...form.register(`variants.${idx}.key`)}
                    />
                    <Input
                      type="number"
                      placeholder="%"
                      min={0}
                      max={100}
                      className="w-20"
                      {...form.register(`variants.${idx}.weight`, {
                        valueAsNumber: true,
                      })}
                    />
                    <span className="text-xs text-muted-foreground">
                      %
                    </span>
                    {fields.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => remove(idx)}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {form.formState.errors.variants?.message && (
                <p className="text-xs text-destructive mt-1">
                  {form.formState.errors.variants.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createExperiment.isPending}
              >
                {createExperiment.isPending
                  ? "Creating..."
                  : "Create Experiment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
