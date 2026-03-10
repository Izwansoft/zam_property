// =============================================================================
// Vendor Settings — Types
// =============================================================================

// ---------------------------------------------------------------------------
// Vendor Settings entity (GET /vendors/:id/settings)
// ---------------------------------------------------------------------------

export interface VendorSettings {
  id: string;
  vendorId: string;
  /** Business display name */
  businessName: string;
  /** Public description / bio */
  description: string;
  /** Primary contact email */
  contactEmail: string;
  /** Primary contact phone */
  contactPhone: string;
  /** Website URL */
  website?: string;
  /** Logo URL (read-only — upload via POST /vendors/:id/logo) */
  logoUrl?: string | null;
  /** Whether vendor profile is publicly visible */
  isPublicProfile: boolean;
  /** Whether contact info is shown on public profile */
  showContactInfo: boolean;
  /** Whether to show email on public profile */
  showEmail: boolean;
  /** Whether to show phone on public profile */
  showPhone: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Update DTO (PATCH /vendors/:id/settings)
// ---------------------------------------------------------------------------

export interface UpdateVendorSettingsDto {
  businessName?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  isPublicProfile?: boolean;
  showContactInfo?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
}

// ---------------------------------------------------------------------------
// Logo Upload Response (POST /vendors/:id/logo)
// ---------------------------------------------------------------------------

export interface VendorLogoResponse {
  logoUrl: string;
}
