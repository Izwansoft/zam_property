// =============================================================================
// VendorSettingsForm — Business info, logo, visibility
// =============================================================================

"use client";

import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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

import { showSuccess, showError } from "@/lib/errors/toast-helpers";
import type { VendorSettings, UpdateVendorSettingsDto } from "../types/vendor-settings";
import {
  useUpdateVendorSettings,
  useUploadVendorLogo,
} from "../hooks/use-vendor-settings";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const vendorSettingsSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  description: z.string().max(1000, "Description must be under 1000 characters").optional().or(z.literal("")),
  contactEmail: z.string().email("Enter a valid email").min(1, "Email is required"),
  contactPhone: z.string().min(1, "Phone is required"),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  isPublicProfile: z.boolean(),
  showContactInfo: z.boolean(),
  showEmail: z.boolean(),
  showPhone: z.boolean(),
});

type VendorSettingsFormValues = z.infer<typeof vendorSettingsSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VendorSettingsFormProps {
  settings: VendorSettings;
  vendorId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VendorSettingsForm({
  settings,
  vendorId,
}: VendorSettingsFormProps) {
  const updateMutation = useUpdateVendorSettings(vendorId);
  const uploadLogo = useUploadVendorLogo(vendorId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<VendorSettingsFormValues>({
    resolver: zodResolver(vendorSettingsSchema),
    defaultValues: {
      businessName: settings.businessName ?? "",
      description: settings.description ?? "",
      contactEmail: settings.contactEmail ?? "",
      contactPhone: settings.contactPhone ?? "",
      website: settings.website ?? "",
      isPublicProfile: settings.isPublicProfile ?? true,
      showContactInfo: settings.showContactInfo ?? true,
      showEmail: settings.showEmail ?? true,
      showPhone: settings.showPhone ?? true,
    },
  });

  const handleSubmit = useCallback(
    (values: VendorSettingsFormValues) => {
      const dto: UpdateVendorSettingsDto = {
        ...values,
        website: values.website || undefined,
        description: values.description || undefined,
      };
      updateMutation.mutate(dto, {
        onSuccess: () => showSuccess("Settings saved successfully."),
        onError: () => showError("Failed to save settings."),
      });
    },
    [updateMutation]
  );

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file
      if (!file.type.startsWith("image/")) {
        showError("Please select an image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showError("Logo must be under 5MB.");
        return;
      }

      // Preview
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);

      // Upload
      uploadLogo.mutate(file, {
        onSuccess: () => showSuccess("Logo uploaded successfully."),
        onError: () => {
          showError("Failed to upload logo.");
          setLogoPreview(null);
        },
      });
    },
    [uploadLogo]
  );

  const currentLogo = logoPreview ?? settings.logoUrl;

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo</CardTitle>
          <CardDescription>
            Upload your business logo. Recommended: 256×256px, PNG or JPG.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={currentLogo ?? undefined} alt="Vendor logo" />
              <AvatarFallback>
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadLogo.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadLogo.isPending ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UploadIcon className="mr-2 h-4 w-4" />
                )}
                {uploadLogo.isPending ? "Uploading..." : "Upload Logo"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Max 5MB. PNG, JPG, or WebP.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Info Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business Information</CardTitle>
              <CardDescription>
                Update your business details visible to tenants and customers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your business name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell customers about your business..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {(field.value?.length ?? 0)}/1000 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+60 12-345 6789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://your-website.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Visibility Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visibility Settings</CardTitle>
              <CardDescription>
                Control what is visible on your public vendor profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="isPublicProfile"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="isPublicProfile">Public Profile</Label>
                      <p className="text-xs text-muted-foreground">
                        Make your vendor profile visible to the public.
                      </p>
                    </div>
                    <Switch
                      id="isPublicProfile"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="showContactInfo"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="showContactInfo">Show Contact Info</Label>
                      <p className="text-xs text-muted-foreground">
                        Display contact information on your public profile.
                      </p>
                    </div>
                    <Switch
                      id="showContactInfo"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="showEmail"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-3 pl-8">
                    <div className="space-y-0.5">
                      <Label htmlFor="showEmail">Show Email</Label>
                      <p className="text-xs text-muted-foreground">
                        Display your email address publicly.
                      </p>
                    </div>
                    <Switch
                      id="showEmail"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="showPhone"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-3 pl-8">
                    <div className="space-y-0.5">
                      <Label htmlFor="showPhone">Show Phone</Label>
                      <p className="text-xs text-muted-foreground">
                        Display your phone number publicly.
                      </p>
                    </div>
                    <Switch
                      id="showPhone"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateMutation.isPending || !form.formState.isDirty}
            >
              {updateMutation.isPending ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Settings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function VendorSettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-9 w-28" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
