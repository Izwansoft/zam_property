// =============================================================================
// SaveSearchButton — Save current search criteria
// =============================================================================
// Shows a bookmark icon button that opens a dialog to name and save the search.
// Indicates if the current search is already saved.
// =============================================================================

"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, Bell, BellOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { showSuccess } from "@/lib/errors/toast-helpers";

import type { SearchParams } from "../types";
import { useSavedSearchStore } from "../store/saved-search-store";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SaveSearchButtonProps {
  params: SearchParams;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SaveSearchButton({ params }: SaveSearchButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [notify, setNotify] = useState(false);


  const { saveSearch, isSearchSaved } = useSavedSearchStore();
  const alreadySaved = isSearchSaved(params);

  const handleSave = () => {
    const searchName =
      name.trim() ||
      buildDefaultName(params);

    const saved = saveSearch(searchName, params);

    if (notify) {
      useSavedSearchStore.getState().toggleAlert(saved.id);
    }

    showSuccess("Search saved", {
      description: `"${saved.name}" has been saved to your searches.`,
    });

    setName("");
    setNotify(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={alreadySaved ? "secondary" : "outline"}
          size="sm"
          className="gap-1.5"
        >
          {alreadySaved ? (
            <>
              <BookmarkCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Saved</span>
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Save Search</span>
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save this search</DialogTitle>
          <DialogDescription>
            Give this search a name so you can quickly find it later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="search-name">Search name</Label>
            <Input
              id="search-name"
              placeholder={buildDefaultName(params)}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              autoFocus
            />
          </div>

          {/* Alert toggle */}
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="flex items-center gap-3">
              {notify ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">New listing alerts</p>
                <p className="text-xs text-muted-foreground">
                  Get notified when new listings match
                </p>
              </div>
            </div>
            <Switch checked={notify} onCheckedChange={setNotify} />
          </div>

          {/* Search summary */}
          <div className="rounded-lg bg-muted/50 px-4 py-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Search criteria:
            </p>
            <SearchSummary params={params} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Search</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDefaultName(params: SearchParams): string {
  const parts: string[] = [];

  if (params.q) parts.push(params.q);
  if (params.city) parts.push(params.city);
  if (params.state) parts.push(params.state);
  if (params.verticalType) parts.push(params.verticalType.replace(/_/g, " "));

  if (parts.length === 0) return "All listings";
  return parts.join(" · ");
}

function SearchSummary({ params }: { params: SearchParams }) {
  const items: string[] = [];

  if (params.q) items.push(`"${params.q}"`);
  if (params.verticalType) items.push(params.verticalType.replace(/_/g, " "));
  if (params.city) items.push(params.city);
  if (params.state) items.push(params.state);
  if (params.priceMin || params.priceMax) {
    const min = params.priceMin
      ? `RM ${params.priceMin.toLocaleString()}`
      : "Any";
    const max = params.priceMax
      ? `RM ${params.priceMax.toLocaleString()}`
      : "Any";
    items.push(`${min} – ${max}`);
  }

  if (items.length === 0) {
    return <p className="text-sm">All listings (no filters)</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span
          key={i}
          className="inline-block rounded-full bg-background px-2.5 py-0.5 text-xs font-medium"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
