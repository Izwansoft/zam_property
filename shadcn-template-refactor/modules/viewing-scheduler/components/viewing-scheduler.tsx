// =============================================================================
// Viewing Scheduler — Property viewing appointment booking widget
// =============================================================================
// Full scheduler: date picker → time slot → visitor details → confirmation.
// Creates a BOOKING interaction via the existing interaction API.
// =============================================================================

"use client";

import { useState, useMemo, useCallback } from "react";
import {
  CalendarCheck,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import { useCreateInteraction } from "@/modules/interaction";

import {
  STANDARD_TIME_SLOTS,
  type StandardTimeSlot,
  type ViewingBookingRequest,
} from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ViewingSchedulerProps {
  listingId: string;
  listingTitle: string;
  vendorId: string;
  vendorName: string;
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

type Step = "date" | "time" | "details" | "confirm" | "success";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-MY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getMinDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1); // Minimum 1 day from now
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMaxDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 60); // Max 60 days out
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Simulate slot availability — in production this would be an API call.
 * Randomly mark ~25% of slots as unavailable.
 */
function getAvailableSlots(date: Date): Map<StandardTimeSlot, boolean> {
  const seed = date.getDate() + date.getMonth() * 31;
  const map = new Map<StandardTimeSlot, boolean>();
  STANDARD_TIME_SLOTS.forEach((slot, i) => {
    // Deterministic "random" based on date + slot index
    const available = (seed * 7 + i * 13) % 4 !== 0;
    map.set(slot, available);
  });
  return map;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ViewingScheduler({
  listingId,
  listingTitle,
  vendorId,
  vendorName,
}: ViewingSchedulerProps) {
  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<StandardTimeSlot | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const createInteraction = useCreateInteraction();

  const minDate = useMemo(() => getMinDate(), []);
  const maxDate = useMemo(() => getMaxDate(), []);
  const availableSlots = useMemo(
    () => (selectedDate ? getAvailableSlots(selectedDate) : new Map()),
    [selectedDate],
  );

  const canProceedToTime = !!selectedDate;
  const canProceedToDetails = !!selectedTime;
  const canSubmit =
    visitorName.trim().length > 0 &&
    visitorEmail.trim().length > 0 &&
    visitorPhone.trim().length > 0;

  // ---- Date Selection ----
  const handleDateSelect = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes
    if (date) {
      setStep("time");
    }
  }, []);

  // ---- Time Selection ----
  const handleTimeSelect = useCallback((time: StandardTimeSlot) => {
    setSelectedTime(time);
    setStep("details");
  }, []);

  // ---- Submit Booking ----
  const handleSubmit = useCallback(() => {
    if (!selectedDate || !selectedTime || !canSubmit) return;

    setStep("confirm");

    createInteraction.mutate(
      {
        vendorId,
        listingId,
        interactionType: "BOOKING",
        contactName: visitorName.trim(),
        contactEmail: visitorEmail.trim(),
        contactPhone: visitorPhone.trim(),
        message: `Viewing request for ${formatDate(selectedDate)} at ${selectedTime}${notes.trim() ? `\n\nNotes: ${notes.trim()}` : ""}`,
        source: "viewing-scheduler",
      },
      {
        onSuccess: (data) => {
          setReferenceId(data.referenceId ?? `VW-${Date.now().toString(36).toUpperCase()}`);
          setStep("success");
          showSuccess("Viewing request submitted successfully!");
        },
        onError: (error) => {
          showError(error.message || "Failed to submit viewing request.");
          setStep("details"); // Go back to form
        },
      },
    );
  }, [
    selectedDate,
    selectedTime,
    canSubmit,
    vendorId,
    listingId,
    visitorName,
    visitorEmail,
    visitorPhone,
    notes,
    createInteraction,
  ]);

  // ---- Reset ----
  const handleReset = useCallback(() => {
    setStep("date");
    setSelectedDate(undefined);
    setSelectedTime(null);
    setVisitorName("");
    setVisitorEmail("");
    setVisitorPhone("");
    setNotes("");
    setReferenceId(null);
  }, []);

  // ---- Step indicator ----
  const steps: { key: Step; label: string }[] = [
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "details", label: "Details" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <>
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Schedule a Viewing
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step indicator */}
          {step !== "success" && step !== "confirm" && (
            <div className="flex items-center gap-1 mb-4">
              {steps.map((s, i) => (
                <div key={s.key} className="flex items-center gap-1">
                  {i > 0 && (
                    <div
                      className={cn(
                        "h-px w-4",
                        i <= currentStepIndex
                          ? "bg-primary"
                          : "bg-muted-foreground/20",
                      )}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (i < currentStepIndex) {
                        setStep(s.key);
                      }
                    }}
                    disabled={i > currentStepIndex}
                    className={cn(
                      "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-colors",
                      i === currentStepIndex
                        ? "bg-primary text-primary-foreground font-medium"
                        : i < currentStepIndex
                          ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    <span className="h-4 w-4 flex items-center justify-center rounded-full text-[10px] font-bold">
                      {i + 1}
                    </span>
                    {s.label}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Step: Date */}
          {step === "date" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose your preferred viewing date
              </p>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < minDate || date > maxDate}
                className="rounded-md border mx-auto"
              />
            </div>
          )}

          {/* Step: Time */}
          {step === "time" && selectedDate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Available times for{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(selectedDate)}
                  </span>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("date")}
                  className="text-xs"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Change date
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {STANDARD_TIME_SLOTS.map((slot) => {
                  const available = availableSlots.get(slot) ?? true;
                  const isSelected = selectedTime === slot;
                  return (
                    <Button
                      key={slot}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      disabled={!available}
                      onClick={() => handleTimeSelect(slot)}
                      className={cn(
                        "justify-start",
                        !available && "opacity-40 line-through",
                      )}
                    >
                      <Clock className="mr-2 h-3.5 w-3.5" />
                      {slot}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step: Visitor Details */}
          {step === "details" && selectedDate && selectedTime && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {formatDate(selectedDate)} at {selectedTime}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    with {vendorName}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("time")}
                  className="text-xs"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Change
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="visitor-name" className="text-xs">
                    <User className="inline mr-1 h-3 w-3" />
                    Full Name *
                  </Label>
                  <Input
                    id="visitor-name"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Your full name"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="visitor-email" className="text-xs">
                    <Mail className="inline mr-1 h-3 w-3" />
                    Email *
                  </Label>
                  <Input
                    id="visitor-email"
                    type="email"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="visitor-phone" className="text-xs">
                    <Phone className="inline mr-1 h-3 w-3" />
                    Phone *
                  </Label>
                  <Input
                    id="visitor-phone"
                    type="tel"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    placeholder="+60 12-345 6789"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="visitor-notes" className="text-xs">
                    <FileText className="inline mr-1 h-3 w-3" />
                    Notes (optional)
                  </Label>
                  <Textarea
                    id="visitor-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or questions..."
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                <CalendarCheck className="mr-2 h-4 w-4" />
                Request Viewing
              </Button>
            </div>
          )}

          {/* Step: Confirming (loading) */}
          {step === "confirm" && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Submitting your viewing request...
              </p>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>

              <div>
                <h3 className="font-semibold">Viewing Requested!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your viewing request has been sent to{" "}
                  <span className="font-medium text-foreground">
                    {vendorName}
                  </span>
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-left space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedDate && formatDate(selectedDate)} at {selectedTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{listingTitle}</span>
                </div>
                {referenceId && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs">
                      Ref: {referenceId}
                    </Badge>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                The agent will confirm your appointment via email or phone.
              </p>

              <Button variant="outline" size="sm" onClick={handleReset}>
                Schedule Another Viewing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
