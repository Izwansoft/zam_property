// =============================================================================
// ClaimSubmissionForm — Create a new claim with type, description, amount
// =============================================================================
// Uses React Hook Form + Zod for validation.
// After creation, user can upload evidence on the detail page.
// =============================================================================

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

import { useCreateClaim } from "../hooks";
import { ClaimType, CLAIM_TYPE_CONFIG } from "../types";

// ---------------------------------------------------------------------------
// Zod Schema
// ---------------------------------------------------------------------------

const claimFormSchema = z.object({
  tenancyId: z.string().uuid("Select a valid tenancy"),
  type: z.nativeEnum(ClaimType, { required_error: "Select a claim type" }),
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(100, "Title must be at most 100 characters"),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description must be at most 2000 characters"),
  claimedAmount: z
    .number({ required_error: "Enter claimed amount" })
    .min(0.01, "Amount must be at least RM 0.01")
    .max(999999.99, "Amount exceeds maximum"),
  maintenanceId: z.string().uuid().optional().or(z.literal("")),
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ClaimSubmissionFormProps {
  /** Pre-selected tenancy ID (from tenant context) */
  tenancyId?: string;
  /** Pre-linked maintenance ticket ID */
  maintenanceId?: string;
  /** Role of the submitter (OWNER or TENANT) */
  submittedRole: "OWNER" | "TENANT";
  /** Available tenancies to choose from (if tenancyId not pre-set) */
  tenancies?: Array<{ id: string; label: string }>;
  /** Called after successful submission */
  onSuccess?: (claim: { id: string }) => void;
  /** Called when cancelling */
  onCancel?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClaimSubmissionForm({
  tenancyId,
  maintenanceId,
  submittedRole,
  tenancies = [],
  onSuccess,
  onCancel,
  className = "",
}: ClaimSubmissionFormProps) {
  const createClaim = useCreateClaim();

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      tenancyId: tenancyId ?? "",
      type: undefined,
      title: "",
      description: "",
      claimedAmount: undefined as unknown as number,
      maintenanceId: maintenanceId ?? "",
    },
  });

  const onSubmit = async (values: ClaimFormValues) => {
    try {
      const result = await createClaim.mutateAsync({
        tenancyId: values.tenancyId,
        maintenanceId: values.maintenanceId || undefined,
        type: values.type,
        title: values.title,
        description: values.description,
        claimedAmount: values.claimedAmount,
        submittedRole,
      });
      onSuccess?.(result);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Submit a Claim
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tenancy selector (only if not pre-set) */}
            {!tenancyId && tenancies.length > 0 && (
              <FormField
                control={form.control}
                name="tenancyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenancy</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tenancies.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Claim Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claim Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select claim type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CLAIM_TYPE_CONFIG).map(
                        ([type, config]) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              <config.icon className="h-4 w-4" />
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value &&
                      CLAIM_TYPE_CONFIG[field.value as ClaimType]?.description}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief summary of the claim"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/100 characters
                  </FormDescription>
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
                      placeholder="Describe the issue in detail. Include what happened, when it was noticed, and any relevant context."
                      className="min-h-32 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/2000 characters (min 50)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Claimed Amount */}
            <FormField
              control={form.control}
              name="claimedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claimed Amount (RM)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        RM
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        className="pl-10"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val ? parseFloat(val) : undefined);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter the total amount being claimed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Error display */}
            {createClaim.error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                {createClaim.error.message || "Failed to submit claim"}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={createClaim.isPending}>
                {createClaim.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Claim"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
