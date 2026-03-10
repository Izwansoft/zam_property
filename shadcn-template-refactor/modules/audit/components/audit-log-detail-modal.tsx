// =============================================================================
// AuditLogDetailModal — Full detail view for a single audit log entry
// =============================================================================
// Shows actor details, old/new values diff, metadata, request ID.
// Audit records are immutable — read-only display only.
// =============================================================================

"use client";

import { format } from "date-fns";
import {
  User,
  Bot,
  Shield,
  Ghost,
  Globe,
  Monitor,
  Hash,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AuditLogEntry, AuditActorType } from "../types";
import {
  getActionCategory,
  ACTION_CATEGORY_COLORS,
  formatActionType,
  formatTargetType,
  ACTOR_TYPE_LABELS,
} from "../types";

// ---------------------------------------------------------------------------
// Actor Icons
// ---------------------------------------------------------------------------

const ACTOR_ICONS: Record<AuditActorType, typeof User> = {
  USER: User,
  SYSTEM: Bot,
  ADMIN: Shield,
  ANONYMOUS: Ghost,
};

// ---------------------------------------------------------------------------
// JSON Diff Viewer (simple key-level comparison)
// ---------------------------------------------------------------------------

function JsonDiff({
  oldValue,
  newValue,
}: {
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
}) {
  if (!oldValue && !newValue) {
    return (
      <p className="text-sm text-muted-foreground italic">No changes recorded.</p>
    );
  }

  // Collect all keys
  const allKeys = new Set<string>();
  if (oldValue) Object.keys(oldValue).forEach((k) => allKeys.add(k));
  if (newValue) Object.keys(newValue).forEach((k) => allKeys.add(k));

  const sortedKeys = Array.from(allKeys).sort();

  return (
    <div className="space-y-1 font-mono text-xs">
      {sortedKeys.map((key) => {
        const old = oldValue?.[key];
        const nw = newValue?.[key];
        const changed = JSON.stringify(old) !== JSON.stringify(nw);

        if (!changed && oldValue && newValue) return null;

        return (
          <div
            key={key}
            className="flex items-start gap-2 rounded px-2 py-1 bg-muted/50"
          >
            <span className="font-semibold min-w-[100px] text-foreground">
              {key}:
            </span>
            {old !== undefined && (
              <span className="text-red-600 dark:text-red-400 line-through">
                {formatValue(old)}
              </span>
            )}
            {old !== undefined && nw !== undefined && (
              <ArrowRight className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
            )}
            {nw !== undefined && (
              <span className="text-green-600 dark:text-green-400">
                {formatValue(nw)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

// ---------------------------------------------------------------------------
// Metadata Viewer
// ---------------------------------------------------------------------------

function MetadataViewer({
  metadata,
}: {
  metadata: Record<string, unknown> | null;
}) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">No metadata.</p>
    );
  }

  return (
    <pre className="whitespace-pre-wrap break-all rounded bg-muted/50 p-3 text-xs font-mono">
      {JSON.stringify(metadata, null, 2)}
    </pre>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AuditLogDetailModalProps {
  entry: AuditLogEntry | null;
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuditLogDetailModal({
  entry,
  open,
  onClose,
}: AuditLogDetailModalProps) {
  if (!entry) return null;

  const category = getActionCategory(entry.actionType);
  const colorCls = ACTION_CATEGORY_COLORS[category];
  const ActorIcon = ACTOR_ICONS[entry.actorType] ?? User;
  const timestamp = new Date(entry.timestamp);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs font-medium ${colorCls}`}
            >
              {formatActionType(entry.actionType)}
            </Badge>
            <span className="text-sm font-normal text-muted-foreground">
              Audit Log Detail
            </span>
          </DialogTitle>
          <DialogDescription>
            Immutable audit record — read-only view.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-5">
            {/* ---- Timestamp ---- */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{format(timestamp, "PPpp")}</span>
            </div>

            <Separator />

            {/* ---- Actor Details ---- */}
            <section>
              <h4 className="text-sm font-semibold mb-2">Actor</h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <ActorIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{ACTOR_TYPE_LABELS[entry.actorType]}</span>
                </div>
                {entry.actorEmail && (
                  <div className="text-muted-foreground pl-6">
                    {entry.actorEmail}
                  </div>
                )}
                {entry.actorId && (
                  <div className="text-xs text-muted-foreground pl-6 font-mono">
                    ID: {entry.actorId}
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* ---- Target ---- */}
            <section>
              <h4 className="text-sm font-semibold mb-2">Target</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  <span className="font-medium">
                    {formatTargetType(entry.targetType)}
                  </span>
                </div>
                {entry.targetId && (
                  <div className="text-xs text-muted-foreground font-mono">
                    ID: {entry.targetId}
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* ---- Changes (Old → New values diff) ---- */}
            <section>
              <h4 className="text-sm font-semibold mb-2">Changes</h4>
              <JsonDiff
                oldValue={entry.oldValue}
                newValue={entry.newValue}
              />
            </section>

            <Separator />

            {/* ---- Metadata ---- */}
            <section>
              <h4 className="text-sm font-semibold mb-2">Metadata</h4>
              <MetadataViewer metadata={entry.metadata} />
            </section>

            <Separator />

            {/* ---- Request & Network Info ---- */}
            <section>
              <h4 className="text-sm font-semibold mb-2">Request Info</h4>
              <div className="space-y-1.5 text-sm">
                {entry.requestId && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs">
                      {entry.requestId}
                    </span>
                  </div>
                )}
                {entry.ipAddress && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">{entry.ipAddress}</span>
                  </div>
                )}
                {entry.userAgent && (
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs truncate max-w-md">
                      {entry.userAgent}
                    </span>
                  </div>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
