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

import { PLATFORM_BRAND } from "@/config/branding";

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
// Admin Forgot Password Page
// ---------------------------------------------------------------------------

const brand = PLATFORM_BRAND;

export default function AdminForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (_values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    // Simulate API call — POST /api/v1/auth/forgot-password
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSuccess(true);
    setIsSubmitting(false);
  };

  return (
    <AuthShell brand={brand}>
      {/* Back link */}
      <div>
        <Link
          href="/admin/login"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to admin sign in
        </Link>
      </div>

      {/* Logo & Header */}
      <div className="text-center">
        <AuthLogo brand={brand} />
        <h2 className="mt-6 text-3xl font-bold">{brand.forgotHeading}</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {brand.forgotSubheading}
        </p>
      </div>

      {isSuccess ? (
        <Alert>
          <AlertDescription>
            If an admin account with that email exists, we&apos;ve sent a
            password reset link. Please check your inbox.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6" noValidate>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-forgot-email">Email address</Label>
                <Input
                  id="admin-forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@zamdigital.com"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "admin-forgot-email-error" : undefined}
                  {...register("email")}
                />
                {errors.email && (
                  <p id="admin-forgot-email-error" className="text-destructive text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send reset link
            </Button>
          </form>
        </>
      )}

      {/* Back to login */}
      <div className="text-center text-sm">
        Remember your password?{" "}
        <Link href="/admin/login" className="text-primary underline hover:no-underline">
          Sign in
        </Link>
      </div>
    </AuthShell>
  );
}
