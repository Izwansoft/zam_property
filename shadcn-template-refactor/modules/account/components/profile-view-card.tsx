// =============================================================================
// ProfileViewCard — Read-only display of customer profile
// =============================================================================

"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  PencilIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from "lucide-react";
import type { CustomerProfile } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProfileViewCardProps {
  profile: CustomerProfile;
  onEdit?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileViewCard({ profile, onEdit }: ProfileViewCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.fullName} />
            <AvatarFallback className="text-lg">
              {getInitials(profile.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="text-xl">{profile.fullName}</CardTitle>
            <div className="flex items-center gap-2">
              {profile.emailVerified ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2Icon className="h-3 w-3" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <XCircleIcon className="h-3 w-3" />
                  Unverified
                </Badge>
              )}
            </div>
          </div>
        </div>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
            <PencilIcon className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Email */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <MailIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground">Email</p>
              <p className="truncate font-medium">{profile.email}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <PhoneIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground">Phone</p>
              <p className="truncate font-medium">
                {profile.phone ?? "Not provided"}
              </p>
            </div>
          </div>

          {/* Created */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground">Member since</p>
              <p className="truncate font-medium">{formatDate(profile.createdAt)}</p>
            </div>
          </div>

          {/* Last updated */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground">Last updated</p>
              <p className="truncate font-medium">{formatDate(profile.updatedAt)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function ProfileViewCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <Skeleton className="h-9 w-28" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
