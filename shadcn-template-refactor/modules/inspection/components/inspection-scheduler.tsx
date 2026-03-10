// =============================================================================
// InspectionScheduler — Schedule inspection form with calendar + time + type
// =============================================================================

"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  ClipboardCheck,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  InspectionType,
  INSPECTION_TYPE_CONFIG,
  INSPECTION_TIME_SLOTS,
} from "../types";
import type { ScheduleInspectionDto } from "../types";
import { useScheduleInspection } from "../hooks";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InspectionSchedulerProps {
  /** Pre-selected tenancy ID */
  tenancyId: string;
  /** Available tenancies for selection (if tenancyId not provided) */
  tenancies?: Array<{ id: string; property?: { title: string } }>;
  /** Callback on successful schedule */
  onSuccess?: (inspectionId: string) => void;
  /** Callback on cancel */
  onCancel?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InspectionScheduler({
  tenancyId,
  tenancies,
  onSuccess,
  onCancel,
}: InspectionSchedulerProps) {
  // Form state
  const [selectedTenancyId, setSelectedTenancyId] = useState(tenancyId);
  const [type, setType] = useState<InspectionType>(InspectionType.PERIODIC);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [videoRequested, setVideoRequested] = useState(false);
  const [onsiteRequired, setOnsiteRequired] = useState(true);
  const [notes, setNotes] = useState("");

  // Mutation
  const scheduleMutation = useScheduleInspection();

  const handleSubmit = async () => {
    if (!selectedTenancyId) return;

    const dto: ScheduleInspectionDto = {
      tenancyId: selectedTenancyId,
      type,
      ...(date && { scheduledDate: format(date, "yyyy-MM-dd") }),
      ...(timeSlot && { scheduledTime: timeSlot }),
      videoRequested,
      onsiteRequired,
      ...(notes.trim() && { notes: notes.trim() }),
    };

    scheduleMutation.mutate(dto, {
      onSuccess: (data) => {
        onSuccess?.(data.id);
      },
    });
  };

  const isValid = !!selectedTenancyId && !!type;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Schedule Inspection</h3>
          <p className="text-sm text-muted-foreground">
            Schedule a property inspection
          </p>
        </div>
      </div>

      {/* Tenancy Selection (if multiple tenancies available) */}
      {tenancies && tenancies.length > 1 && !tenancyId && (
        <div className="space-y-2">
          <Label>Property</Label>
          <Select value={selectedTenancyId} onValueChange={setSelectedTenancyId}>
            <SelectTrigger>
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {tenancies.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.property?.title ?? t.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Inspection Type */}
      <div className="space-y-2">
        <Label>Inspection Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(INSPECTION_TYPE_CONFIG).map(([key, config]) => {
            const TypeIcon = config.icon;
            const isSelected = type === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setType(key as InspectionType)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <TypeIcon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                <div className="min-w-0">
                  <p className={cn("text-sm font-medium", isSelected && "text-primary")}>
                    {config.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {config.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scheduled Date */}
      <div className="space-y-2">
        <Label>Preferred Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Select a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Slot */}
      <div className="space-y-2">
        <Label>Preferred Time Slot</Label>
        <Select value={timeSlot} onValueChange={setTimeSlot}>
          <SelectTrigger>
            <SelectValue placeholder="Select a time slot" />
          </SelectTrigger>
          <SelectContent>
            {INSPECTION_TIME_SLOTS.map((slot) => (
              <SelectItem key={slot.value} value={slot.value}>
                {slot.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="video-requested" className="cursor-pointer">Video Inspection</Label>
            <p className="text-xs text-muted-foreground">
              Request a video walkthrough before onsite visit
            </p>
          </div>
          <Switch
            id="video-requested"
            checked={videoRequested}
            onCheckedChange={setVideoRequested}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="onsite-required" className="cursor-pointer">Onsite Required</Label>
            <p className="text-xs text-muted-foreground">
              Physical inspection visit is required
            </p>
          </div>
          <Switch
            id="onsite-required"
            checked={onsiteRequired}
            onCheckedChange={setOnsiteRequired}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any specific areas to inspect or concerns..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Error */}
      {scheduleMutation.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {scheduleMutation.error.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!isValid || scheduleMutation.isPending}
        >
          {scheduleMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Schedule Inspection
        </Button>
      </div>
    </div>
  );
}
