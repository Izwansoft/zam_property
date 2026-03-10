// =============================================================================
// ProfileEditForm — Customer profile edit form with Zod validation
// =============================================================================

"use client";

import { z } from "zod";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";
import { FormWrapper } from "@/components/forms/form-wrapper";
import { TextField } from "@/components/forms/form-fields";
import { FormSection, FormGrid, FormActions } from "@/components/forms/form-wrapper";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/common/loading-button";
import type { CustomerProfile, UpdateProfileDto } from "../types";
import { useUpdateProfile } from "../hooks/use-profile";

// ---------------------------------------------------------------------------
// Zod Schema
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  phone: z
    .string()
    .regex(/^(\+?[0-9\s\-()]{7,20})?$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const profileSchemaCompat = profileSchema as any;

type ProfileFormValues = z.infer<typeof profileSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProfileEditFormProps {
  profile: CustomerProfile;
  onCancel: () => void;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileEditForm({
  profile,
  onCancel,
  onSuccess,
}: ProfileEditFormProps) {

  const updateProfile = useUpdateProfile();

  const defaultValues: ProfileFormValues = {
    fullName: profile.fullName,
    phone: profile.phone ?? "",
  };

  const handleSubmit = async (values: ProfileFormValues) => {
    const dto: UpdateProfileDto = {
      fullName: values.fullName,
      phone: values.phone || null,
    };

    updateProfile.mutate(dto, {
      onSuccess: () => {
        showSuccess("Profile updated", {
          description: "Your profile has been updated successfully.",
        });
        onSuccess?.();
      },
      onError: () => {
        showError("Update failed", {
          description: "Failed to update your profile. Please try again.",
        });
      },
    });
  };

  return (
    <FormWrapper<ProfileFormValues>
      schema={profileSchemaCompat}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isSubmitting={updateProfile.isPending}
      renderActions={null}
    >
      {(form) => (
        <>
          <FormSection title="Personal Information">
            <FormGrid columns={1}>
              <TextField<ProfileFormValues>
                name="fullName"
                label="Full Name"
                placeholder="Your full name"
                required
              />
              <TextField<ProfileFormValues>
                name="phone"
                label="Phone Number"
                placeholder="+60 12-345 6789"
                type="tel"
              />
            </FormGrid>
          </FormSection>

          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={updateProfile.isPending}
            >
              Cancel
            </Button>
            <SaveButton
              saving={updateProfile.isPending}
              disabled={!form.formState.isDirty}
            />
          </FormActions>
        </>
      )}
    </FormWrapper>
  );
}
