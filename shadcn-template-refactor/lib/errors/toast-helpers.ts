// =============================================================================
// Toast Helpers — Consistent toast notifications using Sonner
// =============================================================================
// Provides showSuccess, showError, showWarning, showInfo helpers that wrap
// the Sonner toast library with consistent styling and behavior.
// =============================================================================

import { toast } from "sonner";
import { normalizeError } from "@/lib/errors";
import { getUserMessage } from "@/lib/errors/error-handler";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToastOptions {
  /** Optional description shown below the title */
  description?: string;
  /** Duration in ms (default: success=3000, error=5000, others=4000) */
  duration?: number;
  /** Action button label and handler */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Unique ID to prevent duplicate toasts */
  id?: string | number;
}

// ---------------------------------------------------------------------------
// showSuccess — auto-dismiss success toast
// ---------------------------------------------------------------------------

export function showSuccess(message: string, options?: ToastOptions) {
  return toast.success(message, {
    description: options?.description,
    duration: options?.duration ?? 3000,
    id: options?.id,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
  });
}

// ---------------------------------------------------------------------------
// showError — persistent error toast (longer duration)
// ---------------------------------------------------------------------------

export function showError(message: string, options?: ToastOptions) {
  return toast.error(message, {
    description: options?.description,
    duration: options?.duration ?? 6000,
    id: options?.id,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
  });
}

// ---------------------------------------------------------------------------
// showWarning — warning toast
// ---------------------------------------------------------------------------

export function showWarning(message: string, options?: ToastOptions) {
  return toast.warning(message, {
    description: options?.description,
    duration: options?.duration ?? 5000,
    id: options?.id,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
  });
}

// ---------------------------------------------------------------------------
// showInfo — info toast
// ---------------------------------------------------------------------------

export function showInfo(message: string, options?: ToastOptions) {
  return toast.info(message, {
    description: options?.description,
    duration: options?.duration ?? 4000,
    id: options?.id,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
  });
}

// ---------------------------------------------------------------------------
// showApiError — shows user-friendly error from any caught error
// ---------------------------------------------------------------------------

/**
 * Takes any error (Axios, JS Error, AppError, unknown) and shows
 * a user-friendly toast message. Never shows raw error objects.
 */
export function showApiError(error: unknown, options?: ToastOptions) {
  const appError = normalizeError(error);
  const message = getUserMessage(appError);
  return showError(message, {
    description: options?.description,
    duration: options?.duration,
    id: options?.id ?? `api-error-${appError.code}`,
    action: options?.action,
  });
}

// ---------------------------------------------------------------------------
// showMutationSuccess — common pattern for mutation success
// ---------------------------------------------------------------------------

export function showMutationSuccess(
  entityName: string,
  action: "created" | "updated" | "deleted" | "saved" | "published" | "archived" | string
) {
  return showSuccess(`${entityName} ${action} successfully`);
}

// ---------------------------------------------------------------------------
// showMutationError — common pattern for mutation error
// ---------------------------------------------------------------------------

export function showMutationError(
  error: unknown,
  entityName?: string,
  action?: string
) {
  const appError = normalizeError(error);
  const message = getUserMessage(appError);
  const prefix =
    entityName && action ? `Failed to ${action} ${entityName}: ` : "";
  return showError(`${prefix}${message}`);
}

// ---------------------------------------------------------------------------
// dismissToast — dismiss a specific or all toasts
// ---------------------------------------------------------------------------

export function dismissToast(id?: string | number) {
  toast.dismiss(id);
}

// ---------------------------------------------------------------------------
// showLoading — promise toast for async operations
// ---------------------------------------------------------------------------

export function showLoading<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error?: string;
  }
) {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: (err) => {
      const appError = normalizeError(err);
      return messages.error ?? getUserMessage(appError);
    },
  });
}
