"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

import { useAuth } from "@/modules/auth";
import { normalizeError } from "@/lib/errors";
import { DEFAULT_PARTNER_BRAND } from "@/config/branding";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Full name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\+?[0-9]{7,15}$/.test(val),
        "Please enter a valid phone number"
      ),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Error message mapping
// ---------------------------------------------------------------------------

function getRegisterErrorMessage(code: string | undefined, message: string): string {
  switch (code) {
    case "EMAIL_ALREADY_EXISTS":
    case "CONFLICT":
      return "An account with this email already exists. Please sign in instead.";
    case "VALIDATION_ERROR":
      return message || "Please check the form fields and try again.";
    case "TOO_MANY_ATTEMPTS":
      return "Too many registration attempts. Please try again later.";
    default:
      return message || "An unexpected error occurred. Please try again.";
  }
}

// ---------------------------------------------------------------------------
// Register Page Component
// ---------------------------------------------------------------------------

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const brand = DEFAULT_PARTNER_BRAND;
  const intent = searchParams.get("intent");
  const vertical = searchParams.get("vertical");

  useEffect(() => {
    if (intent === "vendor") {
      window.sessionStorage.setItem("zam_pending_vendor_intent", "vendor");
      if (vertical) {
        window.sessionStorage.setItem("zam_pending_vendor_vertical", vertical);
      } else {
        window.sessionStorage.removeItem("zam_pending_vendor_vertical");
      }
    }
  }, [intent, vertical]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      await registerUser({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone || undefined,
      });

      // Registration successful — redirect to login
      setIsSuccess(true);
      setTimeout(() => {
        if (intent === "vendor") {
          window.sessionStorage.setItem("zam_pending_vendor_intent", "vendor");
          if (vertical) {
            window.sessionStorage.setItem("zam_pending_vendor_vertical", vertical);
          }
        }

        const params = new URLSearchParams();
        if (intent) params.set("intent", intent);
        if (vertical) params.set("vertical", vertical);
        const query = params.toString();
        router.push(query ? `/login?${query}` : "/login");
      }, 2000);
    } catch (err) {
      const appError = normalizeError(err);
      setServerError(getRegisterErrorMessage(appError.code, appError.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginHref = (() => {
    const params = new URLSearchParams();
    if (intent) params.set("intent", intent);
    if (vertical) params.set("vertical", vertical);
    const query = params.toString();
    return query ? `/login?${query}` : "/login";
  })();

  return (
    <AuthShell brand={brand}>
      {/* Logo & Header */}
      <div className="text-center">
        <AuthLogo brand={brand} />
        <h2 className="mt-6 text-3xl font-bold">{brand.registerHeading}</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {brand.registerSubheading}
        </p>
      </div>

          {/* Success message */}
          {isSuccess && (
            <Alert>
              <AlertDescription>
                Registration successful! Redirecting to sign in...
              </AlertDescription>
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
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  disabled={isSubmitting || isSuccess}
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p id="fullName-error" className="text-destructive text-sm">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  disabled={isSubmitting || isSuccess}
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

              {/* Phone (optional) */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone number <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+60123456789"
                  disabled={isSubmitting || isSuccess}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  {...register("phone")}
                />
                {errors.phone && (
                  <p id="phone-error" className="text-destructive text-sm">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  disabled={isSubmitting || isSuccess}
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

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  disabled={isSubmitting || isSuccess}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="text-destructive text-sm">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isSubmitting || isSuccess}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>

      {/* Login link */}
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href={loginHref} className="text-primary underline hover:no-underline">
          Sign in
        </Link>
      </div>
    </AuthShell>
  );
}
