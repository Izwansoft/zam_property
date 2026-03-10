// =============================================================================
// Step 1: Personal Details — IC, employment information
// =============================================================================

"use client";

import { useFormContext } from "react-hook-form";
import { User, Briefcase, Phone } from "lucide-react";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

import type { OnboardingFormValues } from "./onboarding-schema";
import { EMPLOYMENT_STATUS_OPTIONS, NATIONALITY_OPTIONS } from "./onboarding-types";

export function StepPersonalDetails() {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<OnboardingFormValues>();

  const employmentStatus = watch("employmentStatus");
  const showEmploymentDetails =
    employmentStatus === "EMPLOYED" || employmentStatus === "SELF_EMPLOYED";

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Basic identification and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name (as per IC/Passport) *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="icNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IC Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 900101-01-1234"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Malaysian IC number</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="passportNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passport Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter passport number" {...field} />
                  </FormControl>
                  <FormDescription>For non-Malaysians</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {errors.icNumber?.type === "custom" && (
            <p className="text-sm text-destructive">
              Either IC Number or Passport Number is required
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nationality *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NATIONALITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Phone className="size-4" />
                  Phone Number *
                </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="e.g., 0123456789"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="size-5" />
            Employment Information
          </CardTitle>
          <CardDescription>
            Your current employment status and details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="employmentStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Status *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {showEmploymentDetails && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="employerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employer / Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your job title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="employerAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employer Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter employer address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="monthlyIncome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Income (RM)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 5000"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This helps property owners evaluate your application
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
