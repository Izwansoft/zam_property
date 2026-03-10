"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminCreateUser } from "@/modules/admin/hooks/admin-users";
import { ROLE_LABELS } from "@/modules/admin/types/admin-users";
import { showError, showSuccess } from "@/lib/errors/toast-helpers";

type RoleValue =
  | "SUPER_ADMIN"
  | "PARTNER_ADMIN"
  | "VENDOR_ADMIN"
  | "VENDOR_STAFF"
  | "COMPANY_ADMIN"
  | "AGENT"
  | "CUSTOMER"
  | "TENANT";

const roleOptions: RoleValue[] = [
  "SUPER_ADMIN",
  "PARTNER_ADMIN",
  "VENDOR_ADMIN",
  "VENDOR_STAFF",
  "COMPANY_ADMIN",
  "AGENT",
  "CUSTOMER",
  "TENANT",
];

export function PlatformCreateUserContent() {
  const router = useRouter();
  const createUser = useAdminCreateUser();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<RoleValue>("PARTNER_ADMIN");
  const [status, setStatus] = React.useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const canSubmit =
    fullName.trim().length >= 2 &&
    email.includes("@") &&
    password.length >= 8;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      await createUser.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
        role,
        status,
      });

      showSuccess("User created", {
        description: `${fullName.trim()} has been created with ${ROLE_LABELS[role]}.`,
      });
      router.push("/dashboard/platform/users");
    } catch {
      showError("Failed to create user", {
        description: "Please review the form values and try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create User"
        description="Create a user and assign RBAC role in one flow."
        backHref="/dashboard/platform/users"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>
              Platform admins can create users across all partner contexts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="e.g. Aina Ibrahim"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="aina@lamaniaga.local"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+60123456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="text"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as RoleValue)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {ROLE_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as "ACTIVE" | "INACTIVE")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => router.push("/dashboard/platform/users")}>Cancel</Button>
              <Button disabled={!canSubmit || createUser.isPending} onClick={handleSubmit}>
                Create User
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RBAC Notes</CardTitle>
            <CardDescription>
              Role assignment controls cross-partner access boundaries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p><strong>SUPER_ADMIN</strong>: Full platform-wide permissions.</p>
            <p><strong>PARTNER_ADMIN</strong>: Partner-level admin rights only.</p>
            <p><strong>VENDOR_ADMIN / STAFF</strong>: Vendor operations scope.</p>
            <p><strong>COMPANY_ADMIN / AGENT</strong>: Company and listing workflows.</p>
            <p><strong>CUSTOMER / TENANT</strong>: End-user and tenancy features.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
