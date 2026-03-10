// =============================================================================
// VideoReviewPanel — Owner component to review and approve/reject video
// =============================================================================
// Shows in the owner's inspection detail view when status is VIDEO_SUBMITTED.
// Owner can approve the video or request a redo with notes.
// =============================================================================

"use client";

import { useState } from "react";
import {
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Loader2,
  Video,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useReviewVideo } from "../hooks";
import { InspectionStatus, canReviewVideo } from "../types";
import type { Inspection } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VideoReviewPanelProps {
  inspection: Inspection;
  /** Callback after review action completes */
  onReviewComplete?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VideoReviewPanel({
  inspection,
  onReviewComplete,
  className = "",
}: VideoReviewPanelProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRedoDialog, setShowRedoDialog] = useState(false);
  const [notes, setNotes] = useState("");

  const reviewMutation = useReviewVideo(inspection.id);

  // Only show when video can be reviewed
  if (!canReviewVideo(inspection)) {
    // Show status-specific messages
    if (inspection.status === InspectionStatus.VIDEO_REQUESTED) {
      return (
        <Card className={className}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Video className="h-4 w-4" />
              Video Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Awaiting Video</AlertTitle>
              <AlertDescription>
                A video inspection has been requested from the tenant.
                You&apos;ll be able to review it once submitted.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    if (
      inspection.status === InspectionStatus.ONSITE_PENDING ||
      inspection.status === InspectionStatus.COMPLETED ||
      inspection.status === InspectionStatus.REPORT_GENERATED
    ) {
      return (
        <Card className={className}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Video className="h-4 w-4" />
              Video Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Video Approved</AlertTitle>
              <AlertDescription>
                The inspection video has been reviewed and approved.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    return null;
  }

  const handleApprove = async () => {
    try {
      await reviewMutation.mutateAsync({
        decision: "APPROVED",
        notes: notes.trim() || undefined,
      });
      setShowApproveDialog(false);
      setNotes("");
      onReviewComplete?.();
    } catch {
      // Error is handled by mutation state
    }
  };

  const handleRequestRedo = async () => {
    try {
      await reviewMutation.mutateAsync({
        decision: "REQUEST_REDO",
        notes: notes.trim() || undefined,
      });
      setShowRedoDialog(false);
      setNotes("");
      onReviewComplete?.();
    } catch {
      // Error is handled by mutation state
    }
  };

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Video className="h-4 w-4" />
            Video Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Video Ready for Review</AlertTitle>
            <AlertDescription>
              The tenant has submitted a video inspection. Please review the
              video above and approve or request a redo.
              {inspection.videoSubmittedAt && (
                <span className="block mt-1 text-xs">
                  Submitted:{" "}
                  {new Date(inspection.videoSubmittedAt).toLocaleDateString(
                    "en-MY",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </span>
              )}
            </AlertDescription>
          </Alert>

          {reviewMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Review Failed</AlertTitle>
              <AlertDescription>
                {reviewMutation.error?.message ||
                  "Failed to submit review. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowApproveDialog(true)}
              disabled={reviewMutation.isPending}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve Video
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRedoDialog(true)}
              disabled={reviewMutation.isPending}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Request Redo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Video Inspection</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this video inspection? The
              inspection will move to the next stage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="approve-notes">Notes (optional)</Label>
            <Textarea
              id="approve-notes"
              placeholder="Add any notes about the approval..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={reviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={reviewMutation.isPending}
              className="gap-2"
            >
              {reviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Redo Dialog */}
      <Dialog open={showRedoDialog} onOpenChange={setShowRedoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Video Redo</DialogTitle>
            <DialogDescription>
              Please provide a reason for requesting the tenant to re-record
              the video inspection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="redo-notes">Reason for redo</Label>
            <Textarea
              id="redo-notes"
              placeholder="Please explain what needs to be re-recorded..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRedoDialog(false)}
              disabled={reviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRequestRedo}
              disabled={reviewMutation.isPending}
              className="gap-2"
            >
              {reviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Request Redo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
