// =============================================================================
// AgentCard — Card component for agent grid views
// =============================================================================

"use client";

import Link from "next/link";
import {
  User,
  FileText,
  Clock,
  BadgeDollarSign,
  ShieldCheck,
  HandCoins,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { Agent } from "../types";
import { AGENT_STATUS_CONFIG, getAgentDisplayName, formatRenInfo } from "../types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AgentCardProps {
  agent: Agent;
  /** Base path for detail link (e.g., "/dashboard/company/agents") */
  basePath?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentCard({ agent, basePath = "/dashboard/company/agents" }: AgentCardProps) {
  const statusConfig = AGENT_STATUS_CONFIG[agent.status];
  const displayName = getAgentDisplayName(agent);
  const renInfo = formatRenInfo(agent);

  return (
    <Link href={`${basePath}/${agent.id}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="p-5">
          {/* Header: name + status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-sm group-hover:text-primary transition-colors">
                  {displayName}
                </h3>
                {agent.user?.email && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {agent.user.email}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={statusConfig.variant} className="shrink-0 text-xs">
              {statusConfig.label}
            </Badge>
          </div>

          {/* REN Number */}
          {renInfo && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3 shrink-0" />
              <span className="truncate">{renInfo}</span>
            </div>
          )}

          {/* Stats row */}
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            {/* Listings */}
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3 shrink-0" />
              {agent.totalListings} listing{agent.totalListings !== 1 ? "s" : ""}
            </span>

            {/* Deals */}
            <span className="flex items-center gap-1">
              <HandCoins className="h-3 w-3 shrink-0" />
              {agent.totalDeals} deal{agent.totalDeals !== 1 ? "s" : ""}
            </span>

            {/* Revenue */}
            {agent.totalRevenue > 0 && (
              <span className="flex items-center gap-1">
                <BadgeDollarSign className="h-3 w-3 shrink-0" />
                RM {Number(agent.totalRevenue).toLocaleString()}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            {agent.referralCode && (
              <span className="truncate font-mono text-xs">
                Ref: {agent.referralCode}
              </span>
            )}
            <span className="flex items-center gap-1 ml-auto">
              <Clock className="h-3 w-3" />
              {new Date(agent.createdAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function AgentCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-3 w-32" />
        <div className="mt-3 flex items-center gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="mt-3 border-t pt-3 flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}
