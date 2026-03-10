"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell, AuthLogo } from "@/components/common/auth-shell";

import { DEFAULT_PARTNER_BRAND } from "@/config/branding";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// ---------------------------------------------------------------------------
// Forgot Password Page Component
// ---------------------------------------------------------------------------

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const brand = DEFAULT_PARTNER_BRAND;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (_values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);

    // Simulate API call — actual endpoint not yet implemented in backend
    // POST /api/v1/auth/forgot-password
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Always show success to avoid email enumeration
    setIsSuccess(true);
    setIsSubmitting(false);
  };

  return (
    <AuthShell brand={brand}>
      {/* Back link */}
      <div>
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>

      {/* Logo & Header */}
      <div className="text-center">
        <AuthLogo brand={brand} />
        <h2 className="mt-6 text-3xl font-bold">{brand.forgotHeading}</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-6">
          <Alert>
            <AlertDescription>
              If an account exists with that email address, you will receive a
              password reset link shortly. Please check your inbox (and spam
              folder).
            </AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <Link href="/login">Return to sign in</Link>
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
