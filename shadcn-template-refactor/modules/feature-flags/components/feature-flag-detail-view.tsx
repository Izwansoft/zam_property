// =============================================================================
// FeatureFlagDetailView — Full detail page for a single feature flag
// =============================================================================
// Shows: overview, overrides table, user targets table
// =============================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeftIcon,
  AlertTriangleIcon,
  PlusIcon,
  UserPlusIcon,
  ArchiveIcon,
  ArchiveRestoreIcon,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

import { useFeatureFlagDetail } from "../hooks/use-feature-flag-detail";
import { useUpdateFeatureFlag } from "../hooks/use-update-feature-flag";
import { useAddFlagOverride } from "../hooks/use-add-flag-override";
import { useAddFlagUserTarget } from "../hooks/use-add-flag-user-target";
import type {
  FeatureFlagDetail,
  FeatureFlagType,
  AddFlagOverrideDto,
  AddFlagUserTargetDto,
} from "../types";
import { FLAG_TYPE_LABELS, FLAG_TYPE_COLORS } from "../types";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

interface FeatureFlagDetailViewProps {
  flagKey: string;
}

export function FeatureFlagDetailView({ flagKey }: FeatureFlagDetailViewProps) {
  const router = useRouter();
  const { data: flag, isLoading, error } = useFeatureFlagDetail(flagKey);
  const updateFlag = useUpdateFeatureFlag();

  // Dialogs state
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showAddOverride, setShowAddOverride] = useState(false);
  const [showAddUserTarget, setShowAddUserTarget] = useState(false);
  const [editingPercentage, setEditingPercentage] = useState(false);
  const [percentageValue, setPercentageValue] = useState<string>("");

  if (isLoading) {
    return <FeatureFlagDetailSkeleton />;
  }

  if (error || !flag) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/platform/feature-flags">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Flags
          </Link>
        </Button>
        <div className="rounded-lg border border-destructive/50 p-6 text-center">
          <p className="text-destructive">
            {error?.message ?? "Feature flag not found"}
          </p>
        </div>
      </div>
    );
  }

  const isKillSwitch =
    flag.key.includes("kill-switch") || flag.key.includes("emergency");

  const handleToggle = () => {
    updateFlag.mutate(
      { key: flag.key, defaultValue: !flag.defaultValue },
      {
        onSuccess: () => {
          showSuccess(
            `Flag ${!flag.defaultValue ? "enabled" : "disabled"}`
          );
          setShowToggleConfirm(false);
        },
        onError: (err) => showError(err.message),
      }
    );
  };

  const handleArchiveToggle = () => {
    updateFlag.mutate(
      { key: flag.key, isArchived: !flag.isArchived },
      {
        onSuccess: () => {
          showSuccess(
            flag.isArchived ? "Flag restored" : "Flag archived"
          );
          setShowArchiveConfirm(false);
        },
        onError: (err) => showError(err.message),
      }
    );
  };

  const handlePercentageUpdate = () => {
    const value = Number(percentageValue);
    if (isNaN(value) || value < 0 || value > 100) return;
    updateFlag.mutate(
      { key: flag.key, rolloutPercentage: value },
      {
        onSuccess: () => {
          showSuccess(`Rollout updated to ${value}%`);
          setEditingPercentage(false);
        },
        onError: (err) => showError(err.message),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/platform/feature-flags">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Flags
        </Link>
      </Button>

      {/* Overview Card */}
      <Card
        className={
          isKillSwitch
            ? "border-red-300 dark:border-red-800"
            : ""
        }
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <CardTitle className="font-mono text-lg">
                  {flag.key}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={FLAG_TYPE_COLORS[flag.type as FeatureFlagType]}
                >
                  {FLAG_TYPE_LABELS[flag.type as FeatureFlagType]}
                </Badge>
                {isKillSwitch && (
                  <Badge variant="destructive">
                    <AlertTriangleIcon className="mr-1 h-3 w-3" />
                    Kill Switch
                  </Badge>
                )}
                {flag.isArchived && (
                  <Badge variant="secondary">
                    <ArchiveIcon className="mr-1 h-3 w-3" />
                    Archived
                  </Badge>
                )}
              </div>
              <CardDescription>{flag.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowArchiveConfirm(true)}
              >
                {flag.isArchived ? (
                  <>
                    <ArchiveRestoreIcon className="mr-2 h-4 w-4" />
                    Restore
                  </>
                ) : (
                  <>
                    <ArchiveIcon className="mr-2 h-4 w-4" />
                    Archive
                  </>
                )}
              </Button>
              <Switch
                checked={flag.defaultValue}
                onCheckedChange={() => setShowToggleConfirm(true)}
                disabled={flag.isArchived}
                className={
                  isKillSwitch
                    ? "data-[state=checked]:bg-red-600"
                    : ""
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <InfoItem label="Owner" value={flag.owner} />
            <InfoItem
              label="Default Value"
              value={flag.defaultValue ? "Enabled" : "Disabled"}
            />
            {flag.type === "PERCENTAGE" && (
              <div>
                <p className="text-xs text-muted-foreground">Rollout %</p>
                {editingPercentage ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={percentageValue}
                      onChange={(e) => setPercentageValue(e.target.value)}
                      className="h-7 w-20 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={handlePercentageUpdate}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => setEditingPercentage(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <p
                    className="text-sm font-medium cursor-pointer hover:text-primary"
                    onClick={() => {
                      setPercentageValue(
                        String(flag.rolloutPercentage ?? 0)
                      );
                      setEditingPercentage(true);
                    }}
                  >
                    {flag.rolloutPercentage ?? 0}%
                  </p>
                )}
              </div>
            )}
            <InfoItem
              label="Created"
              value={format(new Date(flag.createdAt), "PP")}
            />
            <InfoItem
              label="Updated"
              value={format(new Date(flag.updatedAt), "PPpp")}
            />
            {flag.expiresAt && (
              <InfoItem
                label="Expires"
                value={format(new Date(flag.expiresAt), "PP")}
              />
            )}
            {flag.reviewAt && (
              <InfoItem
                label="Review At"
                value={format(new Date(flag.reviewAt), "PP")}
              />
            )}
          </div>

          {(flag.allowedVerticals.length > 0 ||
            flag.allowedRoles.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {flag.allowedVerticals.map((v) => (
                <Badge key={v} variant="outline">
                  Vertical: {v}
                </Badge>
              ))}
              {flag.allowedRoles.map((r) => (
                <Badge key={r} variant="outline">
                  Role: {r}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overrides Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Overrides</CardTitle>
              <CardDescription>
                Partner, vertical, or role-specific overrides. Resolution order:
                emergency → partner → vertical → percentage → default.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddOverride(true)}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Override
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner ID</TableHead>
                <TableHead>Vertical</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Rollout %</TableHead>
                <TableHead>Emergency</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!flag.overrides || flag.overrides.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-6 text-center text-muted-foreground"
                  >
                    No overrides configured.
                  </TableCell>
                </TableRow>
              ) : (
                flag.overrides.map((override) => (
                  <TableRow key={override.id}>
                    <TableCell className="font-mono text-xs">
                      {override.partnerId ?? "—"}
                    </TableCell>
                    <TableCell>{override.verticalType ?? "—"}</TableCell>
                    <TableCell>{override.role ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          override.value ? "default" : "secondary"
                        }
                      >
                        {override.value ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {override.rolloutPercentage != null
                        ? `${override.rolloutPercentage}%`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {override.isEmergency && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangleIcon className="mr-1 h-3 w-3" />
                          Emergency
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(override.createdAt), "PP")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Targets Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">User Targets</CardTitle>
              <CardDescription>
                Per-user feature flag targeting for testing or gradual rollout.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddUserTarget(true)}
            >
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Add User Target
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!flag.userTargets || flag.userTargets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-muted-foreground"
                  >
                    No user targets configured.
                  </TableCell>
                </TableRow>
              ) : (
                flag.userTargets.map((target) => (
                  <TableRow key={target.id}>
                    <TableCell className="font-mono text-xs">
                      {target.partnerId}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {target.userId}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          target.value ? "default" : "secondary"
                        }
                      >
                        {target.value ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(target.createdAt), "PP")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Audit Link */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link
            href={`/dashboard/platform/audit?targetType=feature_flag&targetId=${flag.id}`}
          >
            View Audit History
          </Link>
        </Button>
      </div>

      {/* Toggle Confirm Dialog */}
      <AlertDialog
        open={showToggleConfirm}
        onOpenChange={setShowToggleConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {flag.defaultValue ? "Disable" : "Enable"} Feature Flag?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to{" "}
              <strong>{flag.defaultValue ? "disable" : "enable"}</strong>{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                {flag.key}
              </code>
              . This change takes effect immediately and will be audited.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle}>
              {updateFlag.isPending ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirm Dialog */}
      <AlertDialog
        open={showArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {flag.isArchived ? "Restore" : "Archive"} Feature Flag?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {flag.isArchived
                ? "Restoring will make this flag active again."
                : "Archiving will prevent this flag from being toggled. It can be restored later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveToggle}>
              {flag.isArchived ? "Restore" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Override Dialog */}
      <AddOverrideDialog
        open={showAddOverride}
        onOpenChange={setShowAddOverride}
        flagKey={flag.key}
      />

      {/* Add User Target Dialog */}
      <AddUserTargetDialog
        open={showAddUserTarget}
        onOpenChange={setShowAddUserTarget}
        flagKey={flag.key}
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
// Add Override Dialog
// ---------------------------------------------------------------------------

function AddOverrideDialog({
  open,
  onOpenChange,
  flagKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flagKey: string;
}) {
  const addOverride = useAddFlagOverride();
  const [partnerId, setPartnerId] = useState("");
  const [verticalType, setVerticalType] = useState("");
  const [role, setRole] = useState("");
  const [value, setValue] = useState(true);
  const [isEmergency, setIsEmergency] = useState(false);
  const [rolloutPercentage, setRolloutPercentage] = useState("");

  const handleSubmit = () => {
    const dto: AddFlagOverrideDto & { flagKey: string } = {
      flagKey,
      value,
      isEmergency,
    };
    if (partnerId) dto.partnerId = partnerId;
    if (verticalType) dto.verticalType = verticalType;
    if (role) dto.role = role;
    if (rolloutPercentage)
      dto.rolloutPercentage = Number(rolloutPercentage);

    addOverride.mutate(dto, {
      onSuccess: () => {
        showSuccess("Override added");
        onOpenChange(false);
        resetForm();
      },
      onError: (err) => showError(err.message),
    });
  };

  const resetForm = () => {
    setPartnerId("");
    setVerticalType("");
    setRole("");
    setValue(true);
    setIsEmergency(false);
    setRolloutPercentage("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Override</DialogTitle>
          <DialogDescription>
            Create a scope-specific override for{" "}
            <code className="text-sm font-mono">{flagKey}</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Partner ID (optional)</label>
            <Input
              className="font-mono"
              placeholder="uuid"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">
                Vertical (optional)
              </label>
              <Input
                placeholder="real_estate"
                value={verticalType}
                onChange={(e) => setVerticalType(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role (optional)</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="PARTNER_ADMIN">Partner Admin</SelectItem>
                  <SelectItem value="VENDOR_ADMIN">Vendor Admin</SelectItem>
                  <SelectItem value="VENDOR_STAFF">Vendor Staff</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Value</label>
              <Switch checked={value} onCheckedChange={setValue} />
              <span className="text-sm text-muted-foreground">
                {value ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Emergency</label>
              <Switch
                checked={isEmergency}
                onCheckedChange={setIsEmergency}
                className="data-[state=checked]:bg-red-600"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">
              Rollout % (optional)
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="0-100"
              value={rolloutPercentage}
              onChange={(e) => setRolloutPercentage(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={addOverride.isPending}>
            {addOverride.isPending ? "Adding..." : "Add Override"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Add User Target Dialog
// ---------------------------------------------------------------------------

function AddUserTargetDialog({
  open,
  onOpenChange,
  flagKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flagKey: string;
}) {
  const addUserTarget = useAddFlagUserTarget();
  const [partnerId, setPartnerId] = useState("");
  const [userId, setUserId] = useState("");
  const [value, setValue] = useState(true);

  const handleSubmit = () => {
    if (!partnerId || !userId) return;
    addUserTarget.mutate(
      { flagKey, partnerId, userId, value },
      {
        onSuccess: () => {
          showSuccess("User target added");
          onOpenChange(false);
          setPartnerId("");
          setUserId("");
          setValue(true);
        },
        onError: (err) => showError(err.message),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User Target</DialogTitle>
          <DialogDescription>
            Target a specific user for flag{" "}
            <code className="text-sm font-mono">{flagKey}</code>.
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
          <div>
            <label className="text-sm font-medium">User ID</label>
            <Input
              className="font-mono"
              placeholder="uuid"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Value</label>
            <Switch checked={value} onCheckedChange={setValue} />
            <span className="text-sm text-muted-foreground">
              {value ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={addUserTarget.isPending || !partnerId || !userId}
          >
            {addUserTarget.isPending ? "Adding..." : "Add Target"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function FeatureFlagDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
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
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
