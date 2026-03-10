/**
 * Maintenance Mode Page Component
 *
 * Full-page maintenance notice shown when a vertical is under maintenance.
 * Displays admin message, estimated end time, and retry countdown.
 *
 * @see docs/ai-prompt/part-11.md - Vertical Layer
 */

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  RefreshCw,
  Home,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import type { MaintenanceStatus } from "../hooks/use-maintenance";

// =============================================================================
// Types
// =============================================================================

interface MaintenancePageProps {
  status: MaintenanceStatus;
  onRetry?: () => void;
  showBackButton?: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "any moment now";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ${hours % 24} hour${hours % 24 !== 1 ? "s" : ""}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ${minutes % 60} minute${minutes % 60 !== 1 ? "s" : ""}`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
  return `${seconds} second${seconds !== 1 ? "s" : ""}`;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// =============================================================================
// Component
// =============================================================================

export function MaintenancePage({
  status,
  onRetry,
  showBackButton = true,
}: MaintenancePageProps) {
  const [remainingMs, setRemainingMs] = useState(
    status.estimatedRemainingMs ?? 0
  );
  const [autoRefreshIn, setAutoRefreshIn] = useState(60);

  // Countdown for estimated time remaining
  useEffect(() => {
    if (!status.estimatedRemainingMs || status.estimatedRemainingMs <= 0) return;

    const interval = setInterval(() => {
      setRemainingMs((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [status.estimatedRemainingMs]);

  // Auto-refresh countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoRefreshIn((prev) => {
        if (prev <= 1) {
          // Refresh the page
          if (onRetry) {
            onRetry();
          } else {
            window.location.reload();
          }
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onRetry]);

  // Calculate progress (if we have start and end times)
  const progress = (() => {
    if (!status.startAt || !status.endAt) return null;

    const start = new Date(status.startAt).getTime();
    const end = new Date(status.endAt).getTime();
    const now = Date.now();

    if (now >= end) return 100;
    if (now <= start) return 0;

    return Math.round(((now - start) / (end - start)) * 100);
  })();

  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center px-4 py-12">
      {/* Gradient Background — Same as homepage hero */}
      <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Mesh gradient orbs */}
        <div className="absolute left-[10%] top-[20%] h-125 w-125 rounded-full bg-purple-600/15 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] h-150 w-150 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute left-[50%] top-[60%] h-100 w-100 -translate-x-1/2 rounded-full bg-amber-500/10 blur-[100px]" />
        {/* Dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[24px_24px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg text-center">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <Image
            src="/images/brand/logo-dark.png"
            alt="Zam Property"
            width={180}
            height={44}
            className="h-11 w-auto"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-white">
          {status.name} is Under Maintenance
        </h1>

        {/* Message */}
        <p className="mb-8 text-white/60">
          {status.message ||
            (status.endAt
              ? "We're currently performing scheduled maintenance to improve your experience. Please check back soon."
              : "We're currently performing maintenance. Service will resume as soon as possible."
            )}
        </p>

        {/* Time Info Card */}
        <Card className="mb-8 border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="p-6">
            {/* Estimated Time Remaining */}
            {remainingMs > 0 && (
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-center gap-2 text-sm text-white/50">
                  <Clock className="h-4 w-4" />
                  Estimated time remaining
                </div>
                <p className="text-2xl font-semibold text-white">
                  {formatTimeRemaining(remainingMs)}
                </p>
              </div>
            )}

            {/* Progress Bar */}
            {progress !== null && (
              <div className="mb-4">
                <Progress value={progress} className="h-2" />
                <p className="mt-1 text-xs text-white/50">
                  {progress}% complete
                </p>
              </div>
            )}

            {/* Schedule Info */}
            {status.startAt && (
              <div className="border-t border-white/10 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/50">Started</span>
                    <p className="font-medium text-white">
                      {formatDateTime(status.startAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/50">Expected End</span>
                    <p className="font-medium text-white">
                      {status.endAt 
                        ? formatDateTime(status.endAt)
                        : "Until further notice"
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Auto Refresh Indicator */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/50">
              <RefreshCw className="h-3 w-3" />
              Auto-checking in {autoRefreshIn}s
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {showBackButton && (
            <Button variant="outline" asChild className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Link>
            </Button>
          )}

          <Button
            className="bg-white text-slate-900 hover:bg-white/90"
            onClick={() => {
              if (onRetry) {
                onRetry();
              } else {
                window.location.reload();
              }
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Again
          </Button>
        </div>

        {/* Contact Info */}
        <p className="mt-8 text-sm text-white/50">
          Need help?{" "}
          <Link href="/contact" className="text-cyan-400 hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}

export default MaintenancePage;
