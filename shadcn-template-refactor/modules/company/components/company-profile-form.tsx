// =============================================================================
// CompanyProfileForm — Company profile settings form
// =============================================================================

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCompanyProfile, useUpdateCompanyProfile } from "../hooks/useCompanySettings";
import type { UpdateCompanyProfileDto } from "../types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  bio: z.string().max(1000).optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  established: z.coerce.number().min(1800).max(new Date().getFullYear()).optional().or(z.literal("")),
  teamSize: z.coerce.number().min(1).optional().or(z.literal("")),
  specialties: z.string().optional(),
  serviceAreas: z.string().optional(),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  tiktokUrl: z.string().url().optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CompanyProfileFormProps {
  companyId: string;
}

export function CompanyProfileForm({ companyId }: CompanyProfileFormProps) {
  const { data: profile, isLoading } = useCompanyProfile(companyId);
  const updateProfile = useUpdateCompanyProfile(companyId);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: "",
      website: "",
      established: "",
      teamSize: "",
      specialties: "",
      serviceAreas: "",
      facebookUrl: "",
      instagramUrl: "",
      linkedinUrl: "",
      youtubeUrl: "",
      tiktokUrl: "",
    },
  });

  // Reset form when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        bio: profile.bio ?? "",
        website: profile.website ?? "",
        established: profile.established ?? "",
        teamSize: profile.teamSize ?? "",
        specialties: profile.specialties?.join(", ") ?? "",
        serviceAreas: profile.serviceAreas?.join(", ") ?? "",
        facebookUrl: profile.facebookUrl ?? "",
        instagramUrl: profile.instagramUrl ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        youtubeUrl: profile.youtubeUrl ?? "",
        tiktokUrl: profile.tiktokUrl ?? "",
      });
    }
  }, [profile, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    const dto: UpdateCompanyProfileDto = {
      bio: values.bio || undefined,
      website: values.website || undefined,
      established: values.established ? Number(values.established) : undefined,
      teamSize: values.teamSize ? Number(values.teamSize) : undefined,
      specialties: values.specialties ? values.specialties.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      serviceAreas: values.serviceAreas ? values.serviceAreas.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      facebookUrl: values.facebookUrl || undefined,
      instagramUrl: values.instagramUrl || undefined,
      linkedinUrl: values.linkedinUrl || undefined,
      youtubeUrl: values.youtubeUrl || undefined,
      tiktokUrl: values.tiktokUrl || undefined,
    };

    await updateProfile.mutateAsync(dto);
  };

  if (isLoading) {
    return <CompanyProfileFormSkeleton />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about your company..."
                  className="min-h-[120px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A brief description of your company (max 1000 characters).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://yourcompany.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="established"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year Established</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="2020" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="teamSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Size</FormLabel>
              <FormControl>
                <Input type="number" placeholder="10" {...field} />
              </FormControl>
              <FormDescription>Number of people in your team.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialties"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specialties</FormLabel>
              <FormControl>
                <Input placeholder="Residential, Commercial, Industrial" {...field} />
              </FormControl>
              <FormDescription>Comma-separated list of your specialties.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serviceAreas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Areas</FormLabel>
              <FormControl>
                <Input placeholder="Kuala Lumpur, Selangor, Johor" {...field} />
              </FormControl>
              <FormDescription>Comma-separated list of areas you serve.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Social Media Links</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="facebookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook</FormLabel>
                  <FormControl>
                    <Input placeholder="https://facebook.com/yourpage" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instagramUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <Input placeholder="https://instagram.com/yourpage" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedinUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/company/yourcompany" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="youtubeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube</FormLabel>
                  <FormControl>
                    <Input placeholder="https://youtube.com/@yourchannel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tiktokUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TikTok</FormLabel>
                  <FormControl>
                    <Input placeholder="https://tiktok.com/@yourprofile" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}

function CompanyProfileFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-32 ml-auto" />
    </div>
  );
}
