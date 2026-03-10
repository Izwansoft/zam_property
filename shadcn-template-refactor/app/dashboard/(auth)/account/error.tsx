"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Account Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="max-w-md text-muted-foreground">
          An error occurred in your account area. Please try again or contact
          support if the issue persists.
        </p>
      </div>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
