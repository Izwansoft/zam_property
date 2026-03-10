/**
 * Rate Limit Fallback Component (shared)
 *
 * Displayed when a 429 rate limit response is received from the public API.
 * Shows a user-friendly message with retry countdown.
 * Reusable across all public pages.
 */

import { Clock, RefreshCw } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RateLimitFallbackProps {
  retryAfter: number;
}

export function RateLimitFallback({ retryAfter }: RateLimitFallbackProps) {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4">
      <Card className="w-full text-center">
        <CardContent className="space-y-4 py-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">
              Too Many Requests
            </h2>
            <p className="text-muted-foreground">
              We&apos;re receiving a lot of traffic right now. Please try again{" "}
              {retryAfter > 0 ? (
                <>
                  in <span className="font-medium">{retryAfter} seconds</span>
                </>
              ) : (
                "shortly"
              )}
              .
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
            <Button variant="outline" asChild>
              <Link href="/search">
                <RefreshCw className="mr-2 h-4 w-4" />
                Back to Search
              </Link>
            </Button>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
