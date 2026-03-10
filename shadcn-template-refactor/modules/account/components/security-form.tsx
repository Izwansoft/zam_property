// =============================================================================
// SecurityForm — Password change and account deletion
// =============================================================================

"use client";

import { useState } from "react";
import { z } from "zod";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { FormWrapper } from "@/components/forms/form-wrapper";
import { PasswordField, TextAreaField } from "@/components/forms/form-fields";
import { FormSection, FormActions } from "@/components/forms/form-wrapper";
import { SaveButton } from "@/components/common/loading-button";
import type { ChangePasswordDto, DeleteAccountDto } from "../types";

// ---------------------------------------------------------------------------
// Change Password Schema
// ---------------------------------------------------------------------------

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Must include uppercase, lowercase, and number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const changePasswordSchemaCompat = changePasswordSchema as unknown as z.ZodType<
  z.infer<typeof changePasswordSchema>
>;

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SecurityFormProps {
  onChangePassword: (dto: ChangePasswordDto) => void;
  onDeleteAccount: (dto: DeleteAccountDto) => void;
  isChangingPassword: boolean;
  isDeletingAccount: boolean;
}

// ---------------------------------------------------------------------------
// Change Password section
// ---------------------------------------------------------------------------

function ChangePasswordSection({
  onSubmit,
  isLoading,
}: {
  onSubmit: (dto: ChangePasswordDto) => void;
  isLoading: boolean;
}) {
  const handleSubmit = (values: ChangePasswordFormValues) => {
    onSubmit({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormWrapper
          schema={changePasswordSchemaCompat as any}
          defaultValues={{
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }}
          onSubmit={handleSubmit}
        >
          {(form) => (
            <div className="space-y-4 max-w-md">
              <FormSection title="Password">
                <PasswordField
                  name="currentPassword"
                  label="Current Password"
                  required
                />
                <PasswordField
                  name="newPassword"
                  label="New Password"
                  required
                />
                <PasswordField
                  name="confirmPassword"
                  label="Confirm New Password"
                  required
                />
              </FormSection>
              <FormActions>
                <SaveButton saving={isLoading} disabled={!form.formState.isDirty}>
                  Change Password
                </SaveButton>
              </FormActions>
            </div>
          )}
        </FormWrapper>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Delete Account section
// ---------------------------------------------------------------------------

function DeleteAccountSection({
  onDelete,
  isLoading,
}: {
  onDelete: (dto: DeleteAccountDto) => void;
  isLoading: boolean;
}) {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Delete Account</CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete My Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to delete your account?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account, saved listings,
                inquiries, and all other data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="delete-password">
                  Enter your password to confirm
                </Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delete-reason">
                  Reason for leaving (optional)
                </Label>
                <Input
                  id="delete-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tell us why you're leaving"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={!password || isLoading}
                onClick={() =>
                  onDelete({
                    password,
                    reason: reason || undefined,
                  })
                }
              >
                {isLoading ? "Deleting..." : "Delete Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SecurityForm({
  onChangePassword,
  onDeleteAccount,
  isChangingPassword,
  isDeletingAccount,
}: SecurityFormProps) {
  return (
    <div className="space-y-6">
      <ChangePasswordSection
        onSubmit={onChangePassword}
        isLoading={isChangingPassword}
      />
      <DeleteAccountSection
        onDelete={onDeleteAccount}
        isLoading={isDeletingAccount}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function SecurityFormSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-full max-w-md" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>
    </div>
  );
}
