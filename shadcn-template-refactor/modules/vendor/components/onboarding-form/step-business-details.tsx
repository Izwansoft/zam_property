// =============================================================================
// Step 2: Business Details — Registration number and address
// =============================================================================

"use client";

import { useFormContext } from "react-hook-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import type { OnboardingFormValues } from "./onboarding-schema";
import { MALAYSIAN_STATES } from "./onboarding-schema";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepBusinessDetails() {
  const form = useFormContext<OnboardingFormValues>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Business Details</h2>
        <p className="text-sm text-muted-foreground">
          Provide your office or operating address for verification and profile display.
        </p>
      </div>

      {/* Address */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Business Address</CardTitle>
          <CardDescription>
            Your office or business location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Address Line 1 */}
          <FormField
            control={form.control}
            name="address.line1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 1 *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Street address, building name, unit number"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address Line 2 */}
          <FormField
            control={form.control}
            name="address.line2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 2</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Area, neighbourhood (optional)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {/* City */}
            <FormField
              control={form.control}
              name="address.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Kuala Lumpur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* State */}
            <FormField
              control={form.control}
              name="address.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MALAYSIAN_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Postal Code */}
            <FormField
              control={form.control}
              name="address.postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 50088" maxLength={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Country (read-only — Malaysia only) */}
            <FormField
              control={form.control}
              name="address.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...field} disabled className="hidden" />
                  </FormControl>
                  <Input value="Malaysia" disabled />
                  <FormDescription>
                    Currently available in Malaysia only.
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
