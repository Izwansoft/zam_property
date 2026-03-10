// =============================================================================
// AuditLogItem — Single audit log row display
// =============================================================================
// Renders a compact row for the audit log table with:
// timestamp, actor, action badge, target, request ID.
// =============================================================================

"use client";

import { formatDistanceToNow, format } from "date-fns";
import { User, Bot, Shield, Ghost } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TableCell, TableRow } from "@/components/ui/table";
import type { AuditLogEntry, AuditActorType } from "../types";
import {
  getActionCategory,
  ACTION_CATEGORY_COLORS,
  formatActionType,
  formatTargetType,
} from "../types";

// ---------------------------------------------------------------------------
// Actor Icon
// ---------------------------------------------------------------------------

const ACTOR_ICONS: Record<AuditActorType, typeof User> = {
  USER: User,
  SYSTEM: Bot,
  ADMIN: Shield,
  ANONYMOUS: Ghost,
};

function ActorIcon({ type }: { type: AuditActorType }) {
  const Icon = ACTOR_ICONS[type] ?? User;
  return <Icon className="h-4 w-4" />;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AuditLogItemProps {
  entry: AuditLogEntry;
  onClick?: (entry: AuditLogEntry) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuditLogItem({ entry, onClick }: AuditLogItemProps) {
  const category = getActionCategory(entry.actionType);
  const colorCls = ACTION_CATEGORY_COLORS[category];
  const date = new Date(entry.timestamp);

  return (
    <TableRow
      className={onClick ? "cursor-pointer hover:bg-muted/50" : undefined}
      onClick={() => onClick?.(entry)}
    >
      {/* Timestamp */}
      <TableCell className="whitespace-nowrap text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
            </TooltipTrigger>
            <TooltipContent>
              {format(date, "PPpp")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* Actor */}
      <TableCell>
        <div className="flex items-center gap-2 text-sm">
          <ActorIcon type={entry.actorType} />
          <span className="truncate max-w-45">
            {entry.actorEmail ?? entry.actorType}
          </span>
        </div>
      </TableCell>

      {/* Action */}
      <TableCell>
        <Badge
          variant="outline"
          className={`text-xs font-medium ${colorCls}`}
        >
          {formatActionType(entry.actionType)}
        </Badge>
      </TableCell>

      {/* Target */}
      <TableCell className="text-sm">
        <div className="flex flex-col">
          <span className="font-medium">
            {formatTargetType(entry.targetType)}
          </span>
          {entry.targetId && (
            <span className="text-xs text-muted-foreground truncate max-w-35">
              {entry.targetId}
            </span>
          )}
        </div>
      </TableCell>

      {/* Request ID */}
      <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
        {entry.requestId ? entry.requestId.slice(0, 8) + "…" : "—"}
      </TableCell>
    </TableRow>
  );
}


