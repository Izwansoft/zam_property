// =============================================================================
// Security — Client content component (password change, account deletion)
// =============================================================================

"use client";

import { PageHeader } from "@/components/common/page-header";
import {
  useChangePassword,
  useDeleteAccount,
} from "@/modules/account/hooks/use-security";
import { SecurityForm } from "@/modules/account/components/security-form";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import type { ChangePasswordDto, DeleteAccountDto } from "@/modules/account/types";

export function SecurityContent() {
  const changePasswordMutation = useChangePassword();
  const deleteAccountMutation = useDeleteAccount();
  const { logout } = useAuth();

  const handleChangePassword = (dto: ChangePasswordDto) => {
    changePasswordMutation.mutate(dto, {
      onSuccess: () => {
        showSuccess("Password changed successfully.");
      },
      onError: (error) => {
        showError(error.message || "Failed to change password.");
      },
    });
  };

  const handleDeleteAccount = (dto: DeleteAccountDto) => {
    deleteAccountMutation.mutate(dto, {
      onSuccess: () => {
        showSuccess("Account deleted. You will be logged out.");
        setTimeout(() => logout(), 2000);
      },
      onError: (error) => {
        showError(error.message || "Failed to delete account.");
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security"
        description="Manage your password and account security."
        breadcrumbOverrides={[
          { segment: "account", label: "My Account" },
          { segment: "security", label: "Security" },
        ]}
      />

      <SecurityForm
        onChangePassword={handleChangePassword}
        onDeleteAccount={handleDeleteAccount}
        isChangingPassword={changePasswordMutation.isPending}
        isDeletingAccount={deleteAccountMutation.isPending}
      />
    </div>
  );
}
