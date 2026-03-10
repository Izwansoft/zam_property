// =============================================================================
// Step 1: Company Details — Name, registration, type, contact
// =============================================================================

"use client";

import { useFormContext } from "react-hook-form";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { CompanyType, COMPANY_TYPE_CONFIG } from "../../types";
import type { RegistrationFormValues } from "./registration-schema";

export function StepCompanyDetails() {
  const { control } = useFormContext<RegistrationFormValues>();

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Company Information
          </CardTitle>
          <CardDescription>
            Basic company details and registration information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter company name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="registrationNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Number (SSM) *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., 202301012345 (12 digits)"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Your SSM registration number (ROC/ROB)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="companyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Type *</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid gap-3 sm:grid-cols-3"
                  >
                    {Object.entries(COMPANY_TYPE_CONFIG).map(
                      ([value, config]) => {
                        const Icon = config.icon;
                        return (
                          <Label
                            key={value}
                            htmlFor={`company-type-${value}`}
                            className={cn(
                              "flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition-colors hover:border-primary/50",
                              field.value === value &&
                                "border-primary bg-primary/5"
                            )}
                          >
                            <RadioGroupItem
                              value={value}
                              id={`company-type-${value}`}
                              className="sr-only"
                            />
                            <div className="flex items-center gap-2">
                              <Icon
                                className={cn(
                                  "size-4",
                                  field.value === value
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                )}
                              />
                              <span className="font-medium text-sm">
                                {config.label}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {config.description}
                            </span>
                          </Label>
                        );
                      }
                    )}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Contact Information
          </CardTitle>
          <CardDescription>
            Company contact details for communications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="companyEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    Email *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="company@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="companyPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    Phone *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+60123456789"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="companyAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  Address
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter company address"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>Optional</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
