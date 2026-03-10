// =============================================================================
// JobDetailDialog — Full job detail view with JSON viewer & error trace
// =============================================================================

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RefreshCwIcon } from "lucide-react";
import type { Job } from "../types";
import {
  JOB_STATUS_LABELS,
  formatQueueName,
  formatJobTimestamp,
} from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface JobDetailDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry?: (job: Job) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JobDetailDialog({
  job,
  open,
  onOpenChange,
  onRetry,
}: JobDetailDialogProps) {
  if (!job) return null;

  const statusBadgeVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "failed":
        return "destructive";
      case "active":
        return "default";
      case "completed":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Job Detail
            <Badge variant={statusBadgeVariant(job.status)}>
              {JOB_STATUS_LABELS[job.status] ?? job.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {formatQueueName(job.queueName)} — {job.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Meta info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Job ID</p>
                <p className="font-mono">{job.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Queue</p>
                <p>{formatQueueName(job.queueName)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Attempts</p>
                <p>
                  {job.attempts} / {job.maxAttempts}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Progress</p>
                <p>{job.progress}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p>{formatJobTimestamp(job.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Processed</p>
                <p>{formatJobTimestamp(job.processedAt)}</p>
              </div>
              {job.completedAt && (
                <div>
                  <p className="text-muted-foreground">Completed</p>
                  <p>{formatJobTimestamp(job.completedAt)}</p>
                </div>
              )}
              {job.delay > 0 && (
                <div>
                  <p className="text-muted-foreground">Delay</p>
                  <p>{job.delay}ms</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Job Data */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Job Data</h4>
              <pre className="rounded-md border bg-muted p-3 text-xs overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(job.data, null, 2)}
              </pre>
            </div>

            {/* Return Value (if completed) */}
            {job.returnValue != null && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">Return Value</h4>
                  <pre className="rounded-md border bg-muted p-3 text-xs overflow-x-auto whitespace-pre-wrap">
                    {typeof job.returnValue === "string"
                      ? job.returnValue
                      : JSON.stringify(job.returnValue, null, 2)}
                  </pre>
                </div>
              </>
            )}

            {/* Error Info (if failed) */}
            {job.failedReason && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-destructive">
                    Error
                  </h4>
                  <p className="text-sm text-destructive mb-2">
                    {job.failedReason}
                  </p>
                  {job.stackTrace && job.stackTrace.length > 0 && (
                    <pre className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs overflow-x-auto whitespace-pre-wrap">
                      {job.stackTrace.join("\n")}
                    </pre>
                  )}
                </div>
              </>
            )}

            {/* Retry button for failed jobs */}
            {job.status === "failed" && onRetry && (
              <>
                <Separator />
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRetry(job)}
                  >
                    <RefreshCwIcon className="mr-2 h-4 w-4" />
                    Retry Job
                  </Button>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
