// =============================================================================
// FeatureFlagCreateDialog — Dialog to create a new feature flag
// =============================================================================

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useCreateFeatureFlag } from "../hooks/use-create-feature-flag";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

const createFlagSchema = z.object({
  key: z
    .string()
    .min(3, "Key must be at least 3 characters")
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Key must contain only lowercase letters, numbers, and hyphens"
    ),
  type: z.enum(["BOOLEAN", "PERCENTAGE"]),
  description: z.string().min(5, "Description required"),
  owner: z.string().min(2, "Owner required"),
  defaultValue: z.boolean(),
  rolloutPercentage: z.number().min(0).max(100).nullable().optional(),
});

type CreateFlagFormValues = z.infer<typeof createFlagSchema>;

interface FeatureFlagCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeatureFlagCreateDialog({
  open,
  onOpenChange,
}: FeatureFlagCreateDialogProps) {
  const createFlag = useCreateFeatureFlag();

  const form = useForm<CreateFlagFormValues>({
    resolver: zodResolver(createFlagSchema),
    defaultValues: {
      key: "",
      type: "BOOLEAN",
      description: "",
      owner: "",
      defaultValue: false,
      rolloutPercentage: null,
    },
  });

  const watchType = form.watch("type");

  const onSubmit = (values: CreateFlagFormValues) => {
    createFlag.mutate(
      {
        ...values,
        rolloutPercentage:
          values.type === "PERCENTAGE" ? (values.rolloutPercentage ?? 0) : null,
      },
      {
        onSuccess: () => {
          showSuccess("Feature flag created successfully");
          form.reset();
          onOpenChange(false);
        },
        onError: (error) => {
          showError(error.message || "Failed to create feature flag");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Feature Flag</DialogTitle>
          <DialogDescription>
            Define a new feature flag. Changes are audited.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="my-new-feature"
                      className="font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier. Use lowercase with hyphens.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BOOLEAN">Boolean</SelectItem>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <FormControl>
                      <Input placeholder="platform-team" {...field} />
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
                      placeholder="Describe what this flag controls..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-6">
              <FormField
                control={form.control}
                name="defaultValue"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="mt-0">Default Value</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watchType === "PERCENTAGE" && (
                <FormField
                  control={form.control}
                  name="rolloutPercentage"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Rollout %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="25"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createFlag.isPending}>
                {createFlag.isPending ? "Creating..." : "Create Flag"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
