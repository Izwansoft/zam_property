// =============================================================================
// TenancyBookingWizard — Multi-step booking wizard for tenancy applications
// =============================================================================
// 4-step wizard:
// 1. Confirm property details
// 2. Personal verification (link to onboarding if needed)
// 3. Deposit payment intent
// 4. Confirmation
//
// Entry point: From listing detail page → "Book This Property" → Dialog
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, addYears, addMonths } from "date-fns";
import {
  Home,
  User,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Calendar,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";
import { useAuth } from "@/modules/auth";

import { useCreateTenancy, type CreateTenancyDto } from "../hooks/useTenancyMutations";
import { TenancyType } from "../types";
import {
  PaymentStep,
  PaymentSuccess,
  PaymentFailed,
  type PaymentDetails,
} from "./payment-step";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BookingPropertyInfo {
  /** Listing ID */
  id: string;
  /** Property/listing title */
  title: string;
  /** Property ID (may be same as id if no separate property entity) */
  propertyId: string;
  /** Vendor/owner ID */
  vendorId: string;
  /** Monthly rent */
  price: number;
  /** Currency */
  currency: string;
  /** Primary image URL */
  primaryImage?: string | null;
  /** Location info */
  location?: {
    address?: string;
    city?: string;
    state?: string;
  };
  /** Property attributes */
  attributes?: Record<string, unknown>;
}

interface TenancyBookingWizardProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to close the dialog */
  onOpenChange: (open: boolean) => void;
  /** Property information from the listing */
  property: BookingPropertyInfo;
}

// ---------------------------------------------------------------------------
// Step Configuration
// ---------------------------------------------------------------------------

const BOOKING_STEPS = [
  { id: 1, title: "Property Details", icon: Home },
  { id: 2, title: "Verification", icon: User },
  { id: 3, title: "Payment", icon: CreditCard },
  { id: 4, title: "Confirmation", icon: CheckCircle2 },
] as const;

type BookingStepId = (typeof BOOKING_STEPS)[number]["id"];

// ---------------------------------------------------------------------------
// Booking State
// ---------------------------------------------------------------------------

interface BookingState {
  tenancyType: TenancyType;
  startDate: string;
  duration: number; // months
  monthlyRent: number;
  securityDeposit: number;
  utilityDeposit: number;
  currency: string;
  paymentDetails?: PaymentDetails;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TenancyBookingWizard({
  open,
  onOpenChange,
  property,
}: TenancyBookingWizardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const createTenancy = useCreateTenancy();

  const [currentStep, setCurrentStep] = useState<BookingStepId>(1);
  const [bookingState, setBookingState] = useState<BookingState>(() => ({
    tenancyType: TenancyType.RESIDENTIAL,
    startDate: format(addMonths(new Date(), 1), "yyyy-MM-dd"),
    duration: 12,
    monthlyRent: property.price,
    securityDeposit: property.price * 2,
    utilityDeposit: 500,
    currency: property.currency || "MYR",
  }));
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "succeeded" | "failed">("pending");
  const [createdTenancyId, setCreatedTenancyId] = useState<string | null>(null);

  // Check if user has completed onboarding
  const isOnboardingComplete = Boolean(user?.isOnboarded);

  // Calculate end date
  const endDate = format(
    addMonths(new Date(bookingState.startDate), bookingState.duration),
    "yyyy-MM-dd"
  );

  // Total deposit
  const totalDeposit = bookingState.securityDeposit + bookingState.utilityDeposit;

  // Step navigation
  const goNext = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as BookingStepId);
    }
  }, [currentStep]);

  const goPrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as BookingStepId);
    }
  }, [currentStep]);

  // Handle payment completion
  const handlePaymentComplete = useCallback(
    async (details: PaymentDetails) => {
      setBookingState((prev) => ({ ...prev, paymentDetails: details }));

      if (details.status === "succeeded") {
        setPaymentStatus("succeeded");

        // Create tenancy booking
        try {
          const dto: CreateTenancyDto = {
            listingId: property.id,
            propertyId: property.propertyId,
            ownerId: property.vendorId,
            type: bookingState.tenancyType,
            startDate: bookingState.startDate,
            endDate,
            monthlyRent: bookingState.monthlyRent,
            currency: bookingState.currency,
            securityDeposit: bookingState.securityDeposit,
            utilityDeposit: bookingState.utilityDeposit,
            paymentIntentId: details.paymentIntentId,
          };

          const result = await createTenancy.mutateAsync(dto);
          setCreatedTenancyId(result.id);
          showSuccess("Booking submitted successfully!");
          goNext();
        } catch (error) {
          showError("Failed to create booking. Please contact support.");
          setPaymentStatus("failed");
        }
      } else {
        setPaymentStatus("failed");
      }
    },
    [property, bookingState, endDate, createTenancy, goNext]
  );

  // Handle booking completion
  const handleComplete = useCallback(() => {
    onOpenChange(false);
    if (createdTenancyId) {
      router.push(`/dashboard/tenant/tenancy/${createdTenancyId}`);
    } else {
      router.push("/dashboard/tenant/tenancy");
    }
  }, [createdTenancyId, onOpenChange, router]);

  // Reset wizard on close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state after dialog closes
      setTimeout(() => {
        setCurrentStep(1);
        setPaymentStatus("pending");
        setCreatedTenancyId(null);
        setBookingState({
          tenancyType: TenancyType.RESIDENTIAL,
          startDate: format(addMonths(new Date(), 1), "yyyy-MM-dd"),
          duration: 12,
          monthlyRent: property.price,
          securityDeposit: property.price * 2,
          utilityDeposit: 500,
          currency: property.currency || "MYR",
        });
      }, 200);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Book This Property</DialogTitle>
          <DialogDescription>
            Complete the steps below to submit your tenancy application.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="mx-auto mb-6 w-full max-w-md">
          <div className="flex items-center justify-between">
            {BOOKING_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <div key={step.id} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : isCompleted
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-1 text-xs",
                        isActive || isCompleted
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < BOOKING_STEPS.length - 1 && (
                    <div
                      className={cn(
                        "mx-2 h-0.5 flex-1",
                        step.id < currentStep ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Step Content */}
        <div className="min-h-[300px]">
          {/* Step 1: Property Details */}
          {currentStep === 1 && (
            <StepPropertyDetails
              property={property}
              bookingState={bookingState}
              onUpdateState={setBookingState}
              endDate={endDate}
              totalDeposit={totalDeposit}
            />
          )}

          {/* Step 2: Verification */}
          {currentStep === 2 && (
            <StepVerification
              isAuthenticated={isAuthenticated}
              isOnboardingComplete={isOnboardingComplete}
              user={user}
            />
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && paymentStatus === "pending" && (
            <PaymentStep
              depositAmount={totalDeposit}
              currency={bookingState.currency}
              onPaymentComplete={handlePaymentComplete}
              isProcessing={createTenancy.isPending}
              listingTitle={property.title}
              securityDeposit={bookingState.securityDeposit}
              utilityDeposit={bookingState.utilityDeposit}
            />
          )}

          {currentStep === 3 && paymentStatus === "failed" && (
            <PaymentFailed onRetry={() => setPaymentStatus("pending")} />
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <StepConfirmation
              property={property}
              bookingState={bookingState}
              endDate={endDate}
              tenancyId={createdTenancyId}
            />
          )}
        </div>

        <Separator className="my-6" />

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentStep === 1 || currentStep === 4}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep < 3 && (
            <Button
              onClick={goNext}
              disabled={
                currentStep === 2 && (!isAuthenticated || !isOnboardingComplete)
              }
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {currentStep === 4 && (
            <Button onClick={handleComplete}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              View My Tenancy
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Property Details
// ---------------------------------------------------------------------------

interface StepPropertyDetailsProps {
  property: BookingPropertyInfo;
  bookingState: BookingState;
  onUpdateState: (state: BookingState | ((prev: BookingState) => BookingState)) => void;
  endDate: string;
  totalDeposit: number;
}

function StepPropertyDetails({
  property,
  bookingState,
  onUpdateState,
  endDate,
  totalDeposit,
}: StepPropertyDetailsProps) {
  const attributes = property.attributes || {};

  return (
    <div className="space-y-6">
      {/* Property Summary */}
      <Card>
        <CardContent className="flex gap-4 pt-6">
          {property.primaryImage && (
            <div className="h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
              <img
                src={property.primaryImage}
                alt={property.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold">{property.title}</h3>
            {property.location?.address && (
              <p className="text-sm text-muted-foreground">
                {property.location.address}
              </p>
            )}
            {property.location?.city && (
              <p className="text-sm text-muted-foreground">
                {property.location.city}
                {property.location.state ? `, ${property.location.state}` : ""}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              {typeof attributes.bedrooms === "number" && (
                <Badge variant="secondary">{attributes.bedrooms} Beds</Badge>
              )}
              {typeof attributes.bathrooms === "number" && (
                <Badge variant="secondary">{attributes.bathrooms} Baths</Badge>
              )}
              {typeof attributes.builtUpSize === "number" && (
                <Badge variant="secondary">{attributes.builtUpSize} sq ft</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenancy Configuration */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tenancyType">Tenancy Type</Label>
          <Select
            value={bookingState.tenancyType}
            onValueChange={(value) =>
              onUpdateState((prev) => ({
                ...prev,
                tenancyType: value as TenancyType,
              }))
            }
          >
            <SelectTrigger id="tenancyType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TenancyType.RESIDENTIAL}>Residential</SelectItem>
              <SelectItem value={TenancyType.COMMERCIAL}>Commercial</SelectItem>
              <SelectItem value={TenancyType.SHORT_TERM}>Short-Term</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={bookingState.startDate}
            min={format(new Date(), "yyyy-MM-dd")}
            onChange={(e) =>
              onUpdateState((prev) => ({
                ...prev,
                startDate: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Lease Duration</Label>
          <Select
            value={bookingState.duration.toString()}
            onValueChange={(value) =>
              onUpdateState((prev) => ({
                ...prev,
                duration: parseInt(value, 10),
              }))
            }
          >
            <SelectTrigger id="duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 Months</SelectItem>
              <SelectItem value="12">12 Months (1 Year)</SelectItem>
              <SelectItem value="24">24 Months (2 Years)</SelectItem>
              <SelectItem value="36">36 Months (3 Years)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            {format(new Date(endDate), "dd MMM yyyy")}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monthly Rent</span>
            <span className="font-medium">
              {formatCurrency(bookingState.monthlyRent, bookingState.currency)}/month
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Security Deposit (2 months)
            </span>
            <span>
              {formatCurrency(bookingState.securityDeposit, bookingState.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Utility Deposit</span>
            <span>
              {formatCurrency(bookingState.utilityDeposit, bookingState.currency)}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-medium">Total Deposit Required</span>
            <span className="text-lg font-semibold text-primary">
              {formatCurrency(totalDeposit, bookingState.currency)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Verification
// ---------------------------------------------------------------------------

interface StepVerificationProps {
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  user: ReturnType<typeof useAuth>["user"];
}

function StepVerification({
  isAuthenticated,
  isOnboardingComplete,
  user,
}: StepVerificationProps) {
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
          <AlertTriangle className="h-8 w-8 text-yellow-600" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">Login Required</h3>
        <p className="mb-6 max-w-sm text-muted-foreground">
          Please log in or create an account to continue with your booking.
        </p>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <a href="/login">
              Log In
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button asChild>
            <a href="/register">
              Create Account
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (!isOnboardingComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
          <User className="h-8 w-8 text-yellow-600" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">Complete Your Profile</h3>
        <p className="mb-6 max-w-sm text-muted-foreground">
          Before you can book a property, please complete your tenant profile
          verification. This helps landlords review your application.
        </p>
        <Button asChild>
          <a href="/dashboard/tenant/onboarding">
            Complete Verification
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-200">
          Verification Complete
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          Your profile has been verified. You can proceed with the booking.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Full Name</span>
            <span className="font-medium">{user?.fullName || "—"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email || "—"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Phone</span>
            <span>{user?.phone || "—"}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Verification Status</span>
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Verified
            </Badge>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        This information will be shared with the property owner for your
        application.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Confirmation
// ---------------------------------------------------------------------------

interface StepConfirmationProps {
  property: BookingPropertyInfo;
  bookingState: BookingState;
  endDate: string;
  tenancyId: string | null;
}

function StepConfirmation({
  property,
  bookingState,
  endDate,
  tenancyId,
}: StepConfirmationProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">Booking Submitted!</h3>
        <p className="max-w-sm text-muted-foreground">
          Your tenancy application has been submitted successfully. The property
          owner will review your application.
        </p>
        {tenancyId && (
          <p className="mt-2 text-xs text-muted-foreground">
            Booking Reference: {tenancyId}
          </p>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Property</span>
            <span className="max-w-50 truncate font-medium">
              {property.title}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tenancy Period</span>
            <span>
              {format(new Date(bookingState.startDate), "dd MMM yyyy")} -{" "}
              {format(new Date(endDate), "dd MMM yyyy")}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monthly Rent</span>
            <span>
              {formatCurrency(bookingState.monthlyRent, bookingState.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Deposit Paid</span>
            <span>
              {formatCurrency(
                bookingState.securityDeposit + bookingState.utilityDeposit,
                bookingState.currency
              )}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="secondary">Pending Review</Badge>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Home className="h-4 w-4" />
        <AlertTitle>What&apos;s Next?</AlertTitle>
        <AlertDescription className="mt-2 space-y-1">
          <p>1. The property owner will review your application (1-3 days).</p>
          <p>2. If approved, you&apos;ll receive the tenancy agreement to sign.</p>
          <p>3. After signing, arrange for property handover.</p>
        </AlertDescription>
      </Alert>
    </div>
  );
}

