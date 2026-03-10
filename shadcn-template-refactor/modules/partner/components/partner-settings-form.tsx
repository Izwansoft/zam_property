// =============================================================================
// PartnerSettingsForm — Edit partner settings (company, branding, verticals)
// =============================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Building2, Palette, Globe, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { PageHeader } from "@/components/common/page-header";
import { ImageUploader } from "@/components/common/image-uploader";
import { showSuccess, showError } from "@/lib/errors/toast-helpers";

import type { 
  PartnerDetail, 
  PartnerSettingsDto,
  BrandingLogos,
  BrandingColors,
  CompanyDetails,
  CompanyAddress,
} from "../types";
import { useUpdatePartnerSettings } from "../hooks/use-partner-mutations";

// ---------------------------------------------------------------------------
// Available verticals
// ---------------------------------------------------------------------------

const AVAILABLE_VERTICALS = [
  { value: "PROPERTY_SALE", label: "Property Sale" },
  { value: "PROPERTY_RENTAL", label: "Property Rental" },
  { value: "COMMERCIAL_LEASE", label: "Commercial Lease" },
  { value: "NEW_LAUNCH", label: "New Launch" },
  { value: "AUCTION", label: "Auction" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PartnerSettingsFormProps {
  partner: PartnerDetail;
  basePath: string;
  /** Hide header (when rendered separately above tabs) */
  hideHeader?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartnerSettingsForm({
  partner,
  basePath,
  hideHeader = false,
}: PartnerSettingsFormProps) {
  const router = useRouter();
  const updateSettings = useUpdatePartnerSettings(partner.id);

  // Basic info state
  const [name, setName] = useState(partner.name);
  const [domain, setDomain] = useState(partner.domain ?? "");
  const [enabledVerticals, setEnabledVerticals] = useState<string[]>(
    partner.enabledVerticals
  );

  // Company details state
  const [companyLegalName, setCompanyLegalName] = useState(partner.company?.legalName ?? "");
  const [registrationNumber, setRegistrationNumber] = useState(partner.company?.registrationNumber ?? "");
  const [taxId, setTaxId] = useState(partner.company?.taxId ?? "");
  const [companyPhone, setCompanyPhone] = useState(partner.company?.phone ?? "");
  const [companyEmail, setCompanyEmail] = useState(partner.company?.email ?? "");
  const [companyWebsite, setCompanyWebsite] = useState(partner.company?.website ?? "");

  // Company address state
  const [street, setStreet] = useState(partner.company?.address?.street ?? "");
  const [city, setCity] = useState(partner.company?.address?.city ?? "");
  const [state, setState] = useState(partner.company?.address?.state ?? "");
  const [postalCode, setPostalCode] = useState(partner.company?.address?.postalCode ?? "");
  const [country, setCountry] = useState(partner.company?.address?.country ?? "");

  // Logo state
  const [logoLight, setLogoLight] = useState(partner.logos?.light ?? "");
  const [logoDark, setLogoDark] = useState(partner.logos?.dark ?? "");
  const [iconLight, setIconLight] = useState(partner.logos?.iconLight ?? "");
  const [iconDark, setIconDark] = useState(partner.logos?.iconDark ?? "");

  // Colors state
  const [primaryColor, setPrimaryColor] = useState(partner.colors?.primary ?? "");
  const [secondaryColor, setSecondaryColor] = useState(partner.colors?.secondary ?? "");

  const [isSaving, setIsSaving] = useState(false);

  const handleVerticalToggle = (vertical: string, checked: boolean) => {
    setEnabledVerticals((prev) =>
      checked ? [...prev, vertical] : prev.filter((v) => v !== vertical)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    setIsSaving(true);

    try {
      // Build company details
      const address: CompanyAddress = {
        ...(street && { street }),
        ...(city && { city }),
        ...(state && { state }),
        ...(postalCode && { postalCode }),
        ...(country && { country }),
      };

      const company: CompanyDetails = {
        ...(companyLegalName && { legalName: companyLegalName }),
        ...(registrationNumber && { registrationNumber }),
        ...(taxId && { taxId }),
        ...(companyPhone && { phone: companyPhone }),
        ...(companyEmail && { email: companyEmail }),
        ...(companyWebsite && { website: companyWebsite }),
        ...(Object.keys(address).length > 0 && { address }),
      };

      // Build logos
      const logos: BrandingLogos = {
        ...(logoLight && { light: logoLight }),
        ...(logoDark && { dark: logoDark }),
        ...(iconLight && { iconLight }),
        ...(iconDark && { iconDark }),
      };

      // Build colors
      const colors: BrandingColors = {
        ...(primaryColor && { primary: primaryColor }),
        ...(secondaryColor && { secondary: secondaryColor }),
      };

      const dto: PartnerSettingsDto = {
        name: name.trim(),
        domain: domain.trim() || null,
        enabledVerticals,
        ...(Object.keys(company).length > 0 && { company }),
        ...(Object.keys(logos).length > 0 && { logos }),
        ...(Object.keys(colors).length > 0 && { colors }),
      };

      await updateSettings.mutateAsync(dto);
      showSuccess("Partner settings updated successfully.");
      router.push(`${basePath}/${partner.id}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update settings";
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Check if any field changed
  const hasChanges =
    name !== partner.name ||
    domain !== (partner.domain ?? "") ||
    JSON.stringify(enabledVerticals.sort()) !==
      JSON.stringify([...partner.enabledVerticals].sort()) ||
    companyLegalName !== (partner.company?.legalName ?? "") ||
    registrationNumber !== (partner.company?.registrationNumber ?? "") ||
    taxId !== (partner.company?.taxId ?? "") ||
    companyPhone !== (partner.company?.phone ?? "") ||
    companyEmail !== (partner.company?.email ?? "") ||
    companyWebsite !== (partner.company?.website ?? "") ||
    street !== (partner.company?.address?.street ?? "") ||
    city !== (partner.company?.address?.city ?? "") ||
    state !== (partner.company?.address?.state ?? "") ||
    postalCode !== (partner.company?.address?.postalCode ?? "") ||
    country !== (partner.company?.address?.country ?? "") ||
    logoLight !== (partner.logos?.light ?? "") ||
    logoDark !== (partner.logos?.dark ?? "") ||
    iconLight !== (partner.logos?.iconLight ?? "") ||
    iconDark !== (partner.logos?.iconDark ?? "") ||
    primaryColor !== (partner.colors?.primary ?? "") ||
    secondaryColor !== (partner.colors?.secondary ?? "");

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <PageHeader
          title="Partner Settings"
          description={`Configure settings for ${partner.name}`}
          backHref={`${basePath}/${partner.id}`}
          breadcrumbOverrides={[
            { segment: partner.id, label: partner.name },
            { segment: "settings", label: "Settings" },
          ]}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Two-column layout for cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Basic Info
              </CardTitle>
              <CardDescription>Partner name and domain settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="partner-name">Partner Name *</Label>
                <Input
                  id="partner-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter partner name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partner-domain">Custom Domain</Label>
                <Input
                  id="partner-domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g., myrealty.zamproperty.com"
                />
                <p className="text-xs text-muted-foreground">
                  Optional custom domain for the partner portal
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Company Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Details
              </CardTitle>
              <CardDescription>Legal and registration information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-legal-name">Legal Name</Label>
                <Input
                  id="company-legal-name"
                  value={companyLegalName}
                  onChange={(e) => setCompanyLegalName(e.target.value)}
                  placeholder="e.g., Acme Realty Sdn Bhd"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="registration-number">Registration No.</Label>
                  <Input
                    id="registration-number"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g., 123456-A"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax-id">Tax ID</Label>
                  <Input
                    id="tax-id"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="e.g., TIN12345678"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-phone">Phone</Label>
                  <Input
                    id="company-phone"
                    type="tel"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="e.g., +60 3-1234 5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-email">Email</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="e.g., info@acmerealty.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-website">Website</Label>
                <Input
                  id="company-website"
                  type="url"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="e.g., https://acmerealty.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Company Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Address
              </CardTitle>
              <CardDescription>Business address information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g., 123 Main Street, Suite 456"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., Kuala Lumpur"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g., Selangor"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="postal-code">Postal Code</Label>
                  <Input
                    id="postal-code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g., 50000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g., Malaysia"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Logos
              </CardTitle>
              <CardDescription>Brand logos for different modes (uploaded to MinIO/S3)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageUploader
                label="Light Mode Logo"
                value={logoLight}
                onChange={setLogoLight}
                ownerType="PARTNER"
                ownerId={partner.id}
                helperText="Logo for light backgrounds (recommended: PNG with transparent background)"
                aspectRatio="auto"
                maxPreviewWidth={200}
              />

              <ImageUploader
                label="Dark Mode Logo"
                value={logoDark}
                onChange={setLogoDark}
                ownerType="PARTNER"
                ownerId={partner.id}
                helperText="Logo for dark backgrounds (recommended: PNG with transparent background)"
                aspectRatio="auto"
                maxPreviewWidth={200}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageUploader
                  label="Icon (Light Mode)"
                  value={iconLight}
                  onChange={setIconLight}
                  ownerType="PARTNER"
                  ownerId={partner.id}
                  helperText="Icon for light backgrounds"
                  aspectRatio="1/1"
                  maxPreviewWidth={80}
                />
                <ImageUploader
                  label="Icon (Dark Mode)"
                  value={iconDark}
                  onChange={setIconDark}
                  ownerType="PARTNER"
                  ownerId={partner.id}
                  helperText="Icon for dark backgrounds"
                  aspectRatio="1/1"
                  maxPreviewWidth={80}
                />
              </div>
            </CardContent>
          </Card>

          {/* Brand Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Brand Colors
              </CardTitle>
              <CardDescription>Primary and secondary brand colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                  <Input
                    type="color"
                    value={primaryColor || "#3B82F6"}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 p-1 h-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Main brand color (hex format)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#10B981"
                    className="flex-1"
                  />
                  <Input
                    type="color"
                    value={secondaryColor || "#10B981"}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-12 p-1 h-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Accent/secondary brand color (hex format)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Verticals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enabled Verticals</CardTitle>
              <CardDescription>Property types available for this partner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {AVAILABLE_VERTICALS.map((vertical) => (
                <div key={vertical.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`vertical-${vertical.value}`}
                    checked={enabledVerticals.includes(vertical.value)}
                    onCheckedChange={(checked) =>
                      handleVerticalToggle(vertical.value, !!checked)
                    }
                  />
                  <Label
                    htmlFor={`vertical-${vertical.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {vertical.label}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`${basePath}/${partner.id}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function PartnerSettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Company Details */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </CardContent>
        </Card>

        {/* Company Address */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </CardContent>
        </Card>

        {/* Logos */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Light Mode Logo */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-full max-w-50" />
              <Skeleton className="h-24 w-full max-w-50 rounded-lg" />
            </div>
            {/* Dark Mode Logo */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-full max-w-50" />
              <Skeleton className="h-24 w-full max-w-50 rounded-lg" />
            </div>
            {/* Icon/Favicon */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-full max-w-[100px]" />
              <Skeleton className="h-16 w-16 rounded-lg" />
            </div>
          </CardContent>
        </Card>

        {/* Brand Colors */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verticals */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

