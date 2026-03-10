// =============================================================================
// CompanyGeneralSettingsForm — Commission, notifications, bank settings
// =============================================================================

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Percent, Bell, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCompanySettings, useUpdateCompanySettings } from "../hooks/useCompanySettings";
import type { UpdateCompanySettingsDto } from "../types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const settingsSchema = z.object({
  // Commission
  defaultCommissionRate: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  commissionSplit: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  
  // Notifications
  notificationEmail: z.string().email().optional().or(z.literal("")),
  enableEmailAlerts: z.boolean(),
  enableSmsAlerts: z.boolean(),
  
  // Bank
  bankName: z.string().optional().or(z.literal("")),
  bankAccount: z.string().optional().or(z.literal("")),
  bankAccountName: z.string().optional().or(z.literal("")),
  bankSwiftCode: z.string().optional().or(z.literal("")),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CompanyGeneralSettingsFormProps {
  companyId: string;
}

export function CompanyGeneralSettingsForm({ companyId }: CompanyGeneralSettingsFormProps) {
  const { data: settings, isLoading } = useCompanySettings(companyId);
  const updateSettings = useUpdateCompanySettings(companyId);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      defaultCommissionRate: "",
      commissionSplit: "",
      notificationEmail: "",
      enableEmailAlerts: true,
      enableSmsAlerts: false,
      bankName: "",
      bankAccount: "",
      bankAccountName: "",
      bankSwiftCode: "",
    },
  });

  // Reset form when settings load
  useEffect(() => {
    if (settings) {
      form.reset({
        defaultCommissionRate: settings.defaultCommissionRate ?? "",
        commissionSplit: settings.commissionSplit ?? "",
        notificationEmail: settings.notificationEmail ?? "",
        enableEmailAlerts: settings.enableEmailAlerts,
        enableSmsAlerts: settings.enableSmsAlerts,
        bankName: settings.bankName ?? "",
        bankAccount: settings.bankAccount ?? "",
        bankAccountName: settings.bankAccountName ?? "",
        bankSwiftCode: settings.bankSwiftCode ?? "",
      });
    }
  }, [settings, form]);

  const onSubmit = async (values: SettingsFormValues) => {
    const dto: UpdateCompanySettingsDto = {
      defaultCommissionRate: values.defaultCommissionRate ? Number(values.defaultCommissionRate) : undefined,
      commissionSplit: values.commissionSplit ? Number(values.commissionSplit) : undefined,
      notificationEmail: values.notificationEmail || undefined,
      enableEmailAlerts: values.enableEmailAlerts,
      enableSmsAlerts: values.enableSmsAlerts,
      bankName: values.bankName || undefined,
      bankAccount: values.bankAccount || undefined,
      bankAccountName: values.bankAccountName || undefined,
      bankSwiftCode: values.bankSwiftCode || undefined,
    };

    await updateSettings.mutateAsync(dto);
  };

  if (isLoading) {
    return <CompanyGeneralSettingsFormSkeleton />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Commission Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Commission Settings</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="defaultCommissionRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Commission Rate (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="3.00" {...field} />
                  </FormControl>
                  <FormDescription>
                    Standard commission rate for transactions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commissionSplit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agent Commission Split (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="70.00" {...field} />
                  </FormControl>
                  <FormDescription>
                    Percentage of commission that goes to agents.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Notification Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Notification Settings</h3>
          </div>

          <FormField
            control={form.control}
            name="notificationEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notification Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="notifications@company.com" {...field} />
                </FormControl>
                <FormDescription>
                  Email address for company notifications.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="enableEmailAlerts"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Email Alerts</FormLabel>
                    <FormDescription>
                      Receive notifications via email.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enableSmsAlerts"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">SMS Alerts</FormLabel>
                    <FormDescription>
                      Receive notifications via SMS.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Bank Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Bank Details</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Bank account for receiving commission payouts.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Maybank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankAccount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input placeholder="1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankAccountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Holder Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Company Sdn Bhd" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankSwiftCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SWIFT Code</FormLabel>
                  <FormControl>
                    <Input placeholder="MABORC3M" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}

function CompanyGeneralSettingsFormSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
      <Separator />
      <div className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
      <Separator />
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-10 w-32 ml-auto" />
    </div>
  );
}
