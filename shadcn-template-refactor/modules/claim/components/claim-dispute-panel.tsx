// =============================================================================
// ClaimDisputePanel — Tenant component to dispute a claim decision
// =============================================================================
// Shows in the tenant's claim detail view when the claim has been
// approved, partially approved, or rejected.
// =============================================================================

"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useDisputeClaim } from "../hooks";
import { canDisputeClaim } from "../types";
import type { Claim } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ClaimDisputePanelProps {
  claim: Claim;
  /** Callback after dispute action completes */
  onDisputeComplete?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClaimDisputePanel({
  claim,
  onDisputeComplete,
  className = "",
}: ClaimDisputePanelProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const disputeMutation = useDisputeClaim(claim.id);

  if (!canDisputeClaim(claim)) {
    return null;
  }

  const handleDispute = async () => {
    try {
      await disputeMutation.mutateAsync({
        reason,
        notes: notes || undefined,
      });
      setShowDialog(false);
      setReason("");
      setNotes("");
      onDisputeComplete?.();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Dispute Decision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If you disagree with the claim decision, you can dispute it. The
            claim will be sent back for review.
          </p>
          <Button
            variant="outline"
            onClick={() => setShowDialog(true)}
            disabled={disputeMutation.isPending}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Dispute this Decision
          </Button>
        </CardContent>
      </Card>

      {/* Dispute Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispute Claim Decision</DialogTitle>
            <DialogDescription>
              Explain why you disagree with the decision. The claim will be sent
              back for review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="dispute-reason">
                Reason for dispute <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="dispute-reason"
                placeholder="Explain why you disagree with the decision..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1.5 min-h-24"
              />
            </div>
            <div>
              <Label htmlFor="dispute-notes">Additional notes (optional)</Label>
              <Textarea
                id="dispute-notes"
                placeholder="Any additional information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {disputeMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {disputeMutation.error.message || "Failed to submit dispute"}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDispute}
              disabled={disputeMutation.isPending || !reason.trim()}
            >
              {disputeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="mr-2 h-4 w-4" />
              )}
              Submit Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
