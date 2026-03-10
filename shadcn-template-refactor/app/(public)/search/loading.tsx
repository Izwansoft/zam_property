/**
 * Search Page Loading State
 *
 * Shown during route transitions to /search.
 */

import { Loader2 } from "lucide-react";

export default function SearchLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading search...</p>
      </div>
    </div>
  );
}
