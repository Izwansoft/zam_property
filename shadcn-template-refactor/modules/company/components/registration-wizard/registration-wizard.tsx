// =============================================================================
// CompanyRegistrationWizard â€” Multi-step company registration wizard
// =============================================================================
// 6-step wizard: Company Details â†’ Admin User â†’ Documents â†’ Package â†’ Payment
// â†’ Confirmation.
// Uses Zustand for form state persistence (sessionStorage).
// =============================================================================

"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Send,
  Check,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";
import { extractFieldErrors, type AppError } from "@/lib/errors";

import { useRegisterCompany } from "../../hooks/useCompany";
import {
  useCompanyRegistrationStore,
} from "../../store/registration-store";
import {
  DEFAULT_REGISTRATION_DATA,
  REGISTRATION_STEPS,
  type RegistrationStepId,
} from "../../types";
import {
  registrationFormSchema,
  REGISTRATION_STEP_SCHEMAS,
  type RegistrationFormValues,
} from "./registration-schema";

import { StepCompanyDetails } from "./step-company-details";
import { StepAdminDetails } from "./step-admin-details";
import { StepDocuments } from "./step-documents";
import { StepPackageSelection } from "./step-package-selection";
import { StepPayment } from "./step-payment";
import { StepConfirmation } from "./step-confirmation";

// ---------------------------------------------------------------------------
// Total steps
// ---------------------------------------------------------------------------

const TOTAL_STEPS = REGISTRATION_STEPS.length;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CompanyRegistrationWizard() {
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
  } = useCompanyRegistrationStore();

  // RHF form â€” seed with persisted data
  const form = useForm<RegistrationFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      ...DEFAULT_REGISTRATION_DATA,
      ...persistedData,
    } as RegistrationFormValues,
    mode: "onBlur",
  });

  // Mutation
  const registerMutation = useRegisterCompany();
  const isSubmitting = registerMutation.isPending;

  // Persist form values to Zustand on step change
  const persistCurrentValues = useCallback(() => {
    const values = form.getValues();
    updateData(values as unknown as typeof persistedData);
  }, [form, updateData]);

  // ------------------------------------------------------------------
  // Step validation
  // ------------------------------------------------------------------

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const schema = REGISTRATION_STEP_SCHEMAS[currentStep];
    if (!schema) return true; // Steps without validation (payment, confirmation)

    const storeData = useCompanyRegistrationStore.getState().data;
    const formValues = form.getValues();
    const values = { ...formValues, ...storeData };

    try {
      schema.parse(values);
      return true;
    } catch {
      // Trigger RHF field-level validation for the current step
      let fieldsToValidate: (keyof RegistrationFormValues)[] = [];

      switch (currentStep) {
        case 1:
          fieldsToValidate = [
            "companyName",
            "registrationNo",
            "companyType",
            "companyEmail",
            "companyPhone",
          ];
          break;
        case 2:
          fieldsToValidate = [
            "adminFullName",
            "adminEmail",
            "adminPhone",
            "adminPassword",
            "adminConfirmPassword",
          ];
          break;
        case 3:
          fieldsToValidate = ["ssmDocumentUrl"];
          break;
        case 4:
          fieldsToValidate = ["selectedPlanId", "billingCycle"];
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
    async (step: RegistrationStepId) => {
      // Can always go backwards
      if (step < currentStep) {
        persistCurrentValues();
        setCurrentStep(step);
        return;
      }

      // Going forward â€” validate all intermediate steps
      const storeData = useCompanyRegistrationStore.getState().data;
      const formValues = form.getValues();
      const values = { ...formValues, ...storeData };

      for (let s = currentStep; s < step; s++) {
        const schema = REGISTRATION_STEP_SCHEMAS[s];
        if (schema) {
          try {
            schema.parse(values);
          } catch {
            setCurrentStep(s as RegistrationStepId);
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
    const storeData = useCompanyRegistrationStore.getState().data;

    // Validate minimum requirements
    if (!storeData.companyName || !storeData.registrationNo) {
      showError("Please complete your company details.");
      setCurrentStep(1 as RegistrationStepId);
      return;
    }

    if (!storeData.adminFullName || !storeData.adminEmail) {
      showError("Please complete admin account details.");
      setCurrentStep(2 as RegistrationStepId);
      return;
    }

    if (!storeData.ssmDocumentUrl) {
      showError("Please upload your SSM registration certificate.");
      setCurrentStep(3 as RegistrationStepId);
      return;
    }

    if (!storeData.selectedPlanId) {
      showError("Please select a subscription plan.");
      setCurrentStep(4 as RegistrationStepId);
      return;
    }

    try {
      await registerMutation.mutateAsync({
        name: storeData.companyName,
        registrationNo: storeData.registrationNo,
        type: storeData.companyType as "PROPERTY_COMPANY" | "MANAGEMENT_COMPANY" | "AGENCY",
        email: storeData.companyEmail,
        phone: storeData.companyPhone,
        address: storeData.companyAddress || undefined,
      });

      markSubmitted();
      showSuccess(
        "Company registration submitted! Your application is pending verification."
      );
      router.push("/dashboard/(guest)/register/company/pending");
    } catch (err) {
      const error = err as AppError;

      // Set server-side field errors
      const fieldErrors = extractFieldErrors(error);
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof RegistrationFormValues, {
            type: "server",
            message,
          });
        });
      }

      showError(
        error.message || "Failed to submit registration. Please try again."
      );
    }
  }, [form, registerMutation, markSubmitted, router, setCurrentStep]);

  // ------------------------------------------------------------------
  // Render step content
  // ------------------------------------------------------------------

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepCompanyDetails />;
      case 2:
        return <StepAdminDetails />;
      case 3:
        return <StepDocuments />;
      case 4:
        return <StepPackageSelection />;
      case 5:
        return <StepPayment />;
      case 6:
        return <StepConfirmation />;
      default:
        return null;
    }
  };

  // If already submitted, show pending state
  if (isSubmitted) {
    return <VerificationPendingState onReset={reset} />;
  }

  return (
    <FormProvider {...form}>
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Step indicator */}
        <StepIndicator
          steps={REGISTRATION_STEPS}
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
            {currentStep < TOTAL_STEPS ? (
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
                Submit Registration
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
    readonly id: RegistrationStepId;
    readonly label: string;
    readonly description: string;
  }>;
  currentStep: number;
  onStepClick: (step: RegistrationStepId) => void;
}

function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <nav aria-label="Registration steps">
      <ol className="flex items-center gap-1">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <li key={step.id} className="flex flex-1 items-center gap-1">
              <button
                type="button"
                onClick={() => onStepClick(step.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
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
                <div className="hidden min-w-0 lg:block">
                  <div className="truncate text-xs font-medium">
                    {step.label}
                  </div>
                </div>
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "hidden h-px w-3 shrink-0 md:block",
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
// Verification Pending State
// ---------------------------------------------------------------------------

function VerificationPendingState({ onReset }: { onReset: () => void }) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg py-12 text-center space-y-6">
      <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
        <Building2 className="size-10 text-green-600" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Registration Submitted!
        </h2>
        <p className="text-muted-foreground">
          Your company registration has been submitted successfully. Our team
          will review your application and verify your documents within 1â€“2
          business days.
        </p>
      </div>
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-left space-y-2">
        <p className="font-medium">What happens next?</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Our team reviews your submitted documents</li>
          <li>You&apos;ll receive an email once verified</li>
          <li>After verification, you can access your company dashboard</li>
        </ul>
      </div>
      <div className="flex gap-3 justify-center">
        <Button
          variant="outline"
          onClick={() => {
            onReset();
            router.push("/dashboard/login/v1");
          }}
        >
          Go to Login
        </Button>
        <Button
          onClick={() => {
            onReset();
          }}
        >
          Register Another Company
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

export function CompanyRegistrationWizardSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Step indicator skeleton */}
      <div className="flex gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-1 items-center gap-1">
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

