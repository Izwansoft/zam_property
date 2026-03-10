// =============================================================================
// Partner Verticals Management — Enable/Disable verticals for this partner
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import {
  PlusIcon,
  XCircleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  LayersIcon,
  SettingsIcon,
} from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  usePartnerVerticals,
  useEnablePartnerVertical,
  useDisablePartnerVertical,
} from "@/modules/vertical/hooks/use-partner-verticals";
import { useActiveVerticalDefinitions } from "@/modules/vertical/hooks/use-vertical-definitions";
import type {
  PartnerVertical,
  VerticalDefinition,
  EnableVerticalDto,
} from "@/modules/vertical/types";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartnerVerticalsContent() {
  const { toast } = useToast();
  const [showEnable, setShowEnable] = useState(false);
  const [disableTarget, setDisableTarget] = useState<PartnerVertical | null>(
    null
  );
  const [selectedType, setSelectedType] = useState("");
  const [listingLimit, setListingLimit] = useState("");

  // ---- Data
  const { data: pvData, isLoading: pvLoading } = usePartnerVerticals();
  const { data: allDefs } = useActiveVerticalDefinitions();
  const enableMutation = useEnablePartnerVertical();
  const disableMutation = useDisablePartnerVertical();

  const partnerVerticals = pvData?.items ?? [];
  const enabledTypes = new Set(partnerVerticals.map((pv) => pv.vertical.type));

  // Available verticals that haven't been enabled yet
  const availableVerticals = (allDefs ?? []).filter(
    (d: VerticalDefinition) => !enabledTypes.has(d.type)
  );

  // ---- Enable
  const handleEnable = useCallback(() => {
    if (!selectedType) return;

    const dto: EnableVerticalDto = {
      verticalType: selectedType,
      ...(listingLimit ? { listingLimit: parseInt(listingLimit, 10) } : {}),
    };

    enableMutation.mutate(dto, {
      onSuccess: () => {
        toast({ title: "Vertical Enabled", description: `${selectedType} enabled.` });
        setShowEnable(false);
        setSelectedType("");
        setListingLimit("");
      },
      onError: (err) => {
        toast({
          title: "Failed",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  }, [selectedType, listingLimit, enableMutation, toast]);

  // ---- Disable
  const handleDisable = useCallback(() => {
    if (!disableTarget) return;
    disableMutation.mutate(disableTarget.vertical.type, {
      onSuccess: () => {
        toast({
          title: "Vertical Disabled",
          description: `${disableTarget.vertical.name} has been disabled.`,
        });
        setDisableTarget(null);
      },
      onError: (err) => {
        toast({
          title: "Failed",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  }, [disableTarget, disableMutation, toast]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verticals"
        description="Manage which business verticals are enabled for your partner."
        actions={
          availableVerticals.length > 0
            ? [
                {
                  label: "Enable Vertical",
                  icon: PlusIcon,
                  onClick: () => setShowEnable(true),
                },
              ]
            : undefined
        }
      />

      {/* Enabled Verticals */}
      {pvLoading ? (
        <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
          <Loader2Icon className="h-5 w-5 animate-spin" />
          Loading verticals…
        </div>
      ) : partnerVerticals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <LayersIcon className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="font-semibold">No Verticals Enabled</h3>
              <p className="text-sm text-muted-foreground">
                Enable a vertical to start listing in that category.
              </p>
            </div>
            {availableVerticals.length > 0 && (
              <Button onClick={() => setShowEnable(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Enable Vertical
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partnerVerticals.map((pv) => (
            <Card key={pv.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">
                    {pv.vertical.name}
                  </CardTitle>
                  <Badge
                    variant={pv.isEnabled ? "default" : "outline"}
                    className="text-xs"
                  >
                    {pv.isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <CardDescription className="text-xs font-mono">
                  {pv.vertical.type}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pv.listingLimit && (
                  <p className="text-sm text-muted-foreground">
                    Listing Limit:{" "}
                    <span className="font-medium text-foreground">
                      {pv.listingLimit}
                    </span>
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  Enabled{" "}
                  {new Date(pv.enabledAt).toLocaleDateString("en-MY", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDisableTarget(pv)}
                  >
                    <XCircleIcon className="mr-1 h-3 w-3" />
                    Disable
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Enable Dialog */}
      <Dialog open={showEnable} onOpenChange={setShowEnable}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Vertical</DialogTitle>
            <DialogDescription>
              Select a vertical to enable for your partner.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Vertical Type *</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vertical" />
                </SelectTrigger>
                <SelectContent>
                  {availableVerticals.map((d: VerticalDefinition) => (
                    <SelectItem key={d.id} value={d.type}>
                      {d.name} ({d.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="limitInput">
                Listing Limit (optional)
              </Label>
              <Input
                id="limitInput"
                type="number"
                placeholder="e.g., 100"
                value={listingLimit}
                onChange={(e) => setListingLimit(e.target.value)}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Max listings allowed for this vertical. Leave empty for unlimited.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnable(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEnable}
              disabled={!selectedType || enableMutation.isPending}
            >
              {enableMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Enabling…
                </>
              ) : (
                <>
                  <CheckCircle2Icon className="mr-2 h-4 w-4" />
                  Enable
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation */}
      <AlertDialog
        open={!!disableTarget}
        onOpenChange={(open) => !open && setDisableTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Vertical?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disable{" "}
              <strong>{disableTarget?.vertical.name}</strong> for your partner.
              Existing listings won&apos;t be deleted but may become hidden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disableMutation.isPending ? "Disabling…" : "Disable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
