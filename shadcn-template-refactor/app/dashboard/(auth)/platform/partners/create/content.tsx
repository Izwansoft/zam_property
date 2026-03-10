// =============================================================================
// Create Partner — Multi-step form (Platform Admin)
// =============================================================================
// Step 1: Basic Info (name, slug)
// Step 2: Select Verticals
// Step 3: Admin Account (email, name, password)
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2Icon,
  LayersIcon,
  UserPlusIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  ArrowLeftIcon,
  Loader2Icon,
} from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCreatePartner } from "@/modules/partner/hooks/use-partner-mutations";
import { useActiveVerticalDefinitions } from "@/modules/vertical/hooks/use-vertical-definitions";
import type { CreatePartnerDto } from "@/modules/vertical/types";

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

const STEPS = [
  { id: 1, label: "Basic Info", icon: Building2Icon },
  { id: 2, label: "Verticals", icon: LayersIcon },
  { id: 3, label: "Admin Account", icon: UserPlusIcon },
] as const;

// ---------------------------------------------------------------------------
// Form State
// ---------------------------------------------------------------------------

interface FormState {
  // Step 1
  name: string;
  slug: string;
  // Step 2
  verticalTypes: string[];
  // Step 3
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  adminPhone: string;
}

const INITIAL_STATE: FormState = {
  name: "",
  slug: "",
  verticalTypes: [],
  adminEmail: "",
  adminName: "",
  adminPassword: "",
  adminPhone: "",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreatePartnerContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);

  const createPartner = useCreatePartner();
  const { data: verticals, isLoading: verticalsLoading } =
    useActiveVerticalDefinitions();

  // ---- Field updater
  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ---- Auto-generate slug from name
  const handleNameChange = useCallback(
    (name: string) => {
      updateField("name", name);
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      updateField("slug", slug);
    },
    [updateField]
  );

  // ---- Toggle vertical
  const toggleVertical = useCallback(
    (type: string) => {
      setForm((prev) => ({
        ...prev,
        verticalTypes: prev.verticalTypes.includes(type)
          ? prev.verticalTypes.filter((t) => t !== type)
          : [...prev.verticalTypes, type],
      }));
    },
    []
  );

  // ---- Validation per step
  const isStepValid = (s: number): boolean => {
    switch (s) {
      case 1:
        return form.name.trim().length >= 2 && form.slug.trim().length >= 2;
      case 2:
        return true; // verticals are optional
      case 3:
        return (
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail) &&
          form.adminName.trim().length >= 2 &&
          form.adminPassword.length >= 8
        );
      default:
        return false;
    }
  };

  // ---- Submit
  const handleSubmit = useCallback(async () => {
    const dto: CreatePartnerDto = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      adminEmail: form.adminEmail.trim(),
      adminName: form.adminName.trim(),
      adminPassword: form.adminPassword,
      ...(form.verticalTypes.length > 0
        ? { verticalTypes: form.verticalTypes }
        : {}),
      ...(form.adminPhone.trim()
        ? { adminPhone: form.adminPhone.trim() }
        : {}),
    };

    createPartner.mutate(dto, {
      onSuccess: (data) => {
        toast({
          title: "Partner Created",
          description: `${form.name} has been created successfully.`,
        });
        router.push(`/dashboard/platform/partners/${data.id}`);
      },
      onError: (error) => {
        toast({
          title: "Creation Failed",
          description: error.message || "Failed to create partner.",
          variant: "destructive",
        });
      },
    });
  }, [form, createPartner, toast, router]);

  // ---- Step navigation
  const goNext = () => setStep((s) => Math.min(s + 1, 3));
  const goPrev = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Partner"
        description="Set up a new partner with admin user and vertical bindings."
        backHref="/dashboard/platform/partners"
      />

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map(({ id, label, icon: Icon }) => {
          const isActive = id === step;
          const isDone = id < step;
          return (
            <div key={id} className="flex items-center gap-2">
              {id > 1 && (
                <div
                  className={`h-px w-8 ${
                    isDone ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => id < step && setStep(id)}
                disabled={id > step}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-primary/10 text-primary cursor-pointer"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? (
                  <CheckCircle2Icon className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                {label}
              </button>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the partner&apos;s name and unique URL slug.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Partner Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Acme Realty"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  placeholder="e.g., acme-realty"
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  Must be unique. Used in URLs and API scoping.
                </p>
              </div>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Select Verticals</CardTitle>
              <CardDescription>
                Choose which business verticals this partner can operate in.
                You can change this later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verticalsLoading ? (
                <div className="flex items-center gap-2 py-8 text-muted-foreground">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Loading verticals…
                </div>
              ) : !verticals?.length ? (
                <p className="py-8 text-center text-muted-foreground">
                  No active verticals found. You can skip this step and
                  configure verticals later.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {verticals.map((v) => (
                    <label
                      key={v.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50 ${
                        form.verticalTypes.includes(v.type)
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <Checkbox
                        checked={form.verticalTypes.includes(v.type)}
                        onCheckedChange={() => toggleVertical(v.type)}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{v.name}</span>
                          {v.isCore && (
                            <Badge variant="secondary" className="text-xs">
                              Core
                            </Badge>
                          )}
                        </div>
                        {v.description && (
                          <p className="text-sm text-muted-foreground">
                            {v.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle>Admin Account</CardTitle>
              <CardDescription>
                Create the first administrator for this partner.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Full Name *</Label>
                  <Input
                    id="adminName"
                    placeholder="e.g., John Smith"
                    value={form.adminName}
                    onChange={(e) => updateField("adminName", e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@partner.com"
                    value={form.adminEmail}
                    onChange={(e) => updateField("adminEmail", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password *</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Min 8 characters"
                    value={form.adminPassword}
                    onChange={(e) =>
                      updateField("adminPassword", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPhone">Phone (optional)</Label>
                  <Input
                    id="adminPhone"
                    type="tel"
                    placeholder="+60 12-345 6789"
                    value={form.adminPhone}
                    onChange={(e) => updateField("adminPhone", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={step === 1}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back
        </Button>

        {step < 3 ? (
          <Button onClick={goNext} disabled={!isStepValid(step)}>
            Next
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!isStepValid(3) || createPartner.isPending}
          >
            {createPartner.isPending ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <CheckCircle2Icon className="mr-2 h-4 w-4" />
                Create Partner
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
