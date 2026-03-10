// =============================================================================
// OnboardingForm â€” Multi-step vendor onboarding wizard
// =============================================================================
// 4-step wizard: Basic Info â†’ Business Details â†’ Documents â†’ Review & Submit
// Uses RHF FormProvider with per-step Zod validation.
// Persists progress via Zustand onboarding store (sessionStorage).
// =============================================================================

"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2, Send, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";
import { extractFieldErrors, type AppError } from "@/lib/errors";
import { useAuth } from "@/modules/auth";

import {
  useVendorOnboarding,
  mapFormToDto,
} from "../../hooks/use-vendor-onboarding";

import {
  onboardingFormSchema,
  ONBOARDING_STEP_SCHEMAS,
  type OnboardingFormValues,
} from "./onboarding-schema";

import { ONBOARDING_STEPS, type OnboardingStepId } from "./onboarding-types";

import {
  useOnboardingStore,
  DEFAULT_ONBOARDING_DATA,
} from "../../store/onboarding-store";

import { StepBasicInfo } from "./step-basic-info";
import { StepBusinessDetails } from "./step-business-details";
import { StepDocuments } from "./step-documents";
import { StepReview } from "./step-review";

const VENDOR_APPLICATION_STATUS_KEY = "zam_vendor_application_status";
const VENDOR_HUB_STATUS_KEY = "zam_vendor_hub_status_v1";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OnboardingForm() {
  const router = useRouter();
  const { user } = useAuth();

  // Zustand store for persistence
  const {
    currentStep,
    data: persistedData,
    isSubmitted,
    setCurrentStep,
    nextStep,
    prevStep,
    updateData,
    markSubmitted,
    reset,
  } = useOnboardingStore();

  // RHF form â€” seed with persisted data
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema) as unknown as Resolver<OnboardingFormValues>,
    defaultValues: {
      ...DEFAULT_ONBOARDING_DATA,
      ...persistedData,
    } as OnboardingFormValues,
    mode: "onBlur",
  });

  // Mutation
  const onboardMutation = useVendorOnboarding();
  const isSubmitting = onboardMutation.isPending;

  // Persist form values to Zustand on step change
  const persistCurrentValues = useCallback(() => {
    const values = form.getValues();
    updateData(values as Partial<typeof persistedData>);
  }, [form, updateData]);

  // If already submitted, redirect to vendor dashboard
  useEffect(() => {
    if (isSubmitted) {
      if (user?.role === "VENDOR_ADMIN" || user?.role === "VENDOR_STAFF") {
        router.replace("/dashboard/vendor");
      } else {
        router.replace("/dashboard/account");
      }
    }
  }, [isSubmitted, router, user?.role]);

  // ------------------------------------------------------------------
  // Step validation
  // ------------------------------------------------------------------

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const schema = ONBOARDING_STEP_SCHEMAS[currentStep];
    if (!schema) return true; // review step â€” no validation

    const values = form.getValues();

    try {
      schema.parse(values);
      return true;
    } catch {
      // Trigger RHF field-level validation for the current step
      let fieldsToValidate: (keyof OnboardingFormValues)[] = [];

      switch (currentStep) {
        case 1:
          fieldsToValidate = [
            "profileModel",
            "type",
            "name",
            "email",
            "phone",
            "description",
            "companyId",
            "agentId",
          ];
          break;
        case 2:
          fieldsToValidate = ["registrationNumber", "address"];
          break;
        case 3:
          fieldsToValidate = ["documentNames"];
          break;
      }

      const isValid = await form.trigger(fieldsToValidate);
      return isValid;
    }
  }, [currentStep, form]);

  const goNext = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    persistCurrentValues();
    nextStep();
  }, [validateCurrentStep, persistCurrentValues, nextStep]);

  const goPrev = useCallback(() => {
    persistCurrentValues();
    prevStep();
  }, [persistCurrentValues, prevStep]);

  const goToStep = useCallback(
    async (step: OnboardingStepId) => {
      // Can always go backwards
      if (step < currentStep) {
        persistCurrentValues();
        setCurrentStep(step);
        return;
      }

      // Going forward â€” validate all intermediate steps
      for (let s = currentStep; s < step; s++) {
        const schema = ONBOARDING_STEP_SCHEMAS[s];
        if (schema) {
          try {
            schema.parse(form.getValues());
          } catch {
            setCurrentStep(s);
            await form.trigger();
            return;
          }
        }
      }

      persistCurrentValues();
      setCurrentStep(step);
    },
    [currentStep, form, persistCurrentValues, setCurrentStep],
  );

  // ------------------------------------------------------------------
  // Submit
  // ------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    // Validate all steps before submitting
    const isValid = await form.trigger();
    if (!isValid) {
      showError("Please review and correct the form before submitting.");
      return;
    }

    const values = form.getValues();
    const dto = mapFormToDto(values);

    try {
      await onboardMutation.mutateAsync(dto);
      window.localStorage.setItem(VENDOR_APPLICATION_STATUS_KEY, "PENDING");
      window.localStorage.setItem(
        VENDOR_HUB_STATUS_KEY,
        JSON.stringify({
          real_estate: {
            status: "PENDING",
            updatedAt: new Date().toISOString(),
          },
        }),
      );
      markSubmitted();
      reset();
      showSuccess(
        "Your vendor application has been submitted. We'll review it shortly.",
      );
      if (user?.role === "VENDOR_ADMIN" || user?.role === "VENDOR_STAFF") {
        router.push("/dashboard/vendor");
      } else {
        router.push("/dashboard/account?vendorApplication=submitted");
      }
    } catch (err) {
      const error = err as AppError;

      // Set server-side field errors
      const fieldErrors = extractFieldErrors(error);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof OnboardingFormValues, {
            type: "server",
            message,
          });
        });
      }

      showError(
        error.message ||
          "Failed to submit your application. Please try again.",
      );
    }
  }, [form, onboardMutation, markSubmitted, reset, router]);

  // ------------------------------------------------------------------
  // Render step content
  // ------------------------------------------------------------------

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepBasicInfo />;
      case 2:
        return <StepBusinessDetails />;
      case 3:
        return <StepDocuments />;
      case 4:
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
          steps={ONBOARDING_STEPS}
          currentStep={currentStep}
          onStepClick={goToStep}
        />

        {/* Step content */}
        <div className="min-h-100">{renderStep()}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={goPrev}
            disabled={currentStep <= 1 || isSubmitting}
          >
            <ArrowLeft className="mr-2 size-4" />
            Previous
          </Button>

          <div className="flex gap-3">
            {currentStep < 4 ? (
              <Button type="button" onClick={goNext} disabled={isSubmitting}>
                Next
                <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Send className="mr-2 size-4" />
                )}
                Submit Application
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
}: {
  steps: ReadonlyArray<{
    readonly id: OnboardingStepId;
    readonly label: string;
    readonly description: string;
  }>;
  currentStep: number;
  onStepClick: (step: OnboardingStepId) => void;
}) {
  return (
    <nav aria-label="Onboarding steps">
      <ol className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <li key={step.id} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => onStepClick(step.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors",
                  isActive && "bg-primary/10 text-primary",
                  isCompleted && "text-primary hover:bg-primary/5",
                  !isActive &&
                    !isCompleted &&
                    "text-muted-foreground cursor-pointer hover:bg-muted",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && "bg-primary/20 text-primary",
                    !isActive &&
                      !isCompleted &&
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5" />
                  ) : (
                    step.id
                  )}
                </span>
                <div className="hidden min-w-0 sm:block">
                  <div className="truncate text-xs font-medium">
                    {step.label}
                  </div>
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
// Loading skeleton
// ---------------------------------------------------------------------------

export function OnboardingFormSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Step indicator skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
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

