// =============================================================================
// OnboardingWizard â€” Multi-step tenant onboarding wizard
// =============================================================================
// 4-step wizard: Personal Details â†’ Documents â†’ Emergency Contact â†’ Review
// Uses Zustand for form state persistence (sessionStorage).
// =============================================================================

"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2, Send, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";
import { extractFieldErrors, type AppError } from "@/lib/errors";

import { useSubmitTenantOnboarding } from "../../hooks/use-tenant-onboarding";
import {
  useTenantOnboardingStore,
  DEFAULT_ONBOARDING_DATA,
} from "../../store/onboarding-store";
import {
  onboardingFormSchema,
  ONBOARDING_STEP_SCHEMAS,
  type OnboardingFormValues,
} from "./onboarding-schema";
import { ONBOARDING_STEPS, type OnboardingStepId } from "./onboarding-types";

import { StepPersonalDetails } from "./step-personal-details";
import { StepDocuments } from "./step-documents";
import { StepEmergencyContact } from "./step-emergency-contact";
import { StepReview } from "./step-review";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OnboardingWizard() {
  const router = useRouter();

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
  } = useTenantOnboardingStore();

  // RHF form â€” seed with persisted data
  const form = useForm<OnboardingFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      ...DEFAULT_ONBOARDING_DATA,
      ...persistedData,
    } as OnboardingFormValues,
    mode: "onBlur",
  });

  // Mutation
  const submitMutation = useSubmitTenantOnboarding();
  const isSubmitting = submitMutation.isPending;

  // Persist form values to Zustand on step change
  const persistCurrentValues = useCallback(() => {
    const values = form.getValues();
    updateData(values as unknown as typeof persistedData);
  }, [form, updateData]);

  // If already submitted, redirect to tenant dashboard
  useEffect(() => {
    if (isSubmitted) {
      router.replace("/dashboard/tenant");
    }
  }, [isSubmitted, router]);

  // ------------------------------------------------------------------
  // Step validation
  // ------------------------------------------------------------------

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const schema = ONBOARDING_STEP_SCHEMAS[currentStep];
    if (!schema) return true; // review step â€” no validation

    // Get data from store (documents and contacts are stored there)
    const storeData = useTenantOnboardingStore.getState().data;
    const formValues = form.getValues();
    const values = { ...formValues, ...storeData };

    try {
      schema.parse(values);
      return true;
    } catch {
      // Trigger RHF field-level validation for the current step
      let fieldsToValidate: (keyof OnboardingFormValues)[] = [];

      switch (currentStep) {
        case 1:
          fieldsToValidate = [
            "fullName",
            "nationality",
            "phone",
            "employmentStatus",
          ];
          break;
        case 2:
          fieldsToValidate = ["documents"];
          break;
        case 3:
          fieldsToValidate = ["emergencyContacts"];
          break;
      }

      await form.trigger(fieldsToValidate);
      return false;
    }
  }, [currentStep, form]);

  const goNext = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) {
      showError("Please complete all required fields before continuing.");
      return;
    }

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
      const storeData = useTenantOnboardingStore.getState().data;
      const formValues = form.getValues();
      const values = { ...formValues, ...storeData };

      for (let s = currentStep; s < step; s++) {
        const schema = ONBOARDING_STEP_SCHEMAS[s];
        if (schema) {
          try {
            schema.parse(values);
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
    [currentStep, form, persistCurrentValues, setCurrentStep]
  );

  // ------------------------------------------------------------------
  // Submit
  // ------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    // Validate final state
    const storeData = useTenantOnboardingStore.getState().data;
    
    // Check minimum requirements
    const hasIdDocument = storeData.documents.some(
      (d) => d.type === "IC_FRONT" || d.type === "PASSPORT"
    );
    const hasEmergencyContact = storeData.emergencyContacts.length > 0;

    if (!storeData.fullName || !storeData.phone || !storeData.employmentStatus) {
      showError("Please complete your personal details.");
      setCurrentStep(1);
      return;
    }

    if (!hasIdDocument) {
      showError("Please upload at least IC Front or Passport for verification.");
      setCurrentStep(2);
      return;
    }

    if (!hasEmergencyContact) {
      showError("Please add at least one emergency contact.");
      setCurrentStep(3);
      return;
    }

    try {
      await submitMutation.mutateAsync({
        fullName: storeData.fullName,
        phone: storeData.phone,
        email: "", // Will be filled from auth context
        icNumber: storeData.icNumber || undefined,
        passportNumber: storeData.passportNumber || undefined,
        dateOfBirth: storeData.dateOfBirth || undefined,
        nationality: storeData.nationality || undefined,
        employmentStatus: storeData.employmentStatus || undefined,
        employerName: storeData.employerName || undefined,
        employerAddress: storeData.employerAddress || undefined,
        jobTitle: storeData.jobTitle || undefined,
        monthlyIncome: storeData.monthlyIncome
          ? Number(storeData.monthlyIncome)
          : undefined,
        emergencyContacts: storeData.emergencyContacts,
        documentIds: storeData.documents.map((d) => d.id),
      });
      markSubmitted();
      reset();
      showSuccess(
        "Your onboarding information has been submitted successfully!"
      );
      router.push("/dashboard/tenant");
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
        error.message || "Failed to submit your information. Please try again."
      );
    }
  }, [form, submitMutation, markSubmitted, reset, router, setCurrentStep]);

  // ------------------------------------------------------------------
  // Render step content
  // ------------------------------------------------------------------

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepPersonalDetails />;
      case 2:
        return <StepDocuments />;
      case 3:
        return <StepEmergencyContact />;
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

interface StepIndicatorProps {
  steps: ReadonlyArray<{
    readonly id: OnboardingStepId;
    readonly label: string;
    readonly description: string;
  }>;
  currentStep: number;
  onStepClick: (step: OnboardingStepId) => void;
}

function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
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
                    "text-muted-foreground cursor-pointer hover:bg-muted"
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
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="size-3.5" /> : step.id}
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
                    isCompleted ? "bg-primary" : "bg-border"
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

export function OnboardingWizardSkeleton() {
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

