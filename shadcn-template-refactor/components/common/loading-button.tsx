"use client";

// =============================================================================
// LoadingButton — Button component with loading state support
// =============================================================================
// Wraps shadcn/ui Button with spinner, disabled state during loading,
// and configurable loading text. Used in forms and action buttons.
// =============================================================================

import React from "react";
import { Loader2 } from "lucide-react";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LoadingButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Text to show while loading (replaces children) */
  loadingText?: string;
  /** Position of the spinner relative to text */
  spinnerPosition?: "left" | "right";
  /** Pass-through for Slot rendering */
  asChild?: boolean;
  /** Icon to show when not loading (left side) */
  icon?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// LoadingButton component
// ---------------------------------------------------------------------------

export function LoadingButton({
  children,
  loading = false,
  loadingText,
  spinnerPosition = "left",
  disabled,
  icon,
  ...props
}: LoadingButtonProps) {
  const isDisabled = disabled || loading;

  const spinner = (
    <Loader2
      className="h-4 w-4 animate-spin"
      aria-hidden="true"
    />
  );

  const content = loading ? (
    <>
      {spinnerPosition === "left" && spinner}
      {loadingText ?? children}
      {spinnerPosition === "right" && spinner}
    </>
  ) : (
    <>
      {icon}
      {children}
    </>
  );

  return (
    <Button
      disabled={isDisabled}
      aria-busy={loading}
      aria-disabled={isDisabled}
      {...props}
    >
      {content}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Preset variants for common actions
// ---------------------------------------------------------------------------

export interface SaveButtonProps extends Omit<LoadingButtonProps, "loadingText"> {
  saving?: boolean;
}

export function SaveButton({ saving, children, ...props }: SaveButtonProps) {
  return (
    <LoadingButton loading={saving} loadingText="Saving..." {...props}>
      {children ?? "Save"}
    </LoadingButton>
  );
}

export interface SubmitButtonProps extends Omit<LoadingButtonProps, "loadingText" | "type"> {
  submitting?: boolean;
}

export function SubmitButton({ submitting, children, ...props }: SubmitButtonProps) {
  return (
    <LoadingButton loading={submitting} loadingText="Submitting..." type="submit" {...props}>
      {children ?? "Submit"}
    </LoadingButton>
  );
}

export interface DeleteButtonProps extends Omit<LoadingButtonProps, "loadingText" | "variant"> {
  deleting?: boolean;
}

export function DeleteButton({ deleting, children, ...props }: DeleteButtonProps) {
  return (
    <LoadingButton
      loading={deleting}
      loadingText="Deleting..."
      variant="destructive"
      {...props}
    >
      {children ?? "Delete"}
    </LoadingButton>
  );
}
