// =============================================================================
// BulkOperations — Search Reindex & Expire Listings triggers
// =============================================================================

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangleIcon,
  Loader2Icon,
  RefreshCwIcon,
  TimerResetIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { useTriggerSearchReindex } from "../hooks/use-trigger-search-reindex";
import { useTriggerExpireListings } from "../hooks/use-trigger-expire-listings";
import type { BulkOperationResult } from "../types";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BulkOperations() {
  const reindexMutation = useTriggerSearchReindex();
  const expireMutation = useTriggerExpireListings();

  // Reindex options
  const [reindexVertical, setReindexVertical] = useState("");
  const [reindexDryRun, setReindexDryRun] = useState(false);

  // Expire options
  const [expireDaysStale, setExpireDaysStale] = useState("90");
  const [expireDryRun, setExpireDryRun] = useState(false);

  // Confirm dialog
  const [confirmType, setConfirmType] = useState<"reindex" | "expire" | null>(
    null
  );

  // Result display
  const [lastResult, setLastResult] = useState<{
    type: string;
    result: BulkOperationResult;
  } | null>(null);

  const handleConfirm = async () => {
    try {
      if (confirmType === "reindex") {
        const result = await reindexMutation.mutateAsync({
          verticalType: reindexVertical || undefined,
          dryRun: reindexDryRun,
        });
        setLastResult({ type: "Search Reindex", result });
        showSuccess(result.message || "Search reindex triggered");
      } else if (confirmType === "expire") {
        const result = await expireMutation.mutateAsync({
          daysStale: parseInt(expireDaysStale) || 90,
          dryRun: expireDryRun,
        });
        setLastResult({ type: "Expire Listings", result });
        showSuccess(result.message || "Expire listings triggered");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setConfirmType(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Search Reindex Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCwIcon className="h-5 w-5" />
              Search Reindex
            </CardTitle>
            <CardDescription>
              Trigger a full search index rebuild. This may take several minutes
              depending on the number of listings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reindex-vertical">
                Vertical Type (optional)
              </Label>
              <Input
                id="reindex-vertical"
                placeholder="e.g., real-estate (blank = all)"
                value={reindexVertical}
                onChange={(e) => setReindexVertical(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="reindex-dry-run"
                checked={reindexDryRun}
                onCheckedChange={setReindexDryRun}
              />
              <Label htmlFor="reindex-dry-run">Dry Run</Label>
            </div>
            <Button
              onClick={() => setConfirmType("reindex")}
              disabled={reindexMutation.isPending}
              className="w-full"
            >
              {reindexMutation.isPending && (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              )}
              Trigger Reindex
            </Button>
          </CardContent>
        </Card>

        {/* Expire Listings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TimerResetIcon className="h-5 w-5" />
              Expire Stale Listings
            </CardTitle>
            <CardDescription>
              Mark listings as expired if they have been published beyond the
              specified threshold.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expire-days">Days Stale Threshold</Label>
              <Input
                id="expire-days"
                type="number"
                min={1}
                max={365}
                value={expireDaysStale}
                onChange={(e) => setExpireDaysStale(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="expire-dry-run"
                checked={expireDryRun}
                onCheckedChange={setExpireDryRun}
              />
              <Label htmlFor="expire-dry-run">Dry Run</Label>
            </div>
            <Button
              onClick={() => setConfirmType("expire")}
              disabled={expireMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {expireMutation.isPending && (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              )}
              Trigger Expire
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Result Display */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2Icon className="h-5 w-5 text-green-500" />
              Last Operation Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{lastResult.type}</Badge>
                {lastResult.result.success ? (
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    Success
                  </Badge>
                ) : (
                  <Badge variant="destructive">Failed</Badge>
                )}
              </div>
              <p className="text-muted-foreground">{lastResult.result.message}</p>
              {lastResult.result.affected != null && (
                <p>
                  Affected records:{" "}
                  <strong>{lastResult.result.affected}</strong>
                </p>
              )}
              {lastResult.result.jobId && (
                <p className="font-mono text-xs">
                  Job ID: {lastResult.result.jobId}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmType}
        onOpenChange={(open) => !open && setConfirmType(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />
              {confirmType === "reindex"
                ? "Trigger Search Reindex"
                : "Trigger Expire Listings"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmType === "reindex" ? (
                <>
                  This will trigger a full search index rebuild
                  {reindexVertical
                    ? ` for vertical "${reindexVertical}"`
                    : " for all verticals"}
                  . {reindexDryRun ? "(Dry run — no changes will be made)" : "This may cause temporary search result inconsistencies."}
                </>
              ) : (
                <>
                  This will expire listings older than{" "}
                  <strong>{expireDaysStale}</strong> days.{" "}
                  {expireDryRun
                    ? "(Dry run — no changes will be made)"
                    : "This action cannot be undone."}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
