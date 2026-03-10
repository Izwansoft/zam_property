"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell, AuthLogo } from "@/components/common/auth-shell";

import { useAuth, useLoginRedirect } from "@/modules/auth";
import { normalizeError } from "@/lib/errors";
import { PLATFORM_BRAND } from "@/config/branding";
import { Role } from "@/modules/auth";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

function getAuthErrorMessage(code: string | undefined, message: string): string {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return "Invalid email or password. Please try again.";
    case "ACCOUNT_LOCKED":
      return "Your account has been locked. Please contact support.";
    case "ACCOUNT_SUSPENDED":
      return "Your account has been suspended.";
    case "FORBIDDEN":
      return "This login is for administrators only.";
    default:
      return message || "An unexpected error occurred. Please try again.";
  }
}

function getReasonMessage(reason: string | null): string | null {
  switch (reason) {
    case "session_expired":
      return "Your session has expired. Please sign in again.";
    case "unauthorized":
      return "Please sign in to access the admin portal.";
    case "forbidden":
      return "You don't have permission to access that page.";
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Admin Login Page
// ---------------------------------------------------------------------------

const brand = PLATFORM_BRAND;

export default function AdminLoginPage() {
  const { login } = useAuth();
  const { handlePostLogin } = useLoginRedirect();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasonMessage = getReasonMessage(reason);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const user = await login(values);

      // Enforce: only SUPER_ADMIN can use the admin portal
      if (user.role !== Role.SUPER_ADMIN) {
        setServerError("This login is for administrators only.");
        return;
      }

      handlePostLogin(user);
    } catch (err) {
      const appError = normalizeError(err);
      setServerError(getAuthErrorMessage(appError.code, appError.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell brand={brand}>
      {/* Logo & Header */}
      <div className="text-center">
        <AuthLogo brand={brand} />
        <div className="mt-6 flex items-center justify-center gap-2">
          <ShieldCheck className="text-primary h-7 w-7" />
          <h2 className="text-3xl font-bold">{brand.loginHeading}</h2>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          {brand.loginSubheading}
        </p>
      </div>

      {/* Reason banner */}
      {reasonMessage && (
        <Alert variant="default">
          <AlertDescription>{reasonMessage}</AlertDescription>
        </Alert>
      )}

      {/* Server error */}
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6" noValidate>
        <div className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email address</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              placeholder="admin@zamdigital.com"
              disabled={isSubmitting}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "admin-email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="admin-email-error" className="text-destructive text-sm">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "admin-password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="admin-password-error" className="text-destructive text-sm">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Forgot password */}
          <div className="text-end">
            <Link
              href="/admin/forgot-password"
              className="text-primary text-sm underline hover:no-underline"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in to Admin
        </Button>
      </form>

      {/* Partner login link */}
      <div className="text-muted-foreground text-center text-xs">
        Not an administrator?{" "}
        <Link href="/login" className="text-primary underline hover:no-underline">
          Go to partner login
        </Link>
      </div>
    </AuthShell>
  );
}
