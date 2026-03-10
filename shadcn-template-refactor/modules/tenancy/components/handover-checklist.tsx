// =============================================================================
// HandoverChecklist — Property handover checklist for move-in
// =============================================================================
// Tracks handover items before activating a tenancy.
// Includes keys, utilities, inventory, and other move-in checklist items.
// =============================================================================

"use client";

import { useState } from "react";
import {
  Key,
  Zap,
  Droplets,
  Wifi,
  ClipboardList,
  Camera,
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  CalendarCheck,
  User,
  Building2,
  Clock,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";
import { TenancyStatus, type TenancyDetail } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChecklistItem {
  id: string;
  label: string;
  category: ChecklistCategory;
  isRequired: boolean;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

type ChecklistCategory =
  | "KEYS"
  | "UTILITIES"
  | "INVENTORY"
  | "DOCUMENTATION"
  | "INSPECTION";

interface CategoryConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const CATEGORY_CONFIG: Record<ChecklistCategory, CategoryConfig> = {
  KEYS: {
    label: "Keys & Access",
    icon: Key,
    description: "Keys, access cards, and security codes",
  },
  UTILITIES: {
    label: "Utilities Setup",
    icon: Zap,
    description: "Utility connections and meter readings",
  },
  INVENTORY: {
    label: "Property Inventory",
    icon: ClipboardList,
    description: "Furniture, appliances, and fixtures",
  },
  DOCUMENTATION: {
    label: "Documentation",
    icon: FileText,
    description: "Signed documents and agreements",
  },
  INSPECTION: {
    label: "Move-in Inspection",
    icon: Camera,
    description: "Property condition documentation",
  },
};

// ---------------------------------------------------------------------------
// Default checklist items
// ---------------------------------------------------------------------------

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Keys
  { id: "1", label: "Main door key (2 sets)", category: "KEYS", isRequired: true, isCompleted: false },
  { id: "2", label: "Mailbox key", category: "KEYS", isRequired: true, isCompleted: false },
  { id: "3", label: "Access card/fob", category: "KEYS", isRequired: false, isCompleted: false },
  { id: "4", label: "Gate remote", category: "KEYS", isRequired: false, isCompleted: false },
  { id: "5", label: "Parking card", category: "KEYS", isRequired: false, isCompleted: false },

  // Utilities
  { id: "6", label: "Electricity account transferred", category: "UTILITIES", isRequired: true, isCompleted: false },
  { id: "7", label: "Water account transferred", category: "UTILITIES", isRequired: true, isCompleted: false },
  { id: "8", label: "Internet setup confirmed", category: "UTILITIES", isRequired: false, isCompleted: false },
  { id: "9", label: "Gas account transferred", category: "UTILITIES", isRequired: false, isCompleted: false },
  { id: "10", label: "Meter readings recorded", category: "UTILITIES", isRequired: true, isCompleted: false },

  // Inventory
  { id: "11", label: "Furniture inventory signed", category: "INVENTORY", isRequired: true, isCompleted: false },
  { id: "12", label: "Appliances working condition verified", category: "INVENTORY", isRequired: true, isCompleted: false },
  { id: "13", label: "Air conditioning serviced", category: "INVENTORY", isRequired: false, isCompleted: false },
  { id: "14", label: "Water heater checked", category: "INVENTORY", isRequired: false, isCompleted: false },

  // Documentation
  { id: "15", label: "Tenancy agreement signed", category: "DOCUMENTATION", isRequired: true, isCompleted: false },
  { id: "16", label: "House rules acknowledged", category: "DOCUMENTATION", isRequired: true, isCompleted: false },
  { id: "17", label: "Emergency contacts provided", category: "DOCUMENTATION", isRequired: true, isCompleted: false },
  { id: "18", label: "Insurance details recorded", category: "DOCUMENTATION", isRequired: false, isCompleted: false },

  // Inspection
  { id: "19", label: "Move-in photos taken", category: "INSPECTION", isRequired: true, isCompleted: false },
  { id: "20", label: "Condition report signed", category: "INSPECTION", isRequired: true, isCompleted: false },
  { id: "21", label: "Defects noted (if any)", category: "INSPECTION", isRequired: false, isCompleted: false },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface HandoverChecklistProps {
  tenancy: TenancyDetail;
  /** Optional external checklist data */
  checklist?: ChecklistItem[];
  /** Callback when checklist is updated */
  onUpdate?: (items: ChecklistItem[]) => void;
  /** Callback when handover is complete */
  onComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Category Checklist Group
// ---------------------------------------------------------------------------

interface ChecklistGroupProps {
  category: ChecklistCategory;
  items: ChecklistItem[];
  onToggle: (itemId: string) => void;
  onAddNote: (itemId: string, note: string) => void;
}

function ChecklistGroup({ category, items, onToggle, onAddNote }: ChecklistGroupProps) {
  const [isOpen, setIsOpen] = useState(true);
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  const completedCount = items.filter((i) => i.isCompleted).length;
  const requiredCount = items.filter((i) => i.isRequired).length;
  const requiredCompleted = items.filter((i) => i.isRequired && i.isCompleted).length;

  const allRequiredDone = requiredCompleted === requiredCount;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`rounded-md p-2 ${allRequiredDone ? "bg-green-100" : "bg-muted"}`}>
                <Icon className={`h-4 w-4 ${allRequiredDone ? "text-green-600" : "text-muted-foreground"}`} />
              </div>
              <div>
                <span className="font-medium">{config.label}</span>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={allRequiredDone ? "success" : "secondary"}>
                {completedCount}/{items.length}
              </Badge>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/50"
              >
                <Checkbox
                  id={`item-${item.id}`}
                  checked={item.isCompleted}
                  onCheckedChange={() => onToggle(item.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`item-${item.id}`}
                    className={`text-sm cursor-pointer ${
                      item.isCompleted ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {item.label}
                    {item.isRequired && (
                      <span className="ml-1 text-destructive">*</span>
                    )}
                  </label>
                  {item.completedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Completed {new Date(item.completedAt).toLocaleDateString()}
                      {item.completedBy && ` by ${item.completedBy}`}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Note: {item.notes}
                    </p>
                  )}
                </div>
                {item.isCompleted && (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Complete Handover Dialog
// ---------------------------------------------------------------------------

interface CompleteHandoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenancy: TenancyDetail;
  onConfirm: () => void;
  isLoading?: boolean;
}

function CompleteHandoverDialog({
  open,
  onOpenChange,
  tenancy,
  onConfirm,
  isLoading,
}: CompleteHandoverDialogProps) {
  const [handoverDate, setHandoverDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm();
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-green-600" />
            Complete Property Handover
          </DialogTitle>
          <DialogDescription>
            Confirm that all handover items have been completed and the partner
            has taken possession of the property.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property:</span>
              <span className="font-medium">{tenancy.property.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit:</span>
              <span className="font-medium">
                {tenancy.unit?.unitNumber || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date:</span>
              <span className="font-medium">
                {new Date(tenancy.startDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="handoverDate">Handover Date</Label>
            <Input
              id="handoverDate"
              type="date"
              value={handoverDate}
              onChange={(e) => setHandoverDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="handoverNotes">Additional Notes (Optional)</Label>
            <Textarea
              id="handoverNotes"
              placeholder="Any special conditions or notes about the handover..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200 flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              This will activate the tenancy and start the rental period. Make
              sure all deposits have been received.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Processing..." : "Complete Handover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function HandoverChecklist({
  tenancy,
  checklist: externalChecklist,
  onUpdate,
  onComplete,
}: HandoverChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(
    externalChecklist || DEFAULT_CHECKLIST
  );
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only show during APPROVED status (ready for handover)
  if (tenancy.status !== TenancyStatus.APPROVED) {
    return null;
  }

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<ChecklistCategory, ChecklistItem[]>);

  // Calculate progress
  const totalItems = items.length;
  const completedItems = items.filter((i) => i.isCompleted).length;
  const requiredItems = items.filter((i) => i.isRequired);
  const requiredCompleted = requiredItems.filter((i) => i.isCompleted).length;
  const allRequiredDone = requiredCompleted === requiredItems.length;
  const progressPercentage = (completedItems / totalItems) * 100;

  const handleToggle = (itemId: string) => {
    const updated = items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            isCompleted: !item.isCompleted,
            completedAt: !item.isCompleted ? new Date().toISOString() : undefined,
          }
        : item
    );
    setItems(updated);
    onUpdate?.(updated);
  };

  const handleAddNote = (itemId: string, note: string) => {
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, notes: note } : item
    );
    setItems(updated);
    onUpdate?.(updated);
  };

  const handleCompleteHandover = async () => {
    setIsSubmitting(true);
    try {
      // In real app, this would call an API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showSuccess("Property handover completed! Tenancy is now active.");
      setShowCompleteDialog(false);
      onComplete?.();
    } catch (error) {
      showError("Failed to complete handover");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-amber-100 p-2">
              <ClipboardList className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-base">Handover Checklist</CardTitle>
              <CardDescription>
                Complete all required items before activating the tenancy
              </CardDescription>
            </div>
          </div>
          <Badge variant={allRequiredDone ? "success" : "warning"}>
            {allRequiredDone ? "Ready" : `${requiredItems.length - requiredCompleted} required left`}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span>
              {completedItems} of {totalItems} items ({Math.round(progressPercentage)}%)
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Category groups */}
        {(Object.keys(CATEGORY_CONFIG) as ChecklistCategory[]).map((category) => {
          const categoryItems = groupedItems[category];
          if (!categoryItems || categoryItems.length === 0) return null;
          return (
            <ChecklistGroup
              key={category}
              category={category}
              items={categoryItems}
              onToggle={handleToggle}
              onAddNote={handleAddNote}
            />
          );
        })}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex w-full items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="text-destructive">*</span> Required items must be
            completed
          </p>
          <Button
            onClick={() => setShowCompleteDialog(true)}
            disabled={!allRequiredDone}
            className="bg-green-600 hover:bg-green-700"
          >
            <CalendarCheck className="mr-2 h-4 w-4" />
            Complete Handover
          </Button>
        </div>
      </CardFooter>

      {/* Complete dialog */}
      <CompleteHandoverDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        tenancy={tenancy}
        onConfirm={handleCompleteHandover}
        isLoading={isSubmitting}
      />
    </Card>
  );
}
