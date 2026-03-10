// =============================================================================
// ListingForm — Multi-step form for creating/editing listings
// =============================================================================
// 5-step wizard: Vertical → Core Fields → Attributes → Media → Review
// Uses RHF FormProvider for cross-step state, Zod schemas per step.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";
import { extractFieldErrors, type AppError } from "@/lib/errors";
import { useAuth } from "@/modules/auth/hooks/use-auth";

import {
  useCreateListing,
  useUpdateListing,
  type CreateListingDto,
  type UpdateListingDto,
} from "../../hooks/use-listing-mutations";

import { useEnabledPartnerVerticals } from "@/modules/vertical/hooks/use-partner-verticals";

import {
  verticalStepSchema,
  coreFieldsStepSchema,
  attributesStepSchema,
  mediaStepSchema,
  listingFormSchema,
  type ListingFormValues,
} from "./listing-form-schema";

import {
  LISTING_FORM_STEPS,
  DEFAULT_LISTING_FORM_DATA,
  type StepId,
} from "./listing-form-types";

import { StepVerticalSelect } from "./step-vertical-select";
import { StepCoreFields } from "./step-core-fields";
import { StepAttributes } from "./step-attributes";
import { StepMedia } from "./step-media";
import { StepReview } from "./step-review";

import type { ListingDetail } from "../../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ListingFormProps {
  /** Existing listing data (for edit mode) */
  listing?: ListingDetail;
  /** Portal context */
  portal: "vendor" | "partner";
  /** Base path for navigation after save */
  basePath: string;
}

// ---------------------------------------------------------------------------
// Step validation schemas (indexed by step id)
// ---------------------------------------------------------------------------

const STEP_SCHEMAS: Record<number, typeof verticalStepSchema | typeof coreFieldsStepSchema | typeof attributesStepSchema | typeof mediaStepSchema | null> = {
  1: verticalStepSchema,
  2: coreFieldsStepSchema,
  3: attributesStepSchema,
  4: mediaStepSchema,
  5: null, // Review step — no validation
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ListingForm({ listing, portal, basePath }: ListingFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isEdit = !!listing;
  const [currentStep, setCurrentStep] = useState<StepId>(isEdit ? 2 : 1);

  // Build default values from existing listing (edit) or empty (create)
  const defaultValues: ListingFormValues = listing
    ? {
        verticalType: listing.verticalType,
        schemaVersion: listing.schemaVersion || "1.0",
        title: listing.title,
        description: listing.description ?? "",
        price: listing.price,
        currency: listing.currency ?? "MYR",
        priceType: (listing.priceType ?? "FIXED") as ListingFormValues["priceType"],
        location: {
          address: listing.location?.address ?? "",
          city: listing.location?.city ?? "",
          state: listing.location?.state ?? "",
          country: listing.location?.country ?? "MY",
          postalCode: listing.location?.postalCode ?? "",
        },
        attributes: listing.attributes ?? {},
        mediaIds: listing.media?.map((m) => m.id) ?? [],
      }
    : (DEFAULT_LISTING_FORM_DATA as ListingFormValues);

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingFormSchema) as unknown as Resolver<ListingFormValues>,
    defaultValues,
    mode: "onBlur",
  });

  // Mutations
  const createMutation = useCreateListing();
  const updateMutation = useUpdateListing();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // E4: In partner context, constrain vertical options to partner's enabled verticals
  const { data: enabledVerticals } = useEnabledPartnerVerticals();
  const partnerVerticalOptions = portal === "partner" && enabledVerticals
    ? enabledVerticals.map((pv) => ({
        value: pv.vertical.type,
        label: pv.vertical.name,
        description: `Enabled for this partner`,
        icon: pv.vertical.icon === "building" ? "🏠" : pv.vertical.icon === "car" ? "🚗" : "📦",
      }))
    : undefined;

  // ------------------------------------------------------------------
  // Step navigation
  // ------------------------------------------------------------------

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const schema = STEP_SCHEMAS[currentStep];
    if (!schema) return true;

    const values = form.getValues();

    try {
      // Parse the current step's fields through the schema
      schema.parse(values);
      return true;
    } catch (err) {
      // Trigger RHF validation on the fields of the current step
      let fieldsToValidate: (keyof ListingFormValues)[] = [];

      switch (currentStep) {
        case 1:
          fieldsToValidate = ["verticalType", "schemaVersion"];
          break;
        case 2:
          fieldsToValidate = ["title", "description", "price", "currency", "priceType", "location"];
          break;
        case 3:
          fieldsToValidate = ["attributes"];
          break;
        case 4:
          fieldsToValidate = ["mediaIds"];
          break;
      }

      // Trigger validation on step fields
      const isValid = await form.trigger(fieldsToValidate);
      return isValid;
    }
  }, [currentStep, form]);

  const goNext = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    if (currentStep < 5) {
      setCurrentStep((s) => (s + 1) as StepId);
    }
  }, [currentStep, validateCurrentStep]);

  const goPrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((s) => (s - 1) as StepId);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    async (step: StepId) => {
      // Can always go backwards
      if (step < currentStep) {
        // In edit mode, skip step 1 (vertical is immutable)
        if (isEdit && step === 1) return;
        setCurrentStep(step);
        return;
      }

      // Going forward requires validation of all intermediate steps
      for (let s = currentStep; s < step; s++) {
        const schema = STEP_SCHEMAS[s];
        if (schema) {
          try {
            schema.parse(form.getValues());
          } catch {
            setCurrentStep(s as StepId);
            await form.trigger();
            return;
          }
        }
      }

      setCurrentStep(step);
    },
    [currentStep, isEdit, form],
  );

  // ------------------------------------------------------------------
  // Save as draft
  // ------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    // Validate core required fields (step 2) before saving
    const values = form.getValues();

    if (!values.verticalType) {
      showError("Please select a vertical type before saving.");
      setCurrentStep(1);
      return;
    }

    if (!values.title) {
      showError("Title is required before saving.");
      setCurrentStep(2);
      await form.trigger(["title"]);
      return;
    }

    const setServerErrors = (error: AppError) => {
      const fieldErrors = extractFieldErrors(error);
      if (!fieldErrors) return;
      Object.entries(fieldErrors).forEach(([field, message]) => {
        form.setError(field as keyof ListingFormValues, {
          type: "server",
          message,
        });
      });
    };

    try {
      if (isEdit && listing) {
        // Update existing
        const updateDto: UpdateListingDto & { id: string } = {
          id: listing.id,
          title: values.title,
          description: values.description || undefined,
          price: values.price,
          currency: values.currency,
          priceType: values.priceType,
          location: {
            address: values.location.address || undefined,
            city: values.location.city,
            state: values.location.state,
            country: values.location.country,
            postalCode: values.location.postalCode || undefined,
          },
          attributes: values.attributes,
        };

        await updateMutation.mutateAsync(updateDto);
        showSuccess("Listing updated successfully.");
        router.push(`${basePath}/${listing.id}`);
      } else {
        // Create new
        if (!user?.primaryVendorId) {
          showError("No vendor is assigned to your account. Please contact your administrator.");
          return;
        }

        const createDto: CreateListingDto = {
          vendorId: user.primaryVendorId,
          verticalType: values.verticalType,
          schemaVersion: values.schemaVersion,
          title: values.title,
          description: values.description || undefined,
          price: values.price ?? 0,
          currency: values.currency,
          priceType: values.priceType,
          location: {
            address: values.location.address || undefined,
            city: values.location.city,
            state: values.location.state,
            country: values.location.country,
            postalCode: values.location.postalCode || undefined,
          },
          attributes: values.attributes,
        };

        const created = await createMutation.mutateAsync(createDto);
        showSuccess("Listing created as draft.");
        router.push(`${basePath}/${created.id}`);
      }
    } catch (err) {
      const error = err as AppError;
      setServerErrors(error);
      showError(error.message || "Failed to save listing. Please try again.");
    }
  }, [form, isEdit, listing, basePath, router, createMutation, updateMutation]);

  // ------------------------------------------------------------------
  // Render current step content
  // ------------------------------------------------------------------

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepVerticalSelect
            value={form.watch("verticalType")}
            onChange={(v) => form.setValue("verticalType", v, { shouldValidate: true })}
            isEdit={isEdit}
            error={form.formState.errors.verticalType?.message}
            availableVerticals={partnerVerticalOptions}
          />
        );
      case 2:
        return <StepCoreFields />;
      case 3:
        return <StepAttributes />;
      case 4:
        return <StepMedia ownerType="listing" ownerId={listing?.id ?? "draft"} />;
      case 5:
        return <StepReview />;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...form}>
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Step indicator */}
        <StepIndicator
          steps={LISTING_FORM_STEPS as unknown as Array<{ id: StepId; label: string; description: string }>}
          currentStep={currentStep}
          onStepClick={goToStep}
          isEdit={isEdit}
        />

        {/* Step content */}
        <div className="min-h-100">{renderStep()}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={goPrev}
            disabled={currentStep <= (isEdit ? 2 : 1) || isSaving}
          >
            <ArrowLeft className="mr-2 size-4" />
            Previous
          </Button>

          <div className="flex gap-3">
            {/* Save draft — available on any step (except step 1 for create) */}
            {(isEdit || currentStep > 1) && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                {isEdit ? "Save Changes" : "Save Draft"}
              </Button>
            )}

            {currentStep < 5 ? (
              <Button type="button" onClick={goNext} disabled={isSaving}>
                Next
                <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Check className="mr-2 size-4" />
                )}
                {isEdit ? "Save Changes" : "Create Listing"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </FormProvider>
  );
}

// ---------------------------------------------------------------------------
// StepIndicator
// ---------------------------------------------------------------------------

function StepIndicator({
  steps,
  currentStep,
  onStepClick,
  isEdit,
}: {
  steps: Array<{ id: StepId; label: string; description: string }>;
  currentStep: StepId;
  onStepClick: (step: StepId) => void;
  isEdit: boolean;
}) {
  return (
    <nav aria-label="Form steps">
      <ol className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isDisabled = isEdit && step.id === 1;

          return (
            <li key={step.id} className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => onStepClick(step.id)}
                disabled={isDisabled}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors w-full",
                  isActive && "bg-primary/10 text-primary",
                  isCompleted && "text-primary hover:bg-primary/5",
                  !isActive && !isCompleted && "text-muted-foreground",
                  isDisabled && "opacity-50 cursor-not-allowed",
                  !isDisabled && !isActive && "cursor-pointer hover:bg-muted",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && "bg-primary/20 text-primary",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground",
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5" />
                  ) : (
                    step.id
                  )}
                </span>
                <div className="hidden min-w-0 sm:block">
                  <div className="truncate text-xs font-medium">{step.label}</div>
                </div>
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "hidden h-px w-4 shrink-0 sm:block",
                    isCompleted ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

export function ListingFormSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Step indicator skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-1 items-center gap-2">
            <div className="h-10 flex-1 animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          <div className="h-10 animate-pulse rounded bg-muted" />
          <div className="h-24 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
