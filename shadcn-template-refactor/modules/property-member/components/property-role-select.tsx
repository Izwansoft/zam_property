"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROPERTY_ROLES } from "@/types/backend-contracts";
import type { PropertyRole } from "@/types/backend-contracts";
import { PROPERTY_ROLE_CONFIG } from "../types";

interface PropertyRoleSelectProps {
  value?: PropertyRole;
  onValueChange: (value: PropertyRole) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Dropdown select for choosing a PropertyRole.
 * Shows role label + short description.
 *
 * @example
 * ```tsx
 * <PropertyRoleSelect
 *   value={selectedRole}
 *   onValueChange={setSelectedRole}
 * />
 * ```
 */
export function PropertyRoleSelect({
  value,
  onValueChange,
  placeholder = "Select role...",
  disabled = false,
  className,
}: PropertyRoleSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(val) => onValueChange(val as PropertyRole)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {PROPERTY_ROLES.map((role) => {
          const config = PROPERTY_ROLE_CONFIG[role];
          return (
            <SelectItem key={role} value={role}>
              <div className="flex flex-col">
                <span className="font-medium">{config.label}</span>
                <span className="text-xs text-muted-foreground">
                  {config.description}
                </span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
