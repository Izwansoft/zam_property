"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/modules/auth";
import { Role } from "@/modules/auth";
import { useProfile } from "./use-profile";
import {
  useVendorApplications,
  type VendorMyApplication,
} from "./use-vendor-applications";
import type { VendorVerticalItem } from "../types";

const VENDOR_HUB_STATUS_KEY = "zam_vendor_hub_status_v1";
const LEGACY_VENDOR_APPLICATION_STATUS_KEY = "zam_vendor_application_status";

const VERTICALS = [
  { key: "real_estate", label: "Real Estate", enabled: true },
  { key: "automotive", label: "Automotive", enabled: false },
  { key: "travel", label: "Travel", enabled: false },
] as const;

export function useVendorHub() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: applications } = useVendorApplications();
  const [storedStatus, setStoredStatus] = useState<string | null>(null);

  const applicationByVertical = useMemo(() => {
    const map = new Map<string, VendorMyApplication>();
    if (!applications) return map;

    applications.forEach((app) => {
      const raw = app.verticalType?.toLowerCase() ?? "";
      const normalized =
        raw === "property" || raw === "real_estate"
          ? "real_estate"
          : raw;
      if (!normalized) return;

      const existing = map.get(normalized);
      if (!existing || new Date(app.updatedAt) > new Date(existing.updatedAt)) {
        map.set(normalized, app);
      }
    });

    return map;
  }, [applications]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (user?.role === Role.VENDOR_ADMIN || user?.role === Role.VENDOR_STAFF) {
      window.localStorage.removeItem(VENDOR_HUB_STATUS_KEY);
      window.localStorage.removeItem(LEGACY_VENDOR_APPLICATION_STATUS_KEY);
      setStoredStatus(null);
      return;
    }

    const raw = window.localStorage.getItem(VENDOR_HUB_STATUS_KEY);
    const legacy = window.localStorage.getItem(LEGACY_VENDOR_APPLICATION_STATUS_KEY);

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<string, { status?: string }>;
        setStoredStatus(parsed.real_estate?.status ?? null);
        return;
      } catch {
        // Ignore malformed local data and continue with legacy fallback.
      }
    }

    setStoredStatus(legacy);
  }, [user?.role]);

  const items = useMemo<VendorVerticalItem[]>(() => {
    return VERTICALS.map((vertical) => {
      if (!vertical.enabled) {
        return {
          verticalKey: vertical.key,
          verticalLabel: vertical.label,
          status: "NOT_STARTED",
          enabled: false,
        };
      }

      const serverApp = applicationByVertical.get(vertical.key);
      if (serverApp) {
        const mappedStatus =
          serverApp.status === "PENDING"
            ? "PENDING"
            : serverApp.status === "APPROVED"
              ? "APPROVED"
              : "REJECTED";

        return {
          verticalKey: vertical.key,
          verticalLabel: vertical.label,
          status: mappedStatus,
          applicationId: serverApp.vendorId,
          lastUpdatedAt: serverApp.updatedAt,
          rejectionReason: serverApp.rejectionReason ?? undefined,
          portalAccess: serverApp.status === "APPROVED",
          enabled: true,
        };
      }

      const isVendorRole =
        user?.role === Role.VENDOR_ADMIN || user?.role === Role.VENDOR_STAFF;

      if (isVendorRole || !!user?.primaryVendorId) {
        return {
          verticalKey: vertical.key,
          verticalLabel: vertical.label,
          status: "APPROVED",
          portalAccess: true,
          enabled: true,
        };
      }

      if (storedStatus === "PENDING") {
        return {
          verticalKey: vertical.key,
          verticalLabel: vertical.label,
          status: "PENDING",
          enabled: true,
        };
      }

      return {
        verticalKey: vertical.key,
        verticalLabel: vertical.label,
        status: "NOT_STARTED",
        enabled: true,
      };
    });
  }, [
    storedStatus,
    user?.role,
    user?.primaryVendorId,
    profile?.updatedAt,
    applicationByVertical,
  ]);

  return { items };
}
