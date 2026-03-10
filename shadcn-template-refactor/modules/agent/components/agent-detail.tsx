// =============================================================================
// AgentDetail — Composite detail page for a single agent
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  FileText,
  Trash2,
  ExternalLink,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import { useAgent, useAgentListings, useUnassignListing } from "../hooks/useAgents";
import { getAgentDisplayName } from "../types";
import { AgentProfileCard, AgentProfileCardSkeleton } from "./agent-profile-card";
import { AssignListingDialog } from "./assign-listing-dialog";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AgentDetailProps {
  agentId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentDetail({ agentId }: AgentDetailProps) {
  const { data: agent, isLoading: agentLoading } = useAgent(agentId);
  const { data: listings, isLoading: listingsLoading } = useAgentListings(agentId);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const unassignListing = useUnassignListing();

  const handleUnassign = async (listingId: string) => {
    try {
      await unassignListing.mutateAsync({ agentId, listingId });
      showSuccess("Listing unassigned");
    } catch {
      showError("Failed to unassign listing");
    }
  };

  if (agentLoading) {
    return <AgentDetailSkeleton />;
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-lg font-semibold">Agent not found</h2>
        <p className="text-muted-foreground">
          The agent you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/company/agents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Link>
        </Button>
      </div>
    );
  }

  const displayName = getAgentDisplayName(agent);
  const activeListings = (listings ?? agent.agentListings ?? []).filter(
    (l) => !l.removedAt
  );

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard/company/agents">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Agents
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile — left column */}
        <div className="lg:col-span-1">
          <AgentProfileCard agent={agent} />
        </div>

        {/* Listings — right column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assigned Listings</CardTitle>
                  <CardDescription>
                    {activeListings.length} active listing
                    {activeListings.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowAssignDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Listing
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {listingsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </div>
              ) : activeListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm font-medium">No listings assigned</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Assign listings to this agent to get started.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowAssignDialog(true)}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Assign First Listing
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeListings.map((al) => (
                    <div
                      key={al.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {al.listing?.title ?? `Listing ${al.listingId.slice(0, 8)}`}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {al.listing?.status && (
                              <Badge variant="outline" className="text-xs">
                                {al.listing.status}
                              </Badge>
                            )}
                            {al.listing?.price != null && (
                              <span className="text-xs text-muted-foreground">
                                RM {Number(al.listing.price).toLocaleString()}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Assigned {new Date(al.assignedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {al.listing && (
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                            <Link href={`/dashboard/company/listings/${al.listingId}`}>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleUnassign(al.listingId)}
                          disabled={unassignListing.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign Listing Dialog */}
      <AssignListingDialog
        agentId={agentId}
        agentName={displayName}
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function AgentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AgentProfileCardSkeleton />
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-9 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
