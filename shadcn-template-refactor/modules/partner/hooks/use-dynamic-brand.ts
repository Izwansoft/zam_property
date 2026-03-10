"use client";

// =============================================================================
// useDynamicBrand — Hook for dynamic partner branding
// =============================================================================
// Returns branding data that merges partner-specific branding (from context/API)
// with static defaults. When a partner updates their logo in settings, all
// components using this hook will reflect the change.
// =============================================================================

import { useMemo, useContext } from "react";
import { usePathname } from "next/navigation";
import {
  PortalBrand,
  BrandContext,
  detectBrandFromPath,
  PLATFORM_BRAND,
  DEFAULT_PARTNER_BRAND,
} from "@/config/branding";
import { PartnerContext } from "../context/partner-context";
import { usePartnerDetail } from "./use-partner-detail";

export interface DynamicBrand extends PortalBrand {
  /** Whether this is using partner-specific branding (not defaults) */
  isCustomBranded: boolean;
  /** Whether branding is still loading */
  isLoading: boolean;
}

/**
 * Get dynamic branding that reflects partner settings.
 *
 * When in partner portal:
 *  - If partner has custom logos, they override defaults
 *  - Falls back to DEFAULT_PARTNER_BRAND otherwise
 *
 * When in platform portal:
 *  - Always returns PLATFORM_BRAND
 *
 * Usage:
 * ```tsx
 * const brand = useDynamicBrand();
 * <Image src={brand.logo.iconLight} alt={brand.logoAlt} />
 * ```
 */
export function useDynamicBrand(): DynamicBrand {
  const pathname = usePathname();
  const brandContext = detectBrandFromPath(pathname);
  const partnerContext = useContext(PartnerContext);

  // Get partner ID if in partner context
  const partnerId = brandContext === "partner" ? partnerContext?.partnerId : null;

  // Fetch partner detail (hook internally handles empty partnerId)
  const { data: partnerDetail, isLoading } = usePartnerDetail(partnerId ?? "");

  const brand = useMemo<DynamicBrand>(() => {
    // Platform portal — always use static platform brand
    if (brandContext === "platform") {
      return {
        ...PLATFORM_BRAND,
        isCustomBranded: false,
        isLoading: false,
      };
    }

    // Partner portal — merge partner branding with defaults
    const baseBrand = DEFAULT_PARTNER_BRAND;

    // No partner data yet (loading or no partner context)
    if (!partnerDetail?.logos) {
      return {
        ...baseBrand,
        isCustomBranded: false,
        isLoading: !!partnerId && isLoading,
      };
    }

    const partnerLogos = partnerDetail.logos;
    const hasCustomLogos = !!(
      partnerLogos.light ||
      partnerLogos.dark ||
      partnerLogos.iconLight ||
      partnerLogos.iconDark
    );

    // Merge partner logos with defaults (partner overrides if set)
    const mergedLogo = {
      light: partnerLogos.light || baseBrand.logo.light,
      dark: partnerLogos.dark || baseBrand.logo.dark,
      iconLight: partnerLogos.iconLight || baseBrand.logo.iconLight,
      iconDark: partnerLogos.iconDark || baseBrand.logo.iconDark,
    };

    // Use partner name if available
    const displayName = partnerDetail.name || baseBrand.name;
    const logoAlt = partnerDetail.name || baseBrand.logoAlt;

    return {
      ...baseBrand,
      name: displayName,
      logoAlt,
      logo: mergedLogo,
      isCustomBranded: hasCustomLogos,
      isLoading: false,
    };
  }, [brandContext, partnerDetail, isLoading, partnerId]);

  return brand;
}

/**
 * Get the brand icon for current theme.
 * Convenience hook when you only need the icon URL.
 */
export function useBrandIcon(): {
  lightIcon: string;
  darkIcon: string;
  isLoading: boolean;
} {
  const brand = useDynamicBrand();
  return {
    lightIcon: brand.logo.iconLight,
    darkIcon: brand.logo.iconDark,
    isLoading: brand.isLoading,
  };
}
