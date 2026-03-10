// =============================================================================
// Portal Branding Configuration
// =============================================================================
// Centralised brand definitions for each portal type.
// Platform (ZAZ Digital) = system owner – never changes.
// Partner brands can be API-driven in the future via partner settings.
// =============================================================================

export interface PortalBrand {
  /** Display name shown in sidebar & auth pages */
  name: string;
  /** Short tagline / subtitle */
  tagline: string;
  /** Logo images (light / dark variants) */
  logo: {
    /** Full logo for auth pages (wide) */
    light: string;
    dark: string;
    /** Square icon for sidebar collapsed state */
    iconLight: string;
    iconDark: string;
  };
  /** Logo dimensions (auth page full logo) */
  logoDimensions: { width: number; height: number };
  /** Icon dimensions (sidebar) */
  iconDimensions: { width: number; height: number };
  /** Alt text for logos */
  logoAlt: string;
  /** Decorative hero image for auth pages (Unsplash) */
  heroImage: string;
  /** Login page heading */
  loginHeading: string;
  /** Login page sub-heading */
  loginSubheading: string;
  /** Register page heading */
  registerHeading: string;
  /** Register page sub-heading */
  registerSubheading: string;
  /** Forgot-password heading */
  forgotHeading: string;
  /** Forgot-password sub-heading */
  forgotSubheading: string;
  /** Base path for auth routes (e.g. "/admin" or "") */
  authBasePath: string;
  /** Suggested production domain */
  domain: string;
}

// ---------------------------------------------------------------------------
// Platform brand — ZAZ Digital (system owner / super admin)
// ---------------------------------------------------------------------------

export const PLATFORM_BRAND: PortalBrand = {
  name: "ZAZ Digital",
  tagline: "Platform Administration",
  logo: {
    light: "/images/brand/zaz-logo-light.svg",
    dark: "/images/brand/zaz-logo-dark.svg",
    iconLight: "/images/brand/zaz-icon-light.svg",
    iconDark: "/images/brand/zaz-icon-dark.svg",
  },
  logoDimensions: { width: 200, height: 50 },
  iconDimensions: { width: 36, height: 36 },
  logoAlt: "ZAZ Digital",
  heroImage:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80",
  loginHeading: "Admin Portal",
  loginSubheading: "Sign in to the ZAZ Digital administration console",
  registerHeading: "Admin Registration",
  registerSubheading: "Create a new administrator account",
  forgotHeading: "Reset Password",
  forgotSubheading: "Enter your admin email to receive a reset link",
  authBasePath: "/admin",
  domain: "admin.zamdigital.com",
};

// ---------------------------------------------------------------------------
// Default partner brand — ZAZ Digital (can be overridden per partner later)
// ---------------------------------------------------------------------------

export const DEFAULT_PARTNER_BRAND: PortalBrand = {
  name: "ZAZ Digital",
  tagline: "Property Marketplace",
  logo: {
    light: "/images/brand/zaz-logo-light.svg",
    dark: "/images/brand/zaz-logo-dark.svg",
    iconLight: "/images/brand/zaz-icon-light.svg",
    iconDark: "/images/brand/zaz-icon-dark.svg",
  },
  logoDimensions: { width: 200, height: 50 },
  iconDimensions: { width: 36, height: 36 },
  logoAlt: "ZAZ Digital",
  heroImage:
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80",
  loginHeading: "Welcome back",
  loginSubheading: "Sign in to your account",
  registerHeading: "Create New Account",
  registerSubheading: "Join ZAZ Digital to get started",
  forgotHeading: "Forgot password?",
  forgotSubheading: "Enter your email to receive a reset link",
  authBasePath: "",
  domain: "app.zazdigital.com",
};

// ---------------------------------------------------------------------------
// Brand resolver — determines brand from portal type or pathname
// ---------------------------------------------------------------------------

export type BrandContext = "platform" | "partner";

/**
 * Get the brand config for a given context.
 * In the future, `partner` context can fetch partner-specific branding from API.
 */
export function getBrand(context: BrandContext): PortalBrand {
  switch (context) {
    case "platform":
      return PLATFORM_BRAND;
    case "partner":
    default:
      return DEFAULT_PARTNER_BRAND;
  }
}

/**
 * Detect brand context from a URL pathname.
 *  - `/admin/*` or `/dashboard/platform/*`  → platform
 *  - Everything else                         → partner
 */
export function detectBrandFromPath(pathname: string): BrandContext {
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard/platform")
  ) {
    return "platform";
  }
  return "partner";
}
