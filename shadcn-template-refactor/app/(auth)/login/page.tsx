"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell, AuthLogo } from "@/components/common/auth-shell";

import { useAuth, useLoginRedirect } from "@/modules/auth";
import { normalizeError } from "@/lib/errors";
import { DEFAULT_PARTNER_BRAND } from "@/config/branding";
import type { Role } from "@/modules/auth";

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
// Error message mapping
// ---------------------------------------------------------------------------

function getAuthErrorMessage(code: string | undefined, message: string): string {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return "Invalid email or password. Please try again.";
    case "ACCOUNT_LOCKED":
      return "Your account has been locked. Please contact support.";
    case "ACCOUNT_SUSPENDED":
      return "Your account has been suspended. Please contact support.";
    case "ACCOUNT_DEACTIVATED":
      return "Your account has been deactivated.";
    case "EMAIL_NOT_VERIFIED":
      return "Please verify your email address before signing in.";
    case "TOO_MANY_ATTEMPTS":
      return "Too many login attempts. Please try again later.";
    default:
      return message || "An unexpected error occurred. Please try again.";
  }
}

// ---------------------------------------------------------------------------
// Reason banner (shown when redirected from session expiry, etc.)
// ---------------------------------------------------------------------------

function getReasonMessage(reason: string | null): string | null {
  switch (reason) {
    case "session_expired":
      return "Your session has expired. Please sign in again.";
    case "unauthorized":
      return "Please sign in to access that page.";
    case "forbidden":
      return "You don't have permission to access that page.";
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Login Page Component
// ---------------------------------------------------------------------------

function LoginPageContent() {
  const { login } = useAuth();
  const { handlePostLogin } = useLoginRedirect();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const intent = searchParams.get("intent");
  const vertical = searchParams.get("vertical");

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasonMessage = getReasonMessage(reason);
  const brand = DEFAULT_PARTNER_BRAND;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const user = await login(values);
      handlePostLogin(user, { intent, vertical });
    } catch (err) {
      const appError = normalizeError(err);
      setServerError(getAuthErrorMessage(appError.code, appError.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const registerHref = (() => {
    const params = new URLSearchParams();
    if (intent) params.set("intent", intent);
    if (vertical) params.set("vertical", vertical);
    const query = params.toString();
    return query ? `/register?${query}` : "/register";
  })();

  return (
    <AuthShell brand={brand}>
      {/* Logo & Header */}
      <div className="text-center">
        <AuthLogo brand={brand} />
        <h2 className="mt-6 text-3xl font-bold">{brand.loginHeading}</h2>
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
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled={isSubmitting}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" className="text-destructive text-sm">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="password-error" className="text-destructive text-sm">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Forgot password link */}
          <div className="text-end">
            <Link
              href="/forgot-password"
              className="text-primary text-sm underline hover:no-underline"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>

      {/* Register link */}
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href={registerHref} className="text-primary underline hover:no-underline">
          Sign up
        </Link>
      </div>

      {/* Admin link */}
      <div className="text-muted-foreground text-center text-xs">
        Are you an administrator?{" "}
        <Link href="/admin/login" className="text-primary underline hover:no-underline">
          Admin login
        </Link>
      </div>
    </AuthShell>
  );
}

// ---------------------------------------------------------------------------
// Default Export with Suspense
// ---------------------------------------------------------------------------

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
