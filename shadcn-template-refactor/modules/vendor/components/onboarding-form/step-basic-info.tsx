"use client";

import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Building2, User } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCompanies } from "@/modules/company/hooks/useCompany";
import { useAgents } from "@/modules/agent/hooks/useAgents";

import type { OnboardingFormValues } from "./onboarding-schema";
import { PROFILE_MODEL_OPTIONS } from "./onboarding-schema";

const PROFILE_MODEL_ICONS: Record<string, React.ReactNode> = {
  COMPANY: <Building2 className="size-5" />,
  PROPERTY_OWNER: <User className="size-5" />,
  INDIVIDUAL_AGENT: <User className="size-5" />,
  AGENT_UNDER_COMPANY: <User className="size-5" />,
};

const PROFILE_TO_VENDOR_TYPE: Record<
  "COMPANY" | "PROPERTY_OWNER" | "INDIVIDUAL_AGENT" | "AGENT_UNDER_COMPANY",
  "COMPANY" | "INDIVIDUAL"
> = {
  COMPANY: "COMPANY",
  PROPERTY_OWNER: "INDIVIDUAL",
  INDIVIDUAL_AGENT: "INDIVIDUAL",
  AGENT_UNDER_COMPANY: "INDIVIDUAL",
};

const REGISTRATION_PLACEHOLDER: Record<string, string> = {
  COMPANY: "e.g., SSM-12345678",
  PROPERTY_OWNER: "e.g., IC/PASSPORT-123456",
  INDIVIDUAL_AGENT: "e.g., REN-12345678",
  AGENT_UNDER_COMPANY: "e.g., REN-12345678",
};

const REGISTRATION_HINT: Record<string, string> = {
  COMPANY: "Company registration number (SSM).",
  PROPERTY_OWNER: "Owner identification reference used for verification.",
  INDIVIDUAL_AGENT: "Use your negotiator/license registration number (REN).",
  AGENT_UNDER_COMPANY: "Use your negotiator/license registration number (REN).",
};

export function StepBasicInfo() {
  const form = useFormContext<OnboardingFormValues>();
  const [companySearch, setCompanySearch] = useState("");

  const profileModel = form.watch("profileModel");
  const selectedCompanyId = form.watch("companyId");

  const registrationPlaceholder = REGISTRATION_PLACEHOLDER[profileModel || "INDIVIDUAL_AGENT"];
  const registrationHint = REGISTRATION_HINT[profileModel || "INDIVIDUAL_AGENT"];

  const { data: companiesData } = useCompanies({
    page: 1,
    pageSize: 25,
    search: companySearch || undefined,
  });

  const companies = companiesData?.items ?? [];

  const { data: agentsData } = useAgents({
    page: 1,
    limit: 50,
    companyId: selectedCompanyId || undefined,
  });

  const agents = agentsData?.items ?? [];

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId),
    [companies, selectedCompanyId],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Basic Information</h2>
        <p className="text-sm text-muted-foreground">
          Tell us about your registration profile. This helps us map your onboarding path correctly.
        </p>
      </div>

      <FormField
        control={form.control}
        name="profileModel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Registration Profile *</FormLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROFILE_MODEL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    field.onChange(option.value);
                    form.setValue("type", PROFILE_TO_VENDOR_TYPE[option.value], {
                      shouldValidate: true,
                    });
                    if (option.value !== "AGENT_UNDER_COMPANY") {
                      form.setValue("companyId", "");
                      form.setValue("companyName", "");
                      form.setValue("agentId", "");
                      form.setValue("agentName", "");
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors",
                    field.value === option.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/30 hover:bg-muted/50",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full",
                      field.value === option.value ? "bg-primary/10" : "bg-muted",
                    )}
                  >
                    {PROFILE_MODEL_ICONS[option.value]}
                  </span>
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {profileModel === "AGENT_UNDER_COMPANY" && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Company Association</CardTitle>
            <CardDescription>
              Choose the company you are registering under, then optionally link an existing agent profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormItem>
              <FormLabel htmlFor="company-search">Search Company</FormLabel>
              <FormControl>
                <Input
                  id="company-search"
                  placeholder="Type company name..."
                  value={companySearch}
                  onChange={(event) => setCompanySearch(event.target.value)}
                />
              </FormControl>
            </FormItem>

            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company *</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                      const company = companies.find((item) => item.id === value);
                      form.setValue("companyName", company?.name || "");
                      form.setValue("agentId", "");
                      form.setValue("agentName", "");
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Existing Agent (Optional)</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                      const agent = agents.find((item) => item.id === value);
                      form.setValue("agentName", agent?.user?.fullName || "");
                    }}
                    disabled={!selectedCompanyId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an existing agent" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.user?.fullName || agent.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    If this is a new agent registration, leave this empty and continue.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedCompany && (
              <p className="text-xs text-muted-foreground">
                Selected company: <span className="font-medium">{selectedCompany.name}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Contact Details</CardTitle>
          <CardDescription>How customers and tenants can reach you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Premium Properties Sdn Bhd" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="info@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about your business, specialties, and experience..."
                    className="min-h-25 resize-y"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  This will appear on your public vendor profile.
                  {field.value ? ` ${field.value.length}/2,000` : ""}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="registrationNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Number *</FormLabel>
                <FormControl>
                  <Input placeholder={registrationPlaceholder} {...field} />
                </FormControl>
                <FormDescription>{registrationHint}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
