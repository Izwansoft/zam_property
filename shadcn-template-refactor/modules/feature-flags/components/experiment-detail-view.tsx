// =============================================================================
// ExperimentDetailView — Full detail page for a single experiment
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeftIcon,
  FlaskConicalIcon,
  UsersIcon,
  FlagIcon,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

import { useExperimentDetail } from "../hooks/use-experiment-detail";
import { useOptInPartnerExperiment } from "../hooks/use-opt-in-partner-experiment";
import type { Experiment } from "../types";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

interface ExperimentDetailViewProps {
  experimentKey: string;
}

export function ExperimentDetailView({
  experimentKey,
}: ExperimentDetailViewProps) {
  const {
    data: experiment,
    isLoading,
    error,
  } = useExperimentDetail(experimentKey);
  const [showOptIn, setShowOptIn] = useState(false);

  if (isLoading) {
    return <ExperimentDetailSkeleton />;
  }

  if (error || !experiment) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/platform/experiments">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Experiments
          </Link>
        </Button>
        <div className="rounded-lg border border-destructive/50 p-6 text-center">
          <p className="text-destructive">
            {error?.message ?? "Experiment not found"}
          </p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const startsAt = new Date(experiment.startsAt);
  const endsAt = new Date(experiment.endsAt);
  const isRunning = experiment.isActive && startsAt <= now && endsAt >= now;
  const isScheduled = experiment.isActive && startsAt > now;
  const isEnded = endsAt < now;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/platform/experiments">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Experiments
        </Link>
      </Button>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2 font-mono text-lg">
                  <FlaskConicalIcon className="h-5 w-5" />
                  {experiment.key}
                </CardTitle>
                {isEnded ? (
                  <Badge variant="secondary">Ended</Badge>
                ) : isRunning ? (
                  <Badge className="bg-green-600/10 text-green-700 dark:text-green-400">
                    Running
                  </Badge>
                ) : isScheduled ? (
                  <Badge variant="outline">Scheduled</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              <CardDescription>{experiment.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <InfoItem label="Owner" value={experiment.owner} />
            <InfoItem
              label="Active"
              value={experiment.isActive ? "Yes" : "No"}
            />
            <InfoItem
              label="Starts"
              value={format(startsAt, "PPpp")}
            />
            <InfoItem label="Ends" value={format(endsAt, "PPpp")} />
            {experiment.successMetrics && (
              <InfoItem
                label="Success Metrics"
                value={experiment.successMetrics}
              />
            )}
            {experiment.featureFlagKey && (
              <div>
                <p className="text-xs text-muted-foreground">
                  Linked Feature Flag
                </p>
                <Link
                  href={`/dashboard/platform/feature-flags/${experiment.featureFlagKey}`}
                  className="text-sm font-medium font-mono text-primary hover:underline"
                >
                  <FlagIcon className="mr-1 inline h-3 w-3" />
                  {experiment.featureFlagKey}
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Variants Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variants</CardTitle>
          <CardDescription>
            Traffic split across experiment variants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {experiment.variants.map((variant) => (
              <div
                key={variant.key}
                className="flex items-center gap-4"
              >
                <span className="font-mono text-sm w-32">
                  {variant.key}
                </span>
                <div className="flex-1">
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${variant.weight}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {variant.weight}%
                </span>
              </div>
            ))}
            <div className="mt-2 text-xs text-muted-foreground">
              Total:{" "}
              {experiment.variants.reduce(
                (sum, v) => sum + v.weight,
                0
              )}
              %
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partner Opt-In */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                Partner Opt-In
              </CardTitle>
              <CardDescription>
                Manage which partners participate in this experiment.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOptIn(true)}
            >
              Manage Opt-In
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Audit Link */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link
            href={`/dashboard/platform/audit?targetType=experiment&targetId=${experiment.id}`}
          >
            View Audit History
          </Link>
        </Button>
      </div>

      {/* Opt-In Dialog */}
      <PartnerOptInDialog
        open={showOptIn}
        onOpenChange={setShowOptIn}
        experimentKey={experiment.key}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// InfoItem helper
// ---------------------------------------------------------------------------

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PartnerOptInDialog
// ---------------------------------------------------------------------------

function PartnerOptInDialog({
  open,
  onOpenChange,
  experimentKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experimentKey: string;
}) {
  const optIn = useOptInPartnerExperiment();
  const [partnerId, setPartnerId] = useState("");
  const [optInValue, setOptInValue] = useState(true);

  const handleSubmit = () => {
    if (!partnerId) return;
    optIn.mutate(
      { experimentKey, partnerId, optIn: optInValue },
      {
        onSuccess: () => {
          showSuccess(
            optInValue
              ? "Partner opted in"
              : "Partner opted out"
          );
          onOpenChange(false);
          setPartnerId("");
          setOptInValue(true);
        },
        onError: (err) => showError(err.message),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partner Opt-In</DialogTitle>
          <DialogDescription>
            Opt a partner in or out of experiment{" "}
            <code className="text-sm font-mono">{experimentKey}</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Partner ID</label>
            <Input
              className="font-mono"
              placeholder="uuid"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Opt In</label>
            <Switch
              checked={optInValue}
              onCheckedChange={setOptInValue}
            />
            <span className="text-sm text-muted-foreground">
              {optInValue ? "Opt In" : "Opt Out"}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={optIn.isPending || !partnerId}
          >
            {optIn.isPending ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ExperimentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
