"use client";

// =============================================================================
// ErrorBoundary — Catches React rendering errors with retry capability
// =============================================================================
// Wraps a subtree and catches JavaScript errors during rendering, lifecycle
// methods, and in constructors. Shows a fallback UI with retry option.
// =============================================================================

import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback component — receives error and reset function */
  fallback?: React.ComponentType<ErrorFallbackProps>;
  /** Called when an error is caught — for logging/telemetry */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** If true, only shows a compact inline error instead of full-page */
  inline?: boolean;
  /** Optional label for context (e.g. "Listings", "Dashboard") */
  label?: string;
}

export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// ErrorBoundary component (class component — required for error boundaries)
// ---------------------------------------------------------------------------

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for telemetry
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetErrorBoundary={this.resetErrorBoundary}
          />
        );
      }

      // Default fallback
      if (this.props.inline) {
        return (
          <InlineErrorFallback
            error={this.state.error}
            resetErrorBoundary={this.resetErrorBoundary}
            label={this.props.label}
          />
        );
      }

      return (
        <FullPageErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
          label={this.props.label}
        />
      );
    }

    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// FullPageErrorFallback — full-page error display with retry
// ---------------------------------------------------------------------------

function FullPageErrorFallback({
  error,
  resetErrorBoundary,
  label,
}: ErrorFallbackProps & { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4" role="alert" aria-live="assertive">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <AlertCircle className="text-destructive h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">
            {label ? `Error loading ${label}` : "Something went wrong"}
          </CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again or contact support if
            the problem persists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {process.env.NODE_ENV === "development" && (
            <div className="bg-muted rounded-md p-3">
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                Error Details (dev only)
              </p>
              <p className="text-destructive text-sm font-mono break-all">
                {error.message}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-2">
          <Button onClick={resetErrorBoundary} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Go Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InlineErrorFallback — compact inline error for sections/widgets
// ---------------------------------------------------------------------------

function InlineErrorFallback({
  error,
  resetErrorBoundary,
  label,
}: ErrorFallbackProps & { label?: string }) {
  return (
    <div className="border-destructive/20 bg-destructive/5 flex items-center gap-3 rounded-lg border p-4" role="alert" aria-live="assertive">
      <AlertCircle className="text-destructive h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {label ? `Failed to load ${label}` : "Something went wrong"}
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {error.message}
          </p>
        )}
      </div>
      <Button
        onClick={resetErrorBoundary}
        variant="ghost"
        size="sm"
        className="shrink-0"
        aria-label={`Retry loading ${label || 'content'}`}
      >
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        Retry
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QueryErrorFallback — for use with TanStack Query error boundaries
// ---------------------------------------------------------------------------

export function QueryErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12" role="alert" aria-live="assertive">
      <div className="bg-destructive/10 flex h-12 w-12 items-center justify-center rounded-full">
        <AlertCircle className="text-destructive h-6 w-6" aria-hidden="true" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold">Failed to load data</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {error.message || "An error occurred while fetching data."}
        </p>
      </div>
      <Button onClick={resetErrorBoundary} variant="outline" size="sm">
        <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
        Try Again
      </Button>
    </div>
  );
}

export default ErrorBoundary;
