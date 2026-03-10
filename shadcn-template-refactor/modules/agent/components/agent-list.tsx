// =============================================================================
// AgentList — Grid view with filters and pagination
// =============================================================================

"use client";

import { useState } from "react";
import { Users, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { AgentFilters, AgentStatus } from "../types";
import { DEFAULT_AGENT_FILTERS } from "../types";
import { useAgents } from "../hooks/useAgents";
import { AgentCard, AgentCardSkeleton } from "./agent-card";
import { AgentRegistrationForm } from "./agent-registration-form";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AgentListProps {
  companyId: string;
  basePath?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentList({ companyId, basePath = "/dashboard/company/agents" }: AgentListProps) {
  const [filters, setFilters] = useState<AgentFilters>({
    ...DEFAULT_AGENT_FILTERS,
    companyId,
  });
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const { data, isLoading } = useAgents(filters);

  const agents = data?.items ?? [];
  const pagination = data?.pagination ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 };

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleStatusChange = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status === "ALL" ? "" : (status as AgentStatus),
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground">
            Manage your company&apos;s registered agents
          </p>
        </div>
        <Button onClick={() => setShowRegisterForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Agent
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search agents..."
          value={filters.search ?? ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={filters.status || "ALL"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results info */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          Showing {agents.length} of {pagination.total} agent
          {pagination.total !== 1 ? "s" : ""}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <AgentCardSkeleton key={i} />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No agents found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {filters.search || filters.status
              ? "Try adjusting your filters or search terms."
              : "No agents have been registered yet."}
          </p>
          {!filters.search && !filters.status && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowRegisterForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Register First Agent
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} basePath={basePath} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Register Agent Dialog */}
      <AgentRegistrationForm
        companyId={companyId}
        open={showRegisterForm}
        onOpenChange={setShowRegisterForm}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function AgentListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded bg-muted animate-pulse" />
          <div className="h-4 w-56 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-9 w-28 rounded bg-muted animate-pulse" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-64 rounded bg-muted animate-pulse" />
        <div className="h-9 w-40 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <AgentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

