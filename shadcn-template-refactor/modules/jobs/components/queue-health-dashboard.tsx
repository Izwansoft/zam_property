// =============================================================================
// QueueHealthDashboard — Overview cards + per-queue stats table
// =============================================================================

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { useJobsHealth } from "../hooks/use-jobs-health";
import { usePauseQueue } from "../hooks/use-pause-queue";
import { useResumeQueue } from "../hooks/use-resume-queue";
import { useRetryAllFailed } from "../hooks/use-retry-all-failed";
import { useCleanQueue } from "../hooks/use-clean-queue";
import { formatQueueName } from "../types";
import type { QueueStats } from "../types";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function QueueHealthSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QueueHealthDashboardProps {
  pollingEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QueueHealthDashboard({
  pollingEnabled,
}: QueueHealthDashboardProps) {
  const { data, isLoading, error } = useJobsHealth(pollingEnabled);
  const pauseQueue = usePauseQueue();
  const resumeQueue = useResumeQueue();
  const retryAllFailed = useRetryAllFailed();
  const cleanQueue = useCleanQueue();

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{
    type: "pause" | "resume" | "retryAll" | "clean";
    queueName: string;
  } | null>(null);

  if (isLoading) return <QueueHealthSkeleton />;

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertTriangleIcon className="mx-auto h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-muted-foreground">
            Failed to load queue health: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const handleConfirm = async () => {
    if (!confirmAction) return;

    try {
      switch (confirmAction.type) {
        case "pause":
          await pauseQueue.mutateAsync(confirmAction.queueName);
          showSuccess(`Queue "${confirmAction.queueName}" paused`);
          break;
        case "resume":
          await resumeQueue.mutateAsync(confirmAction.queueName);
          showSuccess(`Queue "${confirmAction.queueName}" resumed`);
          break;
        case "retryAll":
          await retryAllFailed.mutateAsync(confirmAction.queueName);
          showSuccess(
            `Retrying all failed jobs in "${confirmAction.queueName}"`
          );
          break;
        case "clean":
          await cleanQueue.mutateAsync({
            queueName: confirmAction.queueName,
          });
          showSuccess(`Queue "${confirmAction.queueName}" cleaned`);
          break;
      }
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Action failed"
      );
    } finally {
      setConfirmAction(null);
    }
  };

  const confirmLabels = {
    pause: { title: "Pause Queue", description: "This will pause job processing. Already-running jobs will finish." },
    resume: { title: "Resume Queue", description: "This will resume job processing for this queue." },
    retryAll: { title: "Retry All Failed", description: "This will retry all failed jobs in this queue. This may cause high load." },
    clean: { title: "Clean Queue", description: "This will remove completed and failed jobs from this queue." },
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <OverviewCard
          title="Total Queues"
          value={data.totalQueues}
          icon={<ActivityIcon className="h-4 w-4 text-muted-foreground" />}
        />
        <OverviewCard
          title="Active Jobs"
          value={data.activeJobs}
          icon={<Loader2Icon className="h-4 w-4 text-blue-500" />}
          variant={data.activeJobs > 0 ? "blue" : undefined}
        />
        <OverviewCard
          title="Failed Jobs"
          value={data.failedJobs}
          icon={<AlertTriangleIcon className="h-4 w-4 text-red-500" />}
          variant={data.failedJobs > 0 ? "red" : undefined}
        />
        <OverviewCard
          title="Waiting Jobs"
          value={data.waitingJobs}
          icon={<ClockIcon className="h-4 w-4 text-yellow-500" />}
          variant={data.waitingJobs > 0 ? "yellow" : undefined}
        />
      </div>

      {/* Per-Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Status</CardTitle>
          <CardDescription>
            Per-queue job counts and management actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="text-right">Waiting</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead className="text-right">Delayed</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.queues.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                  >
                    No queues found
                  </TableCell>
                </TableRow>
              ) : (
                data.queues.map((queue) => (
                  <QueueRow
                    key={queue.name}
                    queue={queue}
                    onAction={(type) =>
                      setConfirmAction({ type, queueName: queue.name })
                    }
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction && confirmLabels[confirmAction.type].title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction && confirmLabels[confirmAction.type].description}
              {confirmAction && (
                <>
                  <br />
                  Queue: <strong>{formatQueueName(confirmAction.queueName)}</strong>
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function OverviewCard({
  title,
  value,
  icon,
  variant,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: "blue" | "red" | "yellow";
}) {
  const colorClass =
    variant === "blue"
      ? "text-blue-600"
      : variant === "red"
        ? "text-red-600"
        : variant === "yellow"
          ? "text-yellow-600"
          : "";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function QueueRow({
  queue,
  onAction,
}: {
  queue: QueueStats;
  onAction: (type: "pause" | "resume" | "retryAll" | "clean") => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {formatQueueName(queue.name)}
      </TableCell>
      <TableCell className="text-right">{queue.active}</TableCell>
      <TableCell className="text-right">{queue.waiting}</TableCell>
      <TableCell className="text-right">{queue.completed}</TableCell>
      <TableCell className="text-right">
        <span className={queue.failed > 0 ? "text-red-600 font-semibold" : ""}>
          {queue.failed}
        </span>
      </TableCell>
      <TableCell className="text-right">{queue.delayed}</TableCell>
      <TableCell className="text-center">
        {queue.paused ? (
          <Badge variant="secondary">Paused</Badge>
        ) : (
          <Badge variant="outline" className="text-green-600 border-green-300">
            Running
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontalIcon className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {queue.paused ? (
              <DropdownMenuItem onClick={() => onAction("resume")}>
                <PlayCircleIcon className="mr-2 h-4 w-4" />
                Resume
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onAction("pause")}>
                <PauseCircleIcon className="mr-2 h-4 w-4" />
                Pause
              </DropdownMenuItem>
            )}
            {queue.failed > 0 && (
              <DropdownMenuItem onClick={() => onAction("retryAll")}>
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                Retry All Failed
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onAction("clean")}>
              <Trash2Icon className="mr-2 h-4 w-4" />
              Clean Queue
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
