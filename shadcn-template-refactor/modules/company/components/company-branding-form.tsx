// =============================================================================
// CompanyBrandingForm — Company branding settings form
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCompanyBranding, useUpdateCompanyBranding } from "../hooks/useCompanySettings";
import type { UpdateCompanyBrandingDto } from "../types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const brandingSchema = z.object({
  logo: z.string().optional().or(z.literal("")),
  logoIcon: z.string().optional().or(z.literal("")),
  logoDark: z.string().optional().or(z.literal("")),
  favicon: z.string().optional().or(z.literal("")),
  primaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color")
    .optional()
    .or(z.literal("")),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CompanyBrandingFormProps {
  companyId: string;
}

export function CompanyBrandingForm({ companyId }: CompanyBrandingFormProps) {
  const { data: branding, isLoading } = useCompanyBranding(companyId);
  const updateBranding = useUpdateCompanyBranding(companyId);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      logo: "",
      logoIcon: "",
      logoDark: "",
      favicon: "",
      primaryColor: "",
    },
  });

  // Reset form when branding loads
  useEffect(() => {
    if (branding) {
      form.reset({
        logo: branding.logo ?? "",
        logoIcon: branding.logoIcon ?? "",
        logoDark: branding.logoDark ?? "",
        favicon: branding.favicon ?? "",
        primaryColor: branding.primaryColor ?? "",
      });
    }
  }, [branding, form]);

  const onSubmit = async (values: BrandingFormValues) => {
    const dto: UpdateCompanyBrandingDto = {
      logo: values.logo || undefined,
      logoIcon: values.logoIcon || undefined,
      logoDark: values.logoDark || undefined,
      favicon: values.favicon || undefined,
      primaryColor: values.primaryColor || undefined,
    };

    await updateBranding.mutateAsync(dto);
  };

  if (isLoading) {
    return <CompanyBrandingFormSkeleton />;
  }

  const logoValue = form.watch("logo");
  const logoIconValue = form.watch("logoIcon");
  const logoDarkValue = form.watch("logoDark");
  const primaryColorValue = form.watch("primaryColor");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo Preview */}
        <div className="flex items-center gap-6 pb-4 border-b">
          <div className="space-y-2">
            <span className="text-sm font-medium">Logo Preview</span>
            <Avatar className="h-16 w-16 rounded-lg">
              <AvatarImage src={logoValue || undefined} alt="Company logo" />
              <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
                Logo
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">Icon Preview</span>
            <Avatar className="h-12 w-12 rounded-md">
              <AvatarImage src={logoIconValue || undefined} alt="Company icon" />
              <AvatarFallback className="rounded-md bg-muted text-muted-foreground">
                Icon
              </AvatarFallback>
            </Avatar>
          </div>
          {primaryColorValue && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Primary Color</span>
              <div
                className="h-12 w-12 rounded-md border"
                style={{ backgroundColor: primaryColorValue }}
              />
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="logo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Main Logo URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/logo.png" {...field} />
              </FormControl>
              <FormDescription>
                Your main company logo. Recommended size: 200x50px.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logoIcon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo Icon URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/icon.png" {...field} />
              </FormControl>
              <FormDescription>
                Square icon version. Recommended size: 64x64px.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logoDark"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dark Mode Logo URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/logo-dark.png" {...field} />
              </FormControl>
              <FormDescription>
                Logo for dark mode backgrounds (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="favicon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Favicon URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/favicon.ico" {...field} />
              </FormControl>
              <FormDescription>
                Small icon for browser tabs. Recommended: 32x32px .ico or .png.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Brand Color</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input placeholder="#3B82F6" {...field} />
                </FormControl>
                {field.value && (
                  <div
                    className="h-10 w-10 rounded-md border shrink-0"
                    style={{ backgroundColor: field.value }}
                  />
                )}
              </div>
              <FormDescription>
                Hex color code for your brand (e.g., #3B82F6).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={updateBranding.isPending}>
            {updateBranding.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}

function CompanyBrandingFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 pb-4 border-b">
        <Skeleton className="h-16 w-16 rounded-lg" />
        <Skeleton className="h-12 w-12 rounded-md" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 ml-auto" />
    </div>
  );
}
