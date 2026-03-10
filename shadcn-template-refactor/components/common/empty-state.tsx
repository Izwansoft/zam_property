// =============================================================================
// EmptyState — Reusable empty state component
// =============================================================================

"use client";

import { type LucideIcon, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Additional class name */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: "py-6",
      icon: "h-8 w-8",
      title: "text-sm",
      description: "text-xs",
    },
    md: {
      container: "py-10",
      icon: "h-12 w-12",
      title: "text-base",
      description: "text-sm",
    },
    lg: {
      container: "py-16",
      icon: "h-16 w-16",
      title: "text-lg",
      description: "text-base",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizes.container,
        className
      )}
    >
      <div className="rounded-full bg-muted p-4">
        <Icon className={cn("text-muted-foreground", sizes.icon)} />
      </div>
      <h3 className={cn("mt-4 font-semibold", sizes.title)}>{title}</h3>
      {description && (
        <p
          className={cn(
            "mt-2 max-w-sm text-muted-foreground",
            sizes.description
          )}
        >
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-4 flex gap-2">
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {action && <Button onClick={action.onClick}>{action.label}</Button>}
        </div>
      )}
    </div>
  );
}
