"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { useProfile } from "@/modules/account/hooks/use-profile";
import {
  ProfileViewCard,
  ProfileViewCardSkeleton,
} from "@/modules/account/components/profile-view-card";
import { ProfileEditForm } from "@/modules/account/components/profile-edit-form";

export function AgentProfileContent() {
  const [isEditing, setIsEditing] = useState(false);
  const { data: profile, isLoading, error } = useProfile();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Profile"
        description="View and manage your agent profile details."
        breadcrumbOverrides={[
          { segment: "agent", label: "Agent Portal" },
          { segment: "profile", label: "Profile" },
        ]}
      />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load profile. Please try again.
        </div>
      )}

      {isLoading && <ProfileViewCardSkeleton />}

      {profile && !isEditing && (
        <ProfileViewCard profile={profile} onEdit={() => setIsEditing(true)} />
      )}

      {profile && isEditing && (
        <ProfileEditForm
          profile={profile}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}
