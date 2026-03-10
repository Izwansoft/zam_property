// =============================================================================
// AccountSettingsForm — Language, timezone, privacy settings
// =============================================================================

"use client";

import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FormWrapper } from "@/components/forms/form-wrapper";
import { SelectField, SwitchField } from "@/components/forms/form-fields";
import { FormSection, FormGrid, FormActions } from "@/components/forms/form-wrapper";
import { SaveButton } from "@/components/common/loading-button";
import type { AccountSettings, UpdateAccountSettingsDto } from "../types";

// ---------------------------------------------------------------------------
// Zod Schema
// ---------------------------------------------------------------------------

const settingsSchema = z.object({
  language: z.enum(["en", "ms", "zh"]),
  timezone: z.enum(["Asia/Kuala_Lumpur", "Asia/Singapore", "UTC"]),
  showProfile: z.boolean(),
  showEmail: z.boolean(),
  showPhone: z.boolean(),
});

// Schema compat for zodResolver
const settingsSchemaCompat = settingsSchema as unknown as z.ZodType<z.infer<typeof settingsSchema>>;

type SettingsFormValues = z.infer<typeof settingsSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AccountSettingsFormProps {
  settings: AccountSettings;
  onSave: (dto: UpdateAccountSettingsDto) => void;
  saving: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AccountSettingsForm({
  settings,
  onSave,
  saving,
}: AccountSettingsFormProps) {
  const defaultValues: SettingsFormValues = {
    language: settings.language,
    timezone: settings.timezone,
    showProfile: settings.privacy.showProfile,
    showEmail: settings.privacy.showEmail,
    showPhone: settings.privacy.showPhone,
  };

  const handleSubmit = (values: SettingsFormValues) => {
    onSave({
      language: values.language,
      timezone: values.timezone,
      privacy: {
        showProfile: values.showProfile,
        showEmail: values.showEmail,
        showPhone: values.showPhone,
      },
    });
  };

  return (
    <FormWrapper
      schema={settingsSchemaCompat as any}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
    >
      {(form) => (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>
                Configure your language and timezone preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormSection title="Preferences">
                <FormGrid columns={2}>
                  <SelectField
                    name="language"
                    label="Language"
                    options={[
                      { value: "en", label: "English" },
                      { value: "ms", label: "Bahasa Melayu" },
                      { value: "zh", label: "中文" },
                    ]}
                  />
                  <SelectField
                    name="timezone"
                    label="Timezone"
                    options={[
                      { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur (GMT+8)" },
                      { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
                      { value: "UTC", label: "UTC (GMT+0)" },
                    ]}
                  />
                </FormGrid>
              </FormSection>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>
                Control what information is visible to others.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormSection title="Privacy Settings">
                <div className="space-y-4">
                  <SwitchField
                    name="showProfile"
                    label="Show profile publicly"
                    description="Allow others to see your profile on the platform."
                  />
                  <SwitchField
                    name="showEmail"
                    label="Show email address"
                    description="Display your email on your public profile."
                  />
                  <SwitchField
                    name="showPhone"
                    label="Show phone number"
                    description="Display your phone number on your public profile."
                  />
                </div>
              </FormSection>
            </CardContent>
          </Card>

          <FormActions>
            <SaveButton
              saving={saving}
              disabled={!form.formState.isDirty}
            >
              Save Settings
            </SaveButton>
          </FormActions>
        </div>
      )}
    </FormWrapper>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function AccountSettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
