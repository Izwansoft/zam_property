"use client";

// =============================================================================
// Root Error Page — Next.js error.tsx boundary
// =============================================================================
// Catches unhandled errors at the root level. Required to be a Client Component
// that receives `error` and `reset` props from Next.js.
// =============================================================================

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for monitoring/telemetry
    console.error("[RootError] Unhandled error:", error);
  }, [error]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Something went wrong</CardTitle>
          <CardDescription className="mt-2 text-base">
            An unexpected error occurred. Our team has been notified and is
            working to fix it.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <div className="space-y-2">
              <div className="bg-muted rounded-md p-3">
                <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                  Error Message (dev only)
                </p>
                <p className="text-destructive break-all font-mono text-sm">
                  {error.message}
                </p>
              </div>
              {error.digest && (
                <div className="bg-muted rounded-md p-3">
                  <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                    Error Digest
                  </p>
                  <p className="text-muted-foreground font-mono text-sm">
                    {error.digest}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center gap-3">
          <Button onClick={reset} size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
