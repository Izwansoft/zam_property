// =============================================================================
// OwnerMaintenanceInbox — Owner's view of all maintenance tickets
// =============================================================================
// Groups tickets by property, filter by status/priority,
// quick actions (verify, assign, resolve).
// =============================================================================

"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Building2,
  AlertTriangle,
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/empty-state";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {
  MaintenanceStatus,
  MaintenancePriority,
  MAINTENANCE_STATUS_CONFIG,
  MAINTENANCE_PRIORITY_CONFIG,
  MAINTENANCE_CATEGORY_CONFIG,
} from "../types";
import type { Maintenance, MaintenanceFilterTab } from "../types";
import { MaintenanceStatusBadge } from "./maintenance-status-badge";
import { MaintenancePriorityBadge } from "./maintenance-priority-badge";

// ---------------------------------------------------------------------------
// Owner-specific filter tabs
// ---------------------------------------------------------------------------

const OWNER_FILTER_TABS: MaintenanceFilterTab[] = [
  { value: "all", label: "All" },
  {
    value: "needs-action",
    label: "Needs Action",
    statuses: [
      MaintenanceStatus.OPEN,
      MaintenanceStatus.PENDING_APPROVAL,
    ],
  },
  {
    value: "in-progress",
    label: "In Progress",
    statuses: [
      MaintenanceStatus.VERIFIED,
      MaintenanceStatus.ASSIGNED,
      MaintenanceStatus.IN_PROGRESS,
    ],
  },
  {
    value: "resolved",
    label: "Resolved",
    statuses: [MaintenanceStatus.CLOSED],
  },
  {
    value: "cancelled",
    label: "Cancelled",
    statuses: [MaintenanceStatus.CANCELLED],
  },
];

// ---------------------------------------------------------------------------
// Summary Stats
// ---------------------------------------------------------------------------

interface OwnerMaintenanceStats {
  total: number;
  needsAction: number;
  inProgress: number;
  resolved: number;
  urgent: number;
}

function computeStats(tickets: Maintenance[]): OwnerMaintenanceStats {
  return {
    total: tickets.length,
    needsAction: tickets.filter(
      (t) =>
        t.status === MaintenanceStatus.OPEN ||
        t.status === MaintenanceStatus.PENDING_APPROVAL
    ).length,
    inProgress: tickets.filter(
      (t) =>
        t.status === MaintenanceStatus.VERIFIED ||
        t.status === MaintenanceStatus.ASSIGNED ||
        t.status === MaintenanceStatus.IN_PROGRESS
    ).length,
    resolved: tickets.filter(
      (t) => t.status === MaintenanceStatus.CLOSED
    ).length,
    urgent: tickets.filter(
      (t) => t.priority === MaintenancePriority.URGENT
    ).length,
  };
}

// ---------------------------------------------------------------------------
// Property Group
// ---------------------------------------------------------------------------

interface PropertyGroup {
  propertyId: string;
  propertyTitle: string;
  propertyAddress?: string;
  tickets: Maintenance[];
}

function groupByProperty(tickets: Maintenance[]): PropertyGroup[] {
  const groups = new Map<string, PropertyGroup>();

  for (const ticket of tickets) {
    const propertyId = ticket.tenancy?.property?.id ?? "unknown";
    const propertyTitle = ticket.tenancy?.property?.title ?? "Unknown Property";
    const propertyAddress = ticket.tenancy?.property?.address;

    if (!groups.has(propertyId)) {
      groups.set(propertyId, {
        propertyId,
        propertyTitle,
        propertyAddress,
        tickets: [],
      });
    }
    groups.get(propertyId)!.tickets.push(ticket);
  }

  // Sort groups by number of active tickets (most urgent first)
  return Array.from(groups.values()).sort(
    (a, b) => {
      const urgentA = a.tickets.filter((t) => t.priority === MaintenancePriority.URGENT).length;
      const urgentB = b.tickets.filter((t) => t.priority === MaintenancePriority.URGENT).length;
      if (urgentA !== urgentB) return urgentB - urgentA;
      return b.tickets.length - a.tickets.length;
    }
  );
}

// ---------------------------------------------------------------------------
// Ticket Row Component
// ---------------------------------------------------------------------------

interface TicketRowProps {
  ticket: Maintenance;
  basePath: string;
  onQuickAction?: (ticketId: string, action: string) => void;
}

function TicketRow({ ticket, basePath, onQuickAction }: TicketRowProps) {
  const router = useRouter();
  const categoryConfig = MAINTENANCE_CATEGORY_CONFIG[ticket.category];
  const tenantName = ticket.tenancy?.tenant?.name ?? "Unknown";

  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(ticket.reportedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer",
        ticket.priority === MaintenancePriority.URGENT &&
          "border-destructive/30 bg-destructive/5"
      )}
      onClick={() => router.push(`${basePath}/${ticket.id}`)}
    >
      {/* Category icon */}
      <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Wrench className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{ticket.title}</span>
          <span className="text-xs text-muted-foreground">
            {ticket.ticketNumber}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>{categoryConfig?.label ?? ticket.category}</span>
          <span>·</span>
          <span>{tenantName}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {daysSinceCreated === 0
              ? "Today"
              : `${daysSinceCreated}d ago`}
          </span>
        </div>
      </div>

      {/* Badges */}
      <div className="hidden md:flex items-center gap-2">
        <MaintenancePriorityBadge priority={ticket.priority} size="sm" />
        <MaintenanceStatusBadge status={ticket.status} size="sm" />
      </div>

      {/* Quick actions */}
      <div
        className="hidden lg:flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {ticket.status === MaintenanceStatus.OPEN && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickAction?.(ticket.id, "verify")}
          >
            Verify
          </Button>
        )}
        {ticket.status === MaintenanceStatus.VERIFIED && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickAction?.(ticket.id, "assign")}
          >
            Assign
          </Button>
        )}
        {ticket.status === MaintenanceStatus.PENDING_APPROVAL && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuickAction?.(ticket.id, "close")}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Close
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Property Group Card
// ---------------------------------------------------------------------------

interface PropertyGroupCardProps {
  group: PropertyGroup;
  basePath: string;
  onQuickAction?: (ticketId: string, action: string) => void;
  defaultExpanded?: boolean;
}

function PropertyGroupCard({
  group,
  basePath,
  onQuickAction,
  defaultExpanded = true,
}: PropertyGroupCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const activeCount = group.tickets.filter(
    (t) =>
      t.status !== MaintenanceStatus.CLOSED &&
      t.status !== MaintenanceStatus.CANCELLED
  ).length;

  const urgentCount = group.tickets.filter(
    (t) => t.priority === MaintenancePriority.URGENT
  ).length;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer py-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{group.propertyTitle}</CardTitle>
              {group.propertyAddress && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {group.propertyAddress}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {urgentCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {urgentCount} urgent
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {activeCount} active / {group.tickets.length} total
            </Badge>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-2 pt-0">
          {group.tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              basePath={basePath}
              onQuickAction={onQuickAction}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OwnerMaintenanceInboxProps {
  tickets: Maintenance[];
  isLoading?: boolean;
  basePath?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  /** Callback for quick actions (verify, assign, close) */
  onQuickAction?: (ticketId: string, action: string) => void;
  /** Filter management */
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  priorityFilter?: string;
  onPriorityFilterChange?: (priority: string) => void;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function OwnerMaintenanceInbox({
  tickets,
  isLoading = false,
  basePath = "/dashboard/vendor/maintenance",
  pagination,
  onPageChange,
  onQuickAction,
  activeFilter,
  onFilterChange,
  priorityFilter,
  onPriorityFilterChange,
}: OwnerMaintenanceInboxProps) {
  // Compute stats
  const stats = useMemo(() => computeStats(tickets), [tickets]);

  // Apply client-side filter
  const filteredTickets = useMemo(() => {
    let result = tickets;

    // Status filter
    const tab = OWNER_FILTER_TABS.find((t) => t.value === activeFilter);
    if (tab?.statuses) {
      result = result.filter((t) => tab.statuses!.includes(t.status));
    }

    // Priority filter
    if (priorityFilter && priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    return result;
  }, [tickets, activeFilter, priorityFilter]);

  // Group by property
  const propertyGroups = useMemo(
    () => groupByProperty(filteredTickets),
    [filteredTickets]
  );

  // Tab counts
  const tabCounts = useMemo(() => {
    const result: Record<string, number> = { all: tickets.length };
    OWNER_FILTER_TABS.forEach((tab) => {
      if (tab.statuses) {
        result[tab.value] = tickets.filter((t) =>
          tab.statuses!.includes(t.status)
        ).length;
      }
    });
    return result;
  }, [tickets]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Tickets</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className={stats.needsAction > 0 ? "border-warning/50" : ""}>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Needs Action</div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.needsAction}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">In Progress</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.inProgress}
            </div>
          </CardContent>
        </Card>
        <Card className={stats.urgent > 0 ? "border-destructive/50" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
              Urgent
            </div>
            <div className="text-2xl font-bold text-destructive">
              {stats.urgent}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeFilter} onValueChange={onFilterChange}>
          <TabsList className="w-full sm:w-auto overflow-x-auto">
            {OWNER_FILTER_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="min-w-20"
              >
                {tab.label}
                {tabCounts[tab.value] !== undefined && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 h-5 min-w-[20px] px-1 text-xs"
                  >
                    {tabCounts[tab.value]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Priority filter */}
        <Select
          value={priorityFilter ?? "all"}
          onValueChange={(val) => onPriorityFilterChange?.(val)}
        >
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {Object.entries(MAINTENANCE_PRIORITY_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && <OwnerMaintenanceInboxSkeleton />}

      {/* Empty State */}
      {!isLoading && filteredTickets.length === 0 && (
        <EmptyState
          icon={Wrench}
          title="No maintenance tickets"
          description={
            activeFilter === "all"
              ? "No maintenance tickets have been submitted yet."
              : `No tickets matching the "${OWNER_FILTER_TABS.find((t) => t.value === activeFilter)?.label}" filter.`
          }
        />
      )}

      {/* Property Groups */}
      {!isLoading &&
        propertyGroups.map((group) => (
          <PropertyGroupCard
            key={group.propertyId}
            group={group}
            basePath={basePath}
            onQuickAction={onQuickAction}
          />
        ))}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    pagination.page > 1 && onPageChange?.(pagination.page - 1)
                  }
                  aria-disabled={pagination.page <= 1}
                  className={
                    pagination.page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pagination.page === pageNum}
                      onClick={() => onPageChange?.(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    pagination.page < pagination.totalPages &&
                    onPageChange?.(pagination.page + 1)
                  }
                  aria-disabled={pagination.page >= pagination.totalPages}
                  className={
                    pagination.page >= pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function OwnerMaintenanceInboxSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((g) => (
        <Card key={g}>
          <CardHeader className="py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-40" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


