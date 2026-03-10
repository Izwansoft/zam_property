"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Session Expired page — shown when the user's session has timed out.
 * Preserves the returnTo URL so the user can continue where they left off.
 * Route: /session-expired
 */
export default function SessionExpiredPage() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const loginHref = `/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}&reason=session_expired` : "?reason=session_expired"}`;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">Session Expired</CardTitle>
          <CardDescription className="text-base">
            Your session has expired due to inactivity. Please sign in again to
            continue where you left off.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href={loginHref}>Sign In Again</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Go to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
