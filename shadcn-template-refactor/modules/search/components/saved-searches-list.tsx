// =============================================================================
// SavedSearchesList — Management UI for saved searches
// =============================================================================
// Displays all saved searches with actions: apply, rename, toggle alerts, delete.
// Uses the Zustand saved search store (localStorage-backed).
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  BellOff,
  Trash2,
  Play,
  Pencil,
  Inbox,
  BookmarkX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { showSuccess } from "@/lib/errors/toast-helpers";

import {
  useSavedSearchStore,
  type SavedSearch,
} from "@/modules/search/store/saved-search-store";
import { buildSearchQueryString } from "@/modules/search";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SavedSearchesList() {
  const router = useRouter();

  const { searches, removeSearch, toggleAlert, renameSearch, clearAll } =
    useSavedSearchStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Apply a saved search — navigate to search page with params
  const handleApply = useCallback(
    (search: SavedSearch) => {
      const qs = buildSearchQueryString(search.params);
      router.push(`/search${qs ? `?${qs}` : ""}`);
    },
    [router],
  );

  const handleStartRename = (search: SavedSearch) => {
    setEditingId(search.id);
    setEditName(search.name);
  };

  const handleFinishRename = (id: string) => {
    renameSearch(id, editName);
    setEditingId(null);
    setEditName("");
  };

  const handleRemove = (id: string, name: string) => {
    removeSearch(id);
    showSuccess("Search removed", { description: `"${name}" deleted.` });
  };

  const handleClearAll = () => {
    clearAll();
    showSuccess("All cleared", {
      description: "All saved searches have been removed.",
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (searches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Inbox className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No saved searches</h3>
        <p className="mb-4 max-w-md text-sm text-muted-foreground">
          Save your search criteria from the search page to quickly re-run them
          later.
        </p>
        <Button variant="outline" onClick={() => router.push("/search")}>
          <Search className="mr-2 h-4 w-4" />
          Go to Search
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {searches.length} saved search{searches.length !== 1 ? "es" : ""}
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive">
              <BookmarkX className="mr-1.5 h-4 w-4" />
              Clear All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all saved searches?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove all {searches.length} saved
                searches. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground"
                onClick={handleClearAll}
              >
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Search cards */}
      <div className="space-y-3">
        {searches.map((search) => (
          <Card key={search.id} className="group">
            <CardContent className="flex items-center gap-4 p-4">
              {/* Info */}
              <div className="min-w-0 flex-1">
                {editingId === search.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFinishRename(search.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-8"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleFinishRename(search.id)}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="truncate font-medium">{search.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <SearchParamsBadges search={search} />
                      <span className="text-xs text-muted-foreground">
                        Saved{" "}
                        {new Date(search.createdAt).toLocaleDateString(
                          "en-MY",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleApply(search)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Run search</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleAlert(search.id)}
                    >
                      {search.notifyOnNew ? (
                        <Bell className="h-4 w-4 text-primary" />
                      ) : (
                        <BellOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {search.notifyOnNew
                      ? "Disable notifications"
                      : "Enable notifications"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleStartRename(search)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rename</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleRemove(search.id, search.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: param badges
// ---------------------------------------------------------------------------

function SearchParamsBadges({ search }: { search: SavedSearch }) {
  const { params } = search;
  const badges: string[] = [];

  if (params.q) badges.push(`"${params.q}"`);
  if (params.verticalType) badges.push(params.verticalType.replace(/_/g, " "));
  if (params.city) badges.push(params.city);
  if (params.state) badges.push(params.state);
  if (params.priceMin != null || params.priceMax != null) badges.push("Price filter");

  if (badges.length === 0) badges.push("All listings");

  return (
    <>
      {badges.map((b, i) => (
        <Badge key={i} variant="secondary" className="text-xs">
          {b}
        </Badge>
      ))}
    </>
  );
}
