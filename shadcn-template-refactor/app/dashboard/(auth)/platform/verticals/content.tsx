// =============================================================================
// Platform Verticals Management — DataTable-based vertical enablement
// =============================================================================
// Shows all predefined verticals from the catalog in a data table. Super Admin
// can enable, activate, deactivate, or delete verticals.
// =============================================================================

"use client";

import { useState, useCallback, useMemo } from "react";
import {
  CheckCircle2Icon,
  XCircleIcon,
  Trash2Icon,
  Loader2Icon,
  ShieldCheckIcon,
  PlusCircleIcon,
  PowerIcon,
  PowerOffIcon,
  MoreHorizontalIcon,
  ClockIcon,
  FlaskConicalIcon,
  WrenchIcon,
  CalendarIcon,
} from "lucide-react";
import { format, addHours } from "date-fns";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  useVerticalDefinitions,
  useVerticalHealth,
  useCreateVerticalDefinition,
  useActivateVerticalDefinition,
  useDeactivateVerticalDefinition,
  useDeleteVerticalDefinition,
  useSetVerticalMaintenance,
  VERTICAL_CATALOG,
} from "@/modules/vertical";
import type {
  VerticalDefinition,
  CreateVerticalDefinitionDto,
  VerticalCatalogEntry,
  VerticalHealthResponse,
  SetMaintenanceDto,
} from "@/modules/vertical";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VerticalStatus = "active" | "inactive" | "available" | "coming_soon" | "beta";

interface MergedVertical {
  catalog: VerticalCatalogEntry;
  definition: VerticalDefinition | null;
  status: VerticalStatus;
}

interface MaintenanceFormState {
  enabled: boolean;
  maintenanceType: "indefinite" | "scheduled";
  startAt: string;
  endAt: string;
  message: string;
}

const DEFAULT_MAINTENANCE_MESSAGE = "We're performing scheduled maintenance to improve your experience. Please check back soon.";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlatformVerticalsContent() {
  const { toast } = useToast();
  const [enableTarget, setEnableTarget] = useState<VerticalCatalogEntry | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<VerticalDefinition | null>(
    null
  );
  const [maintenanceTarget, setMaintenanceTarget] = useState<VerticalDefinition | null>(null);
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceFormState>({
    enabled: false,
    maintenanceType: "indefinite",
    startAt: "",
    endAt: "",
    message: "",
  });

  // ---- Data
  const { data, isLoading } = useVerticalDefinitions();
  const { data: healthData, isError: healthError } = useVerticalHealth();
  const createMutation = useCreateVerticalDefinition();
  const activateMutation = useActivateVerticalDefinition();
  const deactivateMutation = useDeactivateVerticalDefinition();
  const deleteMutation = useDeleteVerticalDefinition();
  const maintenanceMutation = useSetVerticalMaintenance();

  const verticals = data ?? [];

  // ---- Merge catalog with DB definitions and health status
  const mergedVerticals: MergedVertical[] = useMemo(() => {
    // Normalize DB types to uppercase for comparison with catalog
    const dbMap = new Map(verticals.map((v) => [v.type.toUpperCase(), v]));
    
    // Health data from backend (runtime detection)
    // If health endpoint fails or returns empty, fall back to catalog developmentStatus
    const hasHealthData = healthData && healthData.implementedCount > 0;
    const implementedTypes = new Set(
      (healthData?.implementedTypes ?? []).map((t) => t.toLowerCase())
    );
    const healthVerticals = healthData?.verticals ?? {};

    return VERTICAL_CATALOG.map((catalog) => {
      // Catalog uses SCREAMING_SNAKE (REAL_ESTATE), match with uppercase DB key
      const definition = dbMap.get(catalog.type) ?? null;
      // Normalize type for health comparison (backend uses snake_case)
      const normalizedType = catalog.type.toLowerCase().replace(/_/g, "_");
      const isImplemented = hasHealthData 
        ? implementedTypes.has(normalizedType)
        : catalog.developmentStatus === "READY"; // Fallback to catalog
      const healthEntry = healthVerticals[normalizedType];

      let status: VerticalStatus;
      
      if (definition) {
        // Enabled in DB
        status = definition.isActive ? "active" : "inactive";
      } else if (isImplemented) {
        // Backend module exists (or catalog says READY) but not enabled in DB
        const implStatus = healthEntry?.status ?? catalog.developmentStatus;
        if (implStatus === "BETA" || implStatus === "EXPERIMENTAL") {
          status = "beta";
        } else {
          status = "available";
        }
      } else {
        // Not implemented
        status = "coming_soon";
      }
      return { catalog, definition, status };
    });
  }, [verticals, healthData]);

  const activeCount = mergedVerticals.filter((v) => v.status === "active").length;
  const totalEnabled = mergedVerticals.filter((v) => v.definition !== null).length;
  const readyCount = mergedVerticals.filter(
    (v) => v.status === "available" || v.status === "beta"
  ).length;

  // ---- Enable (Create) a vertical from catalog
  const handleEnable = useCallback(() => {
    if (!enableTarget) return;

    const dto: CreateVerticalDefinitionDto = {
      // Backend expects lowercase snake_case type
      type: enableTarget.type.toLowerCase(),
      name: enableTarget.name,
      description: enableTarget.description,
      icon: enableTarget.iconName,
      color: enableTarget.color,
      attributeSchema: {},
      validationRules: {},
      searchMapping: {},
      isActive: true,
      isCore: enableTarget.isCore,
    };

    createMutation.mutate(dto, {
      onSuccess: () => {
        toast({
          title: "Vertical Enabled",
          description: `${enableTarget.name} is now active on the platform.`,
        });
        setEnableTarget(null);
      },
      onError: (err) => {
        toast({
          title: "Failed to Enable",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  }, [enableTarget, createMutation, toast]);

  // ---- Activate / Deactivate
  const handleToggleActive = useCallback(
    (v: VerticalDefinition) => {
      const mutation = v.isActive ? deactivateMutation : activateMutation;
      mutation.mutate(v.id, {
        onSuccess: () => {
          toast({
            title: v.isActive ? "Deactivated" : "Activated",
            description: `${v.name} has been ${v.isActive ? "deactivated" : "activated"}.`,
          });
        },
        onError: (err) => {
          toast({
            title: "Failed",
            description: err.message,
            variant: "destructive",
          });
        },
      });
    },
    [activateMutation, deactivateMutation, toast]
  );

  // ---- Delete
  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({
          title: "Deleted",
          description: `${deleteTarget.name} has been removed.`,
        });
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast({
          title: "Failed",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  }, [deleteTarget, deleteMutation, toast]);

  // ---- Open maintenance dialog
  const openMaintenanceDialog = useCallback((vertical: VerticalDefinition) => {
    // Pre-fill form with existing maintenance data
    const now = new Date();
    const defaultEnd = addHours(now, 2);
    
    // Determine maintenance type: if endAt exists, it's scheduled; otherwise indefinite
    const hasEndTime = !!vertical.maintenanceEndAt;
    
    setMaintenanceForm({
      enabled: vertical.maintenanceMode ?? false,
      maintenanceType: hasEndTime ? "scheduled" : "indefinite",
      startAt: vertical.maintenanceStartAt 
        ? format(new Date(vertical.maintenanceStartAt), "yyyy-MM-dd'T'HH:mm")
        : format(now, "yyyy-MM-dd'T'HH:mm"),
      endAt: vertical.maintenanceEndAt 
        ? format(new Date(vertical.maintenanceEndAt), "yyyy-MM-dd'T'HH:mm")
        : format(defaultEnd, "yyyy-MM-dd'T'HH:mm"),
      message: vertical.maintenanceMessage ?? DEFAULT_MAINTENANCE_MESSAGE,
    });
    setMaintenanceTarget(vertical);
  }, []);

  // ---- Set maintenance
  const handleSetMaintenance = useCallback(() => {
    if (!maintenanceTarget) return;

    // Build the DTO - note: `id` is used for the path, not sent in body
    // Only send endAt when maintenance type is "scheduled"
    const isScheduled = maintenanceForm.maintenanceType === "scheduled";
    
    const dto: SetMaintenanceDto & { id: string } = {
      id: maintenanceTarget.id,
      enabled: maintenanceForm.enabled,
      startAt: maintenanceForm.enabled && maintenanceForm.startAt 
        ? new Date(maintenanceForm.startAt).toISOString() 
        : undefined,
      // Only include endAt for scheduled maintenance
      endAt: maintenanceForm.enabled && isScheduled && maintenanceForm.endAt 
        ? new Date(maintenanceForm.endAt).toISOString() 
        : undefined,
      message: maintenanceForm.enabled && maintenanceForm.message 
        ? maintenanceForm.message 
        : undefined,
    };

    console.log("Maintenance DTO:", dto);

    maintenanceMutation.mutate(dto, {
      onSuccess: () => {
        const typeLabel = isScheduled ? "scheduled" : "indefinite";
        toast({
          title: maintenanceForm.enabled ? "Maintenance Enabled" : "Maintenance Disabled",
          description: maintenanceForm.enabled
            ? `${maintenanceTarget.name} is now under ${typeLabel} maintenance.`
            : `${maintenanceTarget.name} maintenance mode disabled.`,
        });
        setMaintenanceTarget(null);
      },
      onError: (err) => {
        console.error("Maintenance error:", err);
        toast({
          title: "Failed",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  }, [maintenanceTarget, maintenanceForm, maintenanceMutation, toast]);

  // ---- Status badge renderer
  const renderStatusBadge = (status: VerticalStatus) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="gap-1 text-xs">
            <CheckCircle2Icon className="h-3 w-3" />
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="outline" className="gap-1 text-xs">
            <XCircleIcon className="h-3 w-3" />
            Inactive
          </Badge>
        );
      case "available":
        return (
          <Badge variant="secondary" className="gap-1 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2Icon className="h-3 w-3" />
            Ready
          </Badge>
        );
      case "beta":
        return (
          <Badge variant="secondary" className="gap-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <FlaskConicalIcon className="h-3 w-3" />
            Beta
          </Badge>
        );
      case "coming_soon":
        return (
          <Badge variant="secondary" className="gap-1 text-xs text-muted-foreground">
            <ClockIcon className="h-3 w-3" />
            Coming Soon
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Types"
        description={`Manage marketplace types available on the platform. ${activeCount} active, ${totalEnabled} enabled of ${readyCount} ready (${VERTICAL_CATALOG.length} total planned).`}
      />

      {/* Data Table */}
      {isLoading ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-50">Vertical</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Core</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-3 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-50">Vertical</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Core</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {mergedVerticals.map(({ catalog, definition, status }) => {
                const Icon = catalog.icon;
                const isComingSoon = status === "coming_soon";
                return (
                  <TableRow
                    key={catalog.type}
                    className={isComingSoon ? "opacity-50" : ""}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${catalog.color}15` }}
                        >
                          <Icon
                            className="h-4 w-4"
                            style={{ color: catalog.color }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{catalog.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {catalog.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground font-mono">
                        {catalog.type}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderStatusBadge(status)}
                        {definition?.maintenanceMode && (
                          <Badge 
                            variant="outline" 
                            className="gap-1 text-xs border-amber-500 text-amber-600 dark:text-amber-400"
                          >
                            <WrenchIcon className="h-3 w-3" />
                            Maintenance
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {catalog.isCore ? (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <ShieldCheckIcon className="h-3 w-3" />
                          Core
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(status === "available" || status === "beta") ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEnableTarget(catalog)}
                        >
                          <PlusCircleIcon className="mr-1 h-3 w-3" />
                          Enable
                        </Button>
                      ) : status === "coming_soon" ? (
                        <span className="text-xs text-muted-foreground italic">
                          Not yet available
                        </span>
                      ) : definition ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontalIcon className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {status === "active" ? (
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(definition)}
                                disabled={
                                  activateMutation.isPending ||
                                  deactivateMutation.isPending
                                }
                              >
                                <PowerOffIcon className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(definition)}
                                disabled={
                                  activateMutation.isPending ||
                                  deactivateMutation.isPending
                                }
                              >
                                <PowerIcon className="mr-2 h-4 w-4" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openMaintenanceDialog(definition)}
                            >
                              <WrenchIcon className="mr-2 h-4 w-4" />
                              {definition.maintenanceMode ? "Edit Maintenance" : "Set Maintenance"}
                            </DropdownMenuItem>
                            {!catalog.isCore && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget(definition)}
                                >
                                  <Trash2Icon className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Enable Confirmation Dialog */}
      <Dialog
        open={!!enableTarget}
        onOpenChange={(open) => !open && setEnableTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Vertical</DialogTitle>
            <DialogDescription>
              This will register <strong>{enableTarget?.name}</strong> as an
              active vertical on the platform. Partners will be able to enable
              it for their marketplace.
            </DialogDescription>
          </DialogHeader>
          {enableTarget && (
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${enableTarget.color}15` }}
              >
                <enableTarget.icon
                  className="h-6 w-6"
                  style={{ color: enableTarget.color }}
                />
              </div>
              <div>
                <p className="font-medium">{enableTarget.name}</p>
                <p className="text-sm text-muted-foreground">
                  {enableTarget.description}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEnableTarget(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEnable}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Enabling…
                </>
              ) : (
                <>
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Enable Vertical
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vertical?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong>{" "}
              and all associated partner bindings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Maintenance Mode Dialog */}
      <Dialog
        open={!!maintenanceTarget}
        onOpenChange={(open) => !open && setMaintenanceTarget(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WrenchIcon className="h-5 w-5" />
              Maintenance Mode
            </DialogTitle>
            <DialogDescription>
              Configure maintenance mode for <strong>{maintenanceTarget?.name}</strong>.
              When enabled, partner portals, vendor portals, customer accounts, and public
              pages for this vertical will show a maintenance message.
              <span className="block mt-1 text-emerald-600 dark:text-emerald-400">
                Super Admin portal is NOT affected.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Enable Maintenance</Label>
                <p className="text-xs text-muted-foreground">
                  Toggle maintenance mode on or off
                </p>
              </div>
              <Switch
                checked={maintenanceForm.enabled}
                onCheckedChange={(checked) =>
                  setMaintenanceForm((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            {/* Only show fields when enabled */}
            {maintenanceForm.enabled && (
              <>
                {/* Maintenance Type */}
                <div className="space-y-3">
                  <Label>Maintenance Type</Label>
                  <RadioGroup
                    value={maintenanceForm.maintenanceType}
                    onValueChange={(value: "indefinite" | "scheduled") =>
                      setMaintenanceForm((prev) => ({ ...prev, maintenanceType: value }))
                    }
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="indefinite" id="type-indefinite" />
                      <div className="space-y-1">
                        <Label htmlFor="type-indefinite" className="cursor-pointer font-medium">
                          Indefinite
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Until further notice
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="scheduled" id="type-scheduled" />
                      <div className="space-y-1">
                        <Label htmlFor="type-scheduled" className="cursor-pointer font-medium">
                          Scheduled
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          With end time
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Start Time */}
                <div className="space-y-2">
                  <Label htmlFor="maintenance-start">
                    <CalendarIcon className="mr-1 inline h-3 w-3" />
                    Start Time
                  </Label>
                  <Input
                    id="maintenance-start"
                    type="datetime-local"
                    value={maintenanceForm.startAt}
                    onChange={(e) =>
                      setMaintenanceForm((prev) => ({
                        ...prev,
                        startAt: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    When maintenance begins
                  </p>
                </div>

                {/* End Time - Only for scheduled */}
                {maintenanceForm.maintenanceType === "scheduled" && (
                  <div className="space-y-2">
                    <Label htmlFor="maintenance-end">
                      <ClockIcon className="mr-1 inline h-3 w-3" />
                      End Time
                    </Label>
                    <Input
                      id="maintenance-end"
                      type="datetime-local"
                      value={maintenanceForm.endAt}
                      onChange={(e) =>
                        setMaintenanceForm((prev) => ({
                          ...prev,
                          endAt: e.target.value,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Maintenance will auto-stop when this time is reached
                    </p>
                  </div>
                )}

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="maintenance-message">Message</Label>
                  <Textarea
                    id="maintenance-message"
                    placeholder={DEFAULT_MAINTENANCE_MESSAGE}
                    value={maintenanceForm.message}
                    onChange={(e) =>
                      setMaintenanceForm((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Displayed to users during maintenance
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMaintenanceTarget(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetMaintenance}
              disabled={maintenanceMutation.isPending}
              variant={maintenanceForm.enabled ? "destructive" : "default"}
            >
              {maintenanceMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : maintenanceForm.enabled ? (
                <>
                  <WrenchIcon className="mr-2 h-4 w-4" />
                  Enable Maintenance
                </>
              ) : (
                <>
                  <CheckCircle2Icon className="mr-2 h-4 w-4" />
                  Disable Maintenance
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

