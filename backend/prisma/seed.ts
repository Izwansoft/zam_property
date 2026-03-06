import { Prisma, PrismaClient, VendorType, InteractionStatus, ReviewStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Unsplash image helpers (free, no-auth, deterministic)
// ─────────────────────────────────────────────────────────────────────────────
const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1575517111478-7f6afd0973db?w=800&h=600&fit=crop',
];

const thumb = (url: string) => url.replace('w=800&h=600', 'w=200&h=150');
const pickImg = (idx: number) => PROPERTY_IMAGES[idx % PROPERTY_IMAGES.length];

async function main(): Promise<void> {
  console.log('🌱 Starting comprehensive seed…');

  const now = new Date();
  const demoPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. PARTNER
  // ═══════════════════════════════════════════════════════════════════════════
  const partner = await prisma.partner.upsert({
    where: { slug: 'lamaniaga' },
    update: {},
    create: {
      name: 'Laman Niaga',
      slug: 'lamaniaga',
      status: 'ACTIVE',
      enabledVerticals: ['real_estate'],
      branding: { primaryColor: '#0066cc', logoUrl: null },
      settings: {
        create: {
          locale: 'en',
          currency: 'MYR',
          timezone: 'Asia/Kuala_Lumpur',
          features: { reviewsEnabled: true, bookingsEnabled: false },
        },
      },
      domains: {
        create: { domain: 'lamaniaga.localhost', isPrimary: true, verified: true },
      },
    },
    include: { settings: true, domains: true },
  });
  console.log(`✅ Partner: ${partner.name} (${partner.slug})`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. VERTICAL DEFINITION
  // ═══════════════════════════════════════════════════════════════════════════
  const vertDef = await prisma.verticalDefinition.upsert({
    where: { type: 'real_estate' },
    update: { isActive: true },
    create: {
      type: 'real_estate',
      name: 'Real Estate',
      description: 'Property listings including residential, commercial, and land',
      icon: 'home',
      color: '#3B82F6',
      schemaVersion: '1.0',
      isActive: true,
      isCore: true,
      attributeSchema: { version: '1.0', fields: [] },
      validationRules: { version: '1.0', rules: [] },
      searchMapping: { version: '1.0', properties: {} },
      displayMetadata: { version: '1.0' },
    },
    select: { id: true },
  });

  await prisma.partnerVertical.upsert({
    where: { partnerId_verticalId: { partnerId: partner.id, verticalId: vertDef.id } },
    update: { isEnabled: true, disabledAt: null },
    create: { partnerId: partner.id, verticalId: vertDef.id, isEnabled: true },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. USERS (admin, super-admin, customer, tenant)
  // ═══════════════════════════════════════════════════════════════════════════
  const user = await prisma.user.upsert({
    where: { partnerId_email: { partnerId: partner.id, email: 'admin@lamaniaga.local' } },
    update: { fullName: 'Laman Niaga Admin', phone: '+60123456789', role: 'PARTNER_ADMIN', status: 'ACTIVE', isSystem: true },
    create: { partnerId: partner.id, email: 'admin@lamaniaga.local', passwordHash, fullName: 'Laman Niaga Admin', phone: '+60123456789', role: 'PARTNER_ADMIN', status: 'ACTIVE', isSystem: true },
    select: { id: true, email: true, role: true },
  });
  console.log(`✅ Partner Admin: ${user.email}`);

  const superAdmin = await prisma.user.upsert({
    where: { partnerId_email: { partnerId: partner.id, email: 'superadmin@lamaniaga.local' } },
    update: { fullName: 'Super Admin', phone: '+60100000000', role: 'SUPER_ADMIN', status: 'ACTIVE', isSystem: true },
    create: { partnerId: partner.id, email: 'superadmin@lamaniaga.local', passwordHash, fullName: 'Super Admin', phone: '+60100000000', role: 'SUPER_ADMIN', status: 'ACTIVE', isSystem: true },
    select: { id: true, email: true, role: true },
  });
  console.log(`✅ Super Admin: ${superAdmin.email}`);

  const customer = await prisma.user.upsert({
    where: { partnerId_email: { partnerId: partner.id, email: 'customer@lamaniaga.local' } },
    update: { fullName: 'John Customer', phone: '+60199999999', role: 'CUSTOMER', status: 'ACTIVE' },
    create: { partnerId: partner.id, email: 'customer@lamaniaga.local', passwordHash, fullName: 'John Customer', phone: '+60199999999', role: 'CUSTOMER', status: 'ACTIVE' },
    select: { id: true, email: true, role: true },
  });
  console.log(`✅ Customer: ${customer.email}`);

  const tenantUser = await prisma.user.upsert({
    where: { partnerId_email: { partnerId: partner.id, email: 'tenant@lamaniaga.local' } },
    update: { fullName: 'Jane Tenant', phone: '+60188888888', role: 'TENANT', status: 'ACTIVE' },
    create: { partnerId: partner.id, email: 'tenant@lamaniaga.local', passwordHash, fullName: 'Jane Tenant', phone: '+60188888888', role: 'TENANT', status: 'ACTIVE' },
    select: { id: true, email: true, role: true },
  });
  console.log(`✅ Tenant: ${tenantUser.email}`);
  console.log(`   All passwords: ${demoPassword}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. VENDORS (5 vendors — realistic Malaysian agencies)
  // ═══════════════════════════════════════════════════════════════════════════
  const vendorDefs = [
    {
      slug: 'sunrise-properties',
      name: 'Sunrise Properties',
      email: 'sunrise@lamaniaga.local',
      phone: '+60123456789',
      website: 'https://sunriseproperties.com.my',
      city: 'Kuala Lumpur',
      state: 'WP Kuala Lumpur',
      vendorType: VendorType.COMPANY,
    },
    {
      slug: 'elite-realty-group',
      name: 'Elite Realty Group',
      email: 'elite@lamaniaga.local',
      phone: '+60129876543',
      website: 'https://eliterealty.com.my',
      city: 'Petaling Jaya',
      state: 'Selangor',
      vendorType: VendorType.COMPANY,
    },
    {
      slug: 'premium-living',
      name: 'Premium Living Sdn Bhd',
      email: 'premium@lamaniaga.local',
      phone: '+60323456789',
      website: 'https://premiumliving.com.my',
      city: 'Kuala Lumpur',
      state: 'WP Kuala Lumpur',
      vendorType: VendorType.COMPANY,
    },
    {
      slug: 'budget-homes-pj',
      name: 'Budget Homes PJ',
      email: 'budget@lamaniaga.local',
      phone: '+60127654321',
      website: 'https://budgethomespj.com.my',
      city: 'Petaling Jaya',
      state: 'Selangor',
      vendorType: VendorType.INDIVIDUAL,
    },
    {
      slug: 'urban-nest',
      name: 'Urban Nest Realty',
      email: 'urbannest@lamaniaga.local',
      phone: '+60122222222',
      website: 'https://urbannest.com.my',
      city: 'Shah Alam',
      state: 'Selangor',
      vendorType: VendorType.COMPANY,
    },
  ];

  const vendorRecords: Record<string, { id: string; slug: string; name: string }> = {};

  for (const vd of vendorDefs) {
    const vendor = await prisma.vendor.upsert({
      where: { partnerId_slug: { partnerId: partner.id, slug: vd.slug } },
      update: {
        name: vd.name,
        email: vd.email,
        phone: vd.phone,
        website: vd.website,
        vendorType: vd.vendorType,
        status: 'APPROVED',
        approvedAt: now,
        verifiedAt: now,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
        deletedAt: null,
      },
      create: {
        partnerId: partner.id,
        name: vd.name,
        slug: vd.slug,
        email: vd.email,
        phone: vd.phone,
        website: vd.website,
        vendorType: vd.vendorType,
        status: 'APPROVED',
        approvedAt: now,
        verifiedAt: now,
        profile: {
          create: {
            city: vd.city,
            state: vd.state,
            country: 'MY',
            logoUrl: `https://i.pravatar.cc/80?u=${vd.slug}`,
            bannerUrl: pickImg(vendorDefs.indexOf(vd)),
            socialLinks: { website: vd.website, facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
          },
        },
        settings: {
          create: { emailNotifications: true, leadNotifications: true, showEmail: true, showPhone: true },
        },
      },
      select: { id: true, slug: true, name: true },
    });

    vendorRecords[vd.slug] = vendor;

    // Vendor admin user
    await prisma.user.upsert({
      where: { partnerId_email: { partnerId: partner.id, email: `admin+${vd.slug}@lamaniaga.local` } },
      update: { fullName: `${vd.name} Admin`, role: 'VENDOR_ADMIN', status: 'ACTIVE', vendorId: vendor.id, phone: vd.phone, deletedAt: null },
      create: { partnerId: partner.id, email: `admin+${vd.slug}@lamaniaga.local`, passwordHash, fullName: `${vd.name} Admin`, phone: vd.phone, role: 'VENDOR_ADMIN', status: 'ACTIVE', vendorId: vendor.id },
    });

    console.log(`✅ Vendor: ${vendor.name} (${vendor.slug})`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. LISTINGS — 20+ PUBLISHED + lifecycle statuses
  // ═══════════════════════════════════════════════════════════════════════════
  interface ListingTemplate {
    slug: string;
    title: string;
    description: string;
    vendorSlug: string;
    city: string;
    state: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
    price: string;
    isFeatured: boolean;
    status?: 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED';
    attributes: Prisma.InputJsonValue;
    imageIdx: number;
    /** If true, seed will add video + floor plan media for this listing */
    fullMedia?: boolean;
    priceType?: string;
  }

  const listingTemplates: ListingTemplate[] = [
    // ── Sunrise Properties (5 published) ──
    {
      slug: 'modern-condo-bukit-bintang',
      title: 'Modern Condo in Bukit Bintang',
      description: 'Beautiful modern condominium located in the heart of Bukit Bintang, Kuala Lumpur. This fully furnished unit features a spacious living area, modern kitchen, and stunning city views. Walking distance to Pavilion KL, public transport, and dining options.\n\nKey Highlights:\n\u2022 Floor-to-ceiling windows with panoramic city views\n\u2022 Premium imported marble flooring throughout\n\u2022 Open-concept kitchen with Smeg appliances\n\u2022 Master bedroom with walk-in wardrobe and rain shower\n\u2022 Smart home system with app-controlled lighting & AC\n\nFacilities include infinity pool, gymnasium, sauna, sky lounge, BBQ deck, children\'s playground, and 24-hour concierge service.',
      vendorSlug: 'sunrise-properties',
      city: 'Kuala Lumpur', state: 'WP Kuala Lumpur', postalCode: '55100',
      lat: 3.1488, lng: 101.7137,
      price: '780000.00', isFeatured: true, fullMedia: true,
      attributes: { propertyType: 'condominium', listingType: 'sale', bedrooms: 3, bathrooms: 2, builtUpSize: 1200, furnishing: 'fully_furnished', carParks: 2, tenure: 'Leasehold', yearBuilt: 2020, facing: 'East', condition: 'Excellent', totalFloors: 32, floorLevel: '18', titleType: 'Strata', maintenanceFee: 380, projectName: 'Pavilion Residences' },
      imageIdx: 0,
    },
    {
      slug: 'spacious-condo-klcc-view',
      title: 'Spacious Condo with KLCC View',
      description: 'High-floor unit with breathtaking KLCC skyline view. Fully furnished with premium finishes, swimming pool, gym, and 24-hour security. Walking distance to Suria KLCC and KLCC park.\n\nThis iconic address offers unparalleled urban living with direct sky-bridge access to KLCC. The unit features Italian marble flooring, Miele kitchen appliances, and Hansgrohe bathroom fittings. Floor-to-ceiling windows flood every room with natural light.\n\nResidents enjoy world-class facilities: 50m infinity pool, state-of-the-art gym, yoga room, residents\' lounge, private cinema, and dedicated concierge service.',
      vendorSlug: 'sunrise-properties',
      city: 'Kuala Lumpur', state: 'WP Kuala Lumpur', postalCode: '50088',
      lat: 3.1577, lng: 101.7119,
      price: '850000.00', isFeatured: true, fullMedia: true,
      attributes: { propertyType: 'condominium', listingType: 'sale', bedrooms: 3, bathrooms: 2, builtUpSize: 1200, furnishing: 'fully_furnished', carParks: 2, tenure: 'Freehold', yearBuilt: 2019, facing: 'North', condition: 'Excellent', totalFloors: 48, floorLevel: '36', titleType: 'Strata', maintenanceFee: 420, projectName: 'The Binjai on the Park' },
      imageIdx: 1,
    },
    {
      slug: 'family-semi-d-bangsar-south',
      title: 'Family Semi-D in Bangsar South',
      description: 'Spacious semi-detached house in Bangsar South with large garden and carport. Gated community with 24-hour security. Near international schools, shopping malls, and LRT station.\n\nThis beautifully maintained family home offers generous spaces across 3 levels. The ground floor features an open-plan living/dining area that leads to a private garden ideal for entertaining. A separate dry and wet kitchen with top-of-the-line appliances caters to all culinary needs.\n\nUpstairs, 4 bedrooms each have en-suite bathrooms. The master suite includes a spacious dressing room and a balcony overlooking the garden. The top floor houses a family room, maid\'s quarters, and a rooftop terrace.',
      vendorSlug: 'sunrise-properties',
      city: 'Kuala Lumpur', state: 'WP Kuala Lumpur', postalCode: '59200',
      lat: 3.1101, lng: 101.6641,
      price: '1800000.00', isFeatured: false, fullMedia: true,
      attributes: { propertyType: 'semi-detached', listingType: 'sale', bedrooms: 4, bathrooms: 3, builtUpSize: 2800, landSize: 5000, furnishing: 'partially_furnished', carParks: 3, tenure: 'Freehold', yearBuilt: 2018, facing: 'South', condition: 'Good', titleType: 'Individual' },
      imageIdx: 4,
    },
    {
      slug: 'studio-apartment-mont-kiara',
      title: 'Studio Apartment in Mont Kiara',
      description: 'Cozy studio apartment in Mont Kiara with full facilities including pool, gym, and sauna. Fully furnished, great investment opportunity. Near international schools and embassies.\n\nThis compact yet efficiently designed studio maximises every square foot. The sleeping area is separated by a sliding partition, while the living space can double as a home office. A full-size kitchen with washer/dryer combo makes this unit completely self-contained.\n\nMont Kiara is one of KL\'s most sought-after expatriate neighbourhoods, with easy access to international schools (ISKL, Garden International), shopping centres, and the MRR2.',
      vendorSlug: 'sunrise-properties',
      city: 'Kuala Lumpur', state: 'WP Kuala Lumpur', postalCode: '50480',
      lat: 3.1728, lng: 101.6497,
      price: '1800.00', isFeatured: true, fullMedia: true, priceType: 'monthly',
      attributes: { propertyType: 'apartment', listingType: 'rent', bedrooms: 1, bathrooms: 1, builtUpSize: 550, furnishing: 'fully_furnished', carParks: 1, tenure: 'Leasehold', yearBuilt: 2017, facing: 'West', condition: 'Good', totalFloors: 25, floorLevel: '12', titleType: 'Strata', maintenanceFee: 280, rentalDeposit: '2 months', minimumRentalPeriod: '12 months' },
      imageIdx: 10,
    },
    {
      slug: 'premium-condo-pavilion-kl',
      title: 'Premium Condo near Pavilion KL',
      description: 'Luxury condominium walking distance to Pavilion KL. Premium finishes throughout, infinity pool on rooftop with city panorama. Full concierge service.\n\nThis exquisite unit epitomises urban luxury living. Designed by award-winning interior firm, every detail has been meticulously crafted \u2014 from the herringbone oak flooring to the custom Poliform cabinetry and Gaggenau appliances.\n\nBuilding Facilities:\n\u2022 Rooftop infinity pool with cabanas\n\u2022 Sky gym & yoga studio on level 52\n\u2022 Tennis court & putting green\n\u2022 Residents\' wine cellar & private dining room\n\u2022 Dedicated Grab/taxi pickup lobby\n\u2022 EV charging stations',
      vendorSlug: 'sunrise-properties',
      city: 'Kuala Lumpur', state: 'WP Kuala Lumpur', postalCode: '55100',
      lat: 3.1490, lng: 101.7131,
      price: '1100000.00', isFeatured: true, fullMedia: true,
      attributes: { propertyType: 'condominium', listingType: 'sale', bedrooms: 3, bathrooms: 2, builtUpSize: 1400, furnishing: 'fully_furnished', carParks: 2, tenure: 'Freehold', yearBuilt: 2022, facing: 'North-East', condition: 'Brand New', totalFloors: 55, floorLevel: '42', titleType: 'Strata', maintenanceFee: 520, projectName: 'YTL Residences Pavilion', developerName: 'YTL Corporation' },
      imageIdx: 2,
    },
    // ── Elite Realty Group (4 published) ──
    {
      slug: 'spacious-semi-d-bangsar',
      title: 'Spacious Semi-D in Bangsar',
      description: 'Spacious semi-detached house in Bangsar with large garden and private pool. Perfect for families looking for a premium address in KL. Renovated with modern finishes.\n\nThis extensively renovated home combines classic Bangsar charm with contemporary design. The open-plan ground floor flows seamlessly from living to dining to a gourmet wet-and-dry kitchen. A separate home office and guest suite complete the ground level.\n\nThe lush tropical garden surrounds a heated infinity lap pool with a gazebo \u2014 a private oasis in the heart of the city. Solar panels and rainwater harvesting make this an eco-conscious choice.',
      vendorSlug: 'elite-realty-group',
      city: 'Kuala Lumpur', state: 'WP Kuala Lumpur', postalCode: '59000',
      lat: 3.1299, lng: 101.6693,
      price: '2500000.00', isFeatured: false, fullMedia: true,
      attributes: { propertyType: 'semi-detached', listingType: 'sale', bedrooms: 5, bathrooms: 4, builtUpSize: 3500, landSize: 5000, furnishing: 'partially_furnished', carParks: 4, tenure: 'Freehold', yearBuilt: 2015, facing: 'South-West', condition: 'Renovated', titleType: 'Individual' },
      imageIdx: 2,
    },
    {
      slug: 'modern-apartment-mont-kiara',
      title: 'Modern Apartment in Mont Kiara',
      description: 'Contemporary apartment in the heart of Mont Kiara. Open-plan living with floor-to-ceiling windows. Resort-style facilities with tennis court, Olympic-length pool, and children playground.\n\nThe unit features a minimalist Scandinavian interior with warm timber accents. The open kitchen is fitted with Fisher & Paykel appliances and a breakfast island. Both bedrooms have en-suite bathrooms with rain showers.\n\nMont Kiara is one of Malaysia\'s most established international neighbourhoods, home to multiple embassies and top international schools.',
      vendorSlug: 'elite-realty-group',
      city: 'Kuala Lumpur', state: 'WP Kuala Lumpur', postalCode: '50480',
      lat: 3.1711, lng: 101.6519,
      price: '2800.00', isFeatured: false, fullMedia: true, priceType: 'monthly',
      attributes: { propertyType: 'apartment', listingType: 'rent', bedrooms: 2, bathrooms: 2, builtUpSize: 900, furnishing: 'partially_furnished', carParks: 1, tenure: 'Leasehold', yearBuilt: 2016, facing: 'East', condition: 'Good', totalFloors: 30, floorLevel: '15', titleType: 'Strata', maintenanceFee: 340, rentalDeposit: '2 months', minimumRentalPeriod: '12 months' },
      imageIdx: 1,
    },
    {
      slug: 'renovated-terrace-subang',
      title: 'Newly Renovated Terrace in Subang',
      description: 'Beautifully renovated double-storey terrace in Subang Jaya. New wiring, plumbing, and roof. Modern minimalist interior. Near BRT, schools, and SS15 food street.\n\nThis turn-key home has been completely gutted and rebuilt with modern materials while preserving the generous proportions of 1990s terraces. The ground floor features polished concrete flooring, a designer kitchen with quartz countertops, and a separate laundry/utility room.\n\nAll three bedrooms upstairs have built-in wardrobes and air-conditioning. The master bedroom has a renovated bathroom with frameless glass shower.',
      vendorSlug: 'elite-realty-group',
      city: 'Subang Jaya', state: 'Selangor', postalCode: '47500',
      lat: 3.0565, lng: 101.5850,
      price: '680000.00', isFeatured: false,
      attributes: { propertyType: 'terrace', listingType: 'sale', bedrooms: 3, bathrooms: 2, builtUpSize: 1800, furnishing: 'unfurnished', carParks: 2, tenure: 'Freehold', yearBuilt: 1990, condition: 'Renovated', titleType: 'Individual' },
      imageIdx: 6,
    },
    {
      slug: 'corner-lot-terrace-kepong',
      title: 'Corner Lot Terrace in Kepong',
      description: 'Spacious corner lot terrace house in Kepong with extra land. Strategic location near Kepong Metropolitan Park. Easy access to Duke Highway and MRT.\n\nCorner lot advantage gives this property 40% more land than standard units. The extended backyard can accommodate a private garden, additional parking, or future extension. Original layout has been retained in good condition with new paint and polish throughout.',
      vendorSlug: 'elite-realty-group',
      city: 'Kepong', state: 'Kuala Lumpur', postalCode: '52100',
      lat: 3.2068, lng: 101.6355,
      price: '520000.00', isFeatured: false,
      attributes: { propertyType: 'terrace', listingType: 'sale', bedrooms: 4, bathrooms: 3, builtUpSize: 2200, furnishing: 'unfurnished', carParks: 3, tenure: 'Leasehold', condition: 'Good', titleType: 'Individual' },
      imageIdx: 3,
    },
    // ── Premium Living (3 published) ──
    {
      slug: 'luxury-bungalow-damansara-heights',
      title: 'Luxury Bungalow with Pool in Damansara Heights',
      description: 'Stunning luxury bungalow in the prestigious Damansara Heights enclave. This sprawling property features a private infinity pool, landscaped gardens, smart home automation, home cinema, and wine cellar. Perfect for discerning buyers seeking the ultimate in urban luxury living.\n\nDesigned by award-winning architect firm GDP, this architectural masterpiece spans 3 levels with soaring double-height ceilings in the living hall. Every bedroom enjoys garden or pool views. The gourmet kitchen features a La Cornue range, Sub-Zero fridge, and a butler\'s pantry.\n\nOutdoor amenities include a salt-water infinity pool, pool house with outdoor shower, a mature landscaped garden with water features, and a covered BBQ pavilion that seats 20.',
      vendorSlug: 'premium-living',
      city: 'Kuala Lumpur', state: 'WP Kuala Lumpur', postalCode: '50490',
      lat: 3.1490, lng: 101.6560,
      price: '3500000.00', isFeatured: true, fullMedia: true,
      attributes: { propertyType: 'bungalow', listingType: 'sale', bedrooms: 5, bathrooms: 4, builtUpSize: 4500, landSize: 8000, furnishing: 'fully_furnished', carParks: 4, tenure: 'Freehold', yearBuilt: 2021, facing: 'North', condition: 'Brand New', titleType: 'Individual', developerName: 'GDP Architects' },
      imageIdx: 5,
    },
    {
      slug: 'penthouse-panoramic-view',
      title: 'Penthouse Suite with Panoramic View',
      description: 'Ultra-premium penthouse suite with 360-degree panoramic views of KL skyline. Duplex layout with private terrace, jacuzzi, and dedicated lift lobby. Top-of-the-line finishes.\n\nThis crown jewel of the development occupies the entire top two floors. The lower level features an entertainment wing with home cinema, bar area, and a formal dining room for 12. The upper level houses 4 en-suite bedrooms, a private gym, and a wraparound terrace.\n\nA private plunge pool on the terrace is temperature-controlled and illuminated for night swimming. Dedicated pantry and maid\'s quarters ensure effortless hosting.',
      vendorSlug: 'premium-living',
      city: 'Kuala Lumpur', state: 'WP Kuala Lumpur', postalCode: '50450',
      lat: 3.1525, lng: 101.7085,
      price: '2200000.00', isFeatured: true, fullMedia: true,
      attributes: { propertyType: 'penthouse', listingType: 'sale', bedrooms: 4, bathrooms: 3, builtUpSize: 3200, furnishing: 'fully_furnished', carParks: 3, tenure: 'Freehold', yearBuilt: 2023, facing: 'North-East', condition: 'Brand New', totalFloors: 60, floorLevel: '59-60', titleType: 'Strata', maintenanceFee: 1200, projectName: 'The Astaka @ KLCC' },
      imageIdx: 9,
    },
    {
      slug: 'penthouse-klcc',
      title: 'Penthouse in KLCC',
      description: 'Luxury penthouse with panoramic KLCC views. Premium finishes throughout, private lift lobby, and floor-to-ceiling glass walls. Iconic address with world-class concierge service.\n\nSpanning over 4,500 sq ft of pure luxury, this penthouse features imported Italian marble, Bulthaup kitchen, and Bang & Olufsen home entertainment system. The living room\'s 12-foot ceilings and seamless glass walls create a dramatic floating-in-the-sky sensation.\n\n5 en-suite bedrooms each have custom walk-in wardrobes. The master suite includes a private study, a freestanding soaking tub, and a vanity area fit for royalty.',
      vendorSlug: 'premium-living',
      city: 'Kuala Lumpur', state: 'WP Kuala Lumpur', postalCode: '50088',
      lat: 3.1569, lng: 101.7123,
      price: '5800000.00', isFeatured: true, fullMedia: true,
      attributes: { propertyType: 'penthouse', listingType: 'sale', bedrooms: 4, bathrooms: 5, builtUpSize: 4500, furnishing: 'fully_furnished', carParks: 3, tenure: 'Freehold', yearBuilt: 2022, facing: 'North', condition: 'Excellent', totalFloors: 65, floorLevel: '64-65', titleType: 'Strata', maintenanceFee: 1500, projectName: 'Four Seasons Place', developerName: 'Venus Assets' },
      imageIdx: 9,
    },
    // ── Budget Homes PJ (3 published) ──
    {
      slug: 'cozy-studio-lrt-kelana-jaya',
      title: 'Cozy Studio near LRT Kelana Jaya',
      description: 'Fully furnished studio apartment just 5 minutes walk to LRT Kelana Jaya. Perfect for working professionals. Complete with washer, fridge, and cooking facilities.\n\nThis well-maintained studio is ideal for young professionals working in KL or PJ. The unit comes with a queen bed, study desk, built-in wardrobe, and a separate kitchenette with electric stove, microwave, and mini-fridge. High-speed internet is included in maintenance fee.\n\nThe building offers a communal laundry room, mini-mart, and covered walkway to the LRT station. Monthly maintenance includes water and internet.',
      vendorSlug: 'budget-homes-pj',
      city: 'Petaling Jaya', state: 'Selangor', postalCode: '47301',
      lat: 3.1025, lng: 101.6272,
      price: '1500.00', isFeatured: false, priceType: 'monthly',
      attributes: { propertyType: 'studio', listingType: 'rent', bedrooms: 1, bathrooms: 1, builtUpSize: 450, furnishing: 'fully_furnished', carParks: 1, tenure: 'Leasehold', yearBuilt: 2015, facing: 'South', condition: 'Good', totalFloors: 20, floorLevel: '8', titleType: 'Strata', maintenanceFee: 200, rentalDeposit: '2 months', minimumRentalPeriod: '6 months' },
      imageIdx: 3,
    },
    {
      slug: 'executive-apartment-cyberjaya',
      title: 'Executive Apartment in Cyberjaya',
      description: 'Modern executive apartment in the heart of Cyberjaya tech hub. Near MMU, Cyberview Lodge, and D\'Pulze shopping mall. Great for tech professionals and students.\n\nThis modern unit features an open-plan layout with high ceilings and a private balcony overlooking the lake. The master bedroom has a walk-in wardrobe and en-suite bathroom. The second bedroom is currently set up as a home office.\n\nCyberjaya offers a lower cost of living compared to KL while maintaining excellent connectivity via the MEX Highway. The development includes a co-working space, jogging track, and Olympic-size pool.',
      vendorSlug: 'budget-homes-pj',
      city: 'Cyberjaya', state: 'Selangor', postalCode: '63000',
      lat: 2.9267, lng: 101.6424,
      price: '1800.00', isFeatured: false, fullMedia: true, priceType: 'monthly',
      attributes: { propertyType: 'apartment', listingType: 'rent', bedrooms: 2, bathrooms: 2, builtUpSize: 1000, furnishing: 'partially_furnished', carParks: 1, tenure: 'Freehold', yearBuilt: 2018, facing: 'North-West', condition: 'Good', totalFloors: 22, floorLevel: '10', titleType: 'Strata', maintenanceFee: 250, rentalDeposit: '2 months', minimumRentalPeriod: '12 months' },
      imageIdx: 7,
    },
    {
      slug: 'affordable-flat-puchong',
      title: 'Affordable Flat in Puchong',
      description: 'Well-maintained flat in Puchong with strategic location near IOI Mall and LRT station. Great for first-time buyers and young families on a budget.\n\nThis corner unit enjoys extra natural ventilation and light. The layout includes 3 bedrooms, 2 bathrooms, a spacious living/dining area, and an enclosed kitchen. Recently repainted with new electrical fittings and plumbing.\n\nPuchong is well-connected via LDP, KESAS, and the upcoming LRT3 extension. Nearby amenities include IOI Mall, Tesco, and multiple schools within walking distance.',
      vendorSlug: 'budget-homes-pj',
      city: 'Puchong', state: 'Selangor', postalCode: '47100',
      lat: 3.0379, lng: 101.6175,
      price: '900.00', isFeatured: false, priceType: 'monthly',
      attributes: { propertyType: 'apartment', listingType: 'rent', bedrooms: 3, bathrooms: 2, builtUpSize: 850, furnishing: 'unfurnished', carParks: 1, tenure: 'Leasehold', yearBuilt: 2005, condition: 'Good', totalFloors: 10, floorLevel: '6', titleType: 'Strata', maintenanceFee: 120, rentalDeposit: '2 months', minimumRentalPeriod: '12 months' },
      imageIdx: 1,
    },
    // ── Urban Nest Realty (5 published) ──
    {
      slug: 'eco-living-cyberjaya',
      title: 'Eco Living Apartment in Cyberjaya',
      description: 'Green-certified development with great facilities including community garden, solar panels, and rainwater harvesting. Close to universities and tech hubs.\n\nThis GreenRE Platinum-certified development is a sustainability pioneer in Malaysia. Each unit comes with energy-efficient inverter air-conditioning, low-VOC paints, and LED downlights. The balcony garden planter box encourages vertical greenery.\n\nCommunal facilities include a permaculture garden, composting station, electric vehicle charging bays, bicycle repair station, infinity pool with solar heating, and a fully-equipped co-working space for remote workers.',
      vendorSlug: 'urban-nest',
      city: 'Cyberjaya', state: 'Selangor', postalCode: '63000',
      lat: 2.9213, lng: 101.6546,
      price: '2500.00', isFeatured: true, fullMedia: true, priceType: 'monthly',
      attributes: { propertyType: 'apartment', listingType: 'rent', bedrooms: 3, bathrooms: 2, builtUpSize: 1050, furnishing: 'partially_furnished', carParks: 2, tenure: 'Freehold', yearBuilt: 2019, facing: 'South-East', condition: 'Excellent', totalFloors: 28, floorLevel: '20', titleType: 'Strata', maintenanceFee: 300, projectName: 'GreenHaven Cyberjaya', developerName: 'Sheng Tai International', rentalDeposit: '2+1 months', minimumRentalPeriod: '12 months' },
      imageIdx: 8,
    },
    {
      slug: 'townhouse-petaling-jaya',
      title: 'Townhouse in Petaling Jaya',
      description: 'Renovated townhouse with modern kitchen and open living space. Near LRT Taman Bahagia and major highways. Quiet neighbourhood with friendly community.\n\nThis mid-terrace townhouse has been tastefully renovated with an extended kitchen, new bathrooms, and an open-plan living/dining area. The kitchen features granite countertops, soft-close cabinetry, and a breakfast bar.\n\nUpstairs, 3 bedrooms offer comfortable family living. The master bedroom has built-in wardrobes and an en-suite bathroom. A small patio at the rear provides space for a herb garden or laundry drying area.',
      vendorSlug: 'urban-nest',
      city: 'Petaling Jaya', state: 'Selangor', postalCode: '46000',
      lat: 3.1118, lng: 101.6380,
      price: '3200.00', isFeatured: false, fullMedia: true, priceType: 'monthly',
      attributes: { propertyType: 'townhouse', listingType: 'rent', bedrooms: 3, bathrooms: 3, builtUpSize: 1300, furnishing: 'partially_furnished', carParks: 2, tenure: 'Leasehold', yearBuilt: 2000, condition: 'Renovated', titleType: 'Strata', rentalDeposit: '2+1 months', minimumRentalPeriod: '12 months' },
      imageIdx: 6,
    },
    {
      slug: 'family-home-shah-alam',
      title: 'Family Home in Shah Alam',
      description: 'Spacious double-storey landed property near schools and parks. Quiet neighbourhood with great community. Close to Stadium Shah Alam and i-City.\n\nThis well-maintained family home sits on a generous lot in a mature residential area. The open-plan ground floor includes a formal living room, dining area, family lounge, and a spacious kitchen with separate wet kitchen. A covered car porch fits 2 vehicles comfortably.\n\nThe upper floor has 4 bedrooms and 3 bathrooms. All bedrooms have air-conditioning and ceiling fans. The backyard is fenced with a small lawn area for children to play.',
      vendorSlug: 'urban-nest',
      city: 'Shah Alam', state: 'Selangor', postalCode: '40000',
      lat: 3.0733, lng: 101.5185,
      price: '1150000.00', isFeatured: false,
      attributes: { propertyType: 'terrace', listingType: 'sale', bedrooms: 4, bathrooms: 3, builtUpSize: 2200, landSize: 2400, furnishing: 'unfurnished', carParks: 2, tenure: 'Leasehold', yearBuilt: 2008, condition: 'Good', titleType: 'Individual' },
      imageIdx: 4,
    },
    {
      slug: 'townhouse-garden-shah-alam',
      title: 'Townhouse with Private Garden in Shah Alam',
      description: 'Beautiful townhouse with private garden in a gated community. Near Setia City Mall and excellent schools. Perfect for growing families seeking space and security.\n\nThis end-unit townhouse enjoys a larger than average private garden on two sides. The ground floor features a modern open-plan layout with a separate guest powder room. The kitchen has solid wood cabinetry and stone countertops.\n\nUpstairs, 3 bedrooms are served by 2 full bathrooms. The master bedroom has a walk-in wardrobe and a private balcony overlooking the garden. Gated community includes 24-hour patrol, playground, and a residents\' clubhouse.',
      vendorSlug: 'urban-nest',
      city: 'Shah Alam', state: 'Selangor', postalCode: '40170',
      lat: 3.0980, lng: 101.4875,
      price: '750000.00', isFeatured: false,
      attributes: { propertyType: 'townhouse', listingType: 'sale', bedrooms: 3, bathrooms: 2, builtUpSize: 1600, furnishing: 'partially_furnished', carParks: 2, tenure: 'Freehold', yearBuilt: 2014, condition: 'Good', titleType: 'Strata' },
      imageIdx: 0,
    },
    {
      slug: 'landed-home-seremban',
      title: 'Landed Home in Seremban',
      description: 'Affordable landed home with generous yard space. Great for families and first-time buyers. Near Seremban town centre and AEON Mall.\n\nThis well-proportioned double-storey terrace sits on a generous 3,000 sq ft lot. The ground floor has an open living/dining area, a separate kitchen, and a store room. A covered car porch accommodates 2 vehicles.\n\nThe upper floor has 4 bedrooms and 3 bathrooms, with the master bedroom featuring en-suite facilities and a built-in wardrobe. Seremban is fast becoming a popular choice for families priced out of KL, with the new Seremban-KL HSR planned nearby.',
      vendorSlug: 'urban-nest',
      city: 'Seremban', state: 'Negeri Sembilan', postalCode: '70000',
      lat: 2.7258, lng: 101.9424,
      price: '520000.00', isFeatured: false,
      attributes: { propertyType: 'terrace', listingType: 'sale', bedrooms: 4, bathrooms: 3, builtUpSize: 2000, landSize: 3000, furnishing: 'unfurnished', carParks: 2, tenure: 'Freehold', yearBuilt: 2016, condition: 'Good', titleType: 'Individual' },
      imageIdx: 3,
    },

    // ── Lifecycle demos: DRAFT, EXPIRED, ARCHIVED ──
    {
      slug: 'draft-renovated-bangsar-unit',
      title: 'Draft: Renovated Bangsar Unit',
      description: 'Draft listing pending vendor submission. Beautifully renovated unit in Bangsar with modern finishes.',
      vendorSlug: 'sunrise-properties',
      city: 'Kuala Lumpur', state: 'WP Kuala Lumpur',
      lat: 3.1295, lng: 101.6711,
      price: '890000.00', isFeatured: false, status: 'DRAFT',
      attributes: { propertyType: 'condominium', listingType: 'sale', bedrooms: 3, bathrooms: 2, builtUpSize: 980, tenure: 'Freehold', condition: 'Renovated' },
      imageIdx: 7,
    },
    {
      slug: 'expired-kl-eco-suite',
      title: 'Expired: KL Eco Suite',
      description: 'This listing has expired and needs renewal. Previously popular eco-certified apartment.',
      vendorSlug: 'sunrise-properties',
      city: 'Kuala Lumpur', state: 'WP Kuala Lumpur',
      lat: 3.1175, lng: 101.6650,
      price: '610000.00', isFeatured: false, status: 'EXPIRED',
      attributes: { propertyType: 'apartment', listingType: 'sale', bedrooms: 2, bathrooms: 1, builtUpSize: 720, tenure: 'Leasehold', condition: 'Good' },
      imageIdx: 8,
    },
    {
      slug: 'draft-starter-home-putrajaya',
      title: 'Draft: Starter Home in Putrajaya',
      description: 'Draft listing for moderation workflow demo. Affordable starter home in the administrative capital.',
      vendorSlug: 'urban-nest',
      city: 'Putrajaya', state: 'WP Putrajaya',
      lat: 2.9264, lng: 101.6964,
      price: '730000.00', isFeatured: false, status: 'DRAFT',
      attributes: { propertyType: 'terrace', listingType: 'sale', bedrooms: 3, bathrooms: 2, builtUpSize: 1100, tenure: 'Freehold', condition: 'Brand New' },
      imageIdx: 4,
    },
    {
      slug: 'archived-old-townhouse',
      title: 'Archived: Old Townhouse',
      description: 'Archived listing for historical/testing purposes. Was previously a popular townhouse listing.',
      vendorSlug: 'urban-nest',
      city: 'Petaling Jaya', state: 'Selangor',
      lat: 3.1067, lng: 101.6075,
      price: '860000.00', isFeatured: false, status: 'ARCHIVED',
      attributes: { propertyType: 'townhouse', listingType: 'sale', bedrooms: 3, bathrooms: 2, builtUpSize: 1200, tenure: 'Leasehold', condition: 'Good' },
      imageIdx: 6,
    },
  ];

  const allListingIds: string[] = [];

  for (const t of listingTemplates) {
    const vendor = vendorRecords[t.vendorSlug];
    const publishedAt = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7);
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 60);
    const expiredAt = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 14);

    const status = t.status ?? 'PUBLISHED';
    const lifecyclePublishedAt = status === 'PUBLISHED' || status === 'EXPIRED' ? publishedAt : null;
    const lifecycleExpiresAt = status === 'EXPIRED' ? expiredAt : status === 'PUBLISHED' ? expiresAt : null;

    const listing = await prisma.listing.upsert({
      where: { partnerId_slug: { partnerId: partner.id, slug: t.slug } },
      update: {
        vendorId: vendor.id,
        title: t.title,
        description: t.description,
        verticalType: 'real_estate',
        schemaVersion: '1.0',
        price: t.price,
        currency: 'MYR',
        priceType: t.priceType ?? null,
        location: {
          address: `${t.city}, ${t.state}, Malaysia`,
          city: t.city,
          state: t.state,
          country: 'MY',
          ...(t.postalCode ? { postalCode: t.postalCode } : {}),
          ...(t.lat ? { lat: t.lat, lng: t.lng } : {}),
        },
        attributes: t.attributes,
        status,
        publishedAt: lifecyclePublishedAt,
        expiresAt: lifecycleExpiresAt,
        isFeatured: t.isFeatured,
        featuredUntil: t.isFeatured && status === 'PUBLISHED' ? expiresAt : null,
        deletedAt: null,
      },
      create: {
        partnerId: partner.id,
        vendorId: vendor.id,
        verticalType: 'real_estate',
        schemaVersion: '1.0',
        title: t.title,
        description: t.description,
        slug: t.slug,
        price: t.price,
        currency: 'MYR',
        priceType: t.priceType ?? null,
        location: {
          address: `${t.city}, ${t.state}, Malaysia`,
          city: t.city,
          state: t.state,
          country: 'MY',
          ...(t.postalCode ? { postalCode: t.postalCode } : {}),
          ...(t.lat ? { lat: t.lat, lng: t.lng } : {}),
        },
        attributes: t.attributes,
        status,
        publishedAt: lifecyclePublishedAt,
        expiresAt: lifecycleExpiresAt,
        isFeatured: t.isFeatured,
        featuredUntil: t.isFeatured && status === 'PUBLISHED' ? expiresAt : null,
      },
      select: { id: true, slug: true, vendorId: true },
    });

    allListingIds.push(listing.id);

    // ── Media (5 images per listing) ──
    const mediaImages = [0, 1, 2, 3, 4].map((offset) => ({
      idx: (t.imageIdx + offset) % PROPERTY_IMAGES.length,
      isPrimary: offset === 0,
    }));

    for (let i = 0; i < mediaImages.length; i++) {
      const m = mediaImages[i];
      const storageKey = `seed/${partner.slug}/listings/${listing.slug}/photo-${i + 1}.jpg`;
      const cdnUrl = PROPERTY_IMAGES[m.idx];

      await prisma.listingMedia.upsert({
        where: { storageKey },
        update: {
          partnerId: partner.id,
          listingId: listing.id,
          filename: `photo-${i + 1}.jpg`,
          mimeType: 'image/jpeg',
          size: 150_000 + i * 20_000,
          mediaType: 'IMAGE',
          cdnUrl,
          thumbnailUrl: thumb(cdnUrl),
          processingStatus: 'completed',
          visibility: 'PUBLIC',
          sortOrder: i,
          isPrimary: m.isPrimary,
          altText: `${t.title} - Photo ${i + 1}`,
          deletedAt: null,
        },
        create: {
          partnerId: partner.id,
          listingId: listing.id,
          filename: `photo-${i + 1}.jpg`,
          mimeType: 'image/jpeg',
          size: 150_000 + i * 20_000,
          mediaType: 'IMAGE',
          storageKey,
          cdnUrl,
          thumbnailUrl: thumb(cdnUrl),
          processingStatus: 'completed',
          visibility: 'PUBLIC',
          sortOrder: i,
          isPrimary: m.isPrimary,
          altText: `${t.title} - Photo ${i + 1}`,
        },
        select: { id: true },
      });
    }

    // �"��"� Extra media for fullMedia listings (video tour + floor plan) �"��"�
    if (t.fullMedia) {
      // Video tour
      const videoStorageKey = `seed/${partner.slug}/listings/${listing.slug}/video-tour.mp4`;
      await prisma.listingMedia.upsert({
        where: { storageKey: videoStorageKey },
        update: {
          partnerId: partner.id,
          listingId: listing.id,
          filename: 'video-tour.mp4',
          mimeType: 'video/mp4',
          size: 25_000_000,
          mediaType: 'VIDEO',
          cdnUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnailUrl: pickImg(t.imageIdx),
          processingStatus: 'completed',
          visibility: 'PUBLIC',
          sortOrder: 5,
          isPrimary: false,
          altText: `${t.title} - Virtual Tour`,
          deletedAt: null,
        },
        create: {
          partnerId: partner.id,
          listingId: listing.id,
          filename: 'video-tour.mp4',
          mimeType: 'video/mp4',
          size: 25_000_000,
          mediaType: 'VIDEO',
          storageKey: videoStorageKey,
          cdnUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnailUrl: pickImg(t.imageIdx),
          processingStatus: 'completed',
          visibility: 'PUBLIC',
          sortOrder: 5,
          isPrimary: false,
          altText: `${t.title} - Virtual Tour`,
        },
        select: { id: true },
      });

      // Floor plan images (2 plans: overall layout + unit layout)
      const floorPlanImages = [
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1504297050568-910d24c426d3?w=800&h=600&fit=crop',
      ];
      for (let fp = 0; fp < floorPlanImages.length; fp++) {
        const fpStorageKey = `seed/${partner.slug}/listings/${listing.slug}/floor-plan-${fp + 1}.jpg`;
        const fpLabels = ['Floor Plan - Overall Layout', 'Floor Plan - Unit Layout'];
        await prisma.listingMedia.upsert({
          where: { storageKey: fpStorageKey },
          update: {
            partnerId: partner.id,
            listingId: listing.id,
            filename: `floor-plan-${fp + 1}.jpg`,
            mimeType: 'image/jpeg',
            size: 200_000 + fp * 50_000,
            mediaType: 'IMAGE',
            cdnUrl: floorPlanImages[fp],
            thumbnailUrl: thumb(floorPlanImages[fp]),
            processingStatus: 'completed',
            visibility: 'PUBLIC',
            sortOrder: 6 + fp,
            isPrimary: false,
            altText: fpLabels[fp],
            deletedAt: null,
          },
          create: {
            partnerId: partner.id,
            listingId: listing.id,
            filename: `floor-plan-${fp + 1}.jpg`,
            mimeType: 'image/jpeg',
            size: 200_000 + fp * 50_000,
            mediaType: 'IMAGE',
            storageKey: fpStorageKey,
            cdnUrl: floorPlanImages[fp],
            thumbnailUrl: thumb(floorPlanImages[fp]),
            processingStatus: 'completed',
            visibility: 'PUBLIC',
            sortOrder: 6 + fp,
            isPrimary: false,
            altText: fpLabels[fp],
          },
          select: { id: true },
        });
      }
    }

    console.log(`   📝 Listing: ${listing.slug} [${status}]`);
  }

  console.log(`✅ ${listingTemplates.length} listings seeded`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. INTERACTIONS (leads / inquiries for vendor inbox demo)
  // ═══════════════════════════════════════════════════════════════════════════
  const interactionSeeds: Array<{
    id: string;
    listingSlug: string;
    contactName: string;
    contactEmail: string;
    message: string;
    status: InteractionStatus;
  }> = [
    { id: '11111111-1111-4111-8111-111111111111', listingSlug: 'modern-condo-bukit-bintang', contactName: 'Aisyah', contactEmail: 'aisyah@example.com', message: 'Hi, is this unit still available? Can I schedule a viewing this weekend?', status: InteractionStatus.NEW },
    { id: '22222222-2222-4222-8222-222222222222', listingSlug: 'eco-living-cyberjaya', contactName: 'Aisyah', contactEmail: 'aisyah@example.com', message: 'Hi, is this unit still available? Can I schedule a viewing this weekend?', status: InteractionStatus.NEW },
    { id: '44444444-4444-4444-8444-444444444444', listingSlug: 'family-home-shah-alam', contactName: 'Aisyah', contactEmail: 'aisyah@example.com', message: 'Can you share the exact address and nearby schools?', status: InteractionStatus.CONTACTED },
    { id: '55555555-5555-4555-8555-555555555555', listingSlug: 'townhouse-petaling-jaya', contactName: 'Daniel', contactEmail: 'daniel@example.com', message: 'Hi, is this unit still available? Can I schedule a viewing this weekend?', status: InteractionStatus.NEW },
    { id: 'a0a0a0a0-a0a0-4a0a-8a0a-a0a0a0a0a0a0', listingSlug: 'luxury-bungalow-damansara-heights', contactName: 'Sarah', contactEmail: 'sarah@example.com', message: 'I am interested in viewing this property. Is it available for a private tour?', status: InteractionStatus.NEW },
    { id: 'b0b0b0b0-b0b0-4b0b-8b0b-b0b0b0b0b0b0', listingSlug: 'penthouse-klcc', contactName: 'Ahmad', contactEmail: 'ahmad@example.com', message: 'What is the service charge for this penthouse? And monthly maintenance?', status: InteractionStatus.CONTACTED },
  ];

  for (const is of interactionSeeds) {
    const listing = await prisma.listing.findFirst({
      where: { partnerId: partner.id, slug: is.listingSlug },
      select: { id: true, vendorId: true },
    });
    if (!listing) continue;

    const vendor = await prisma.vendor.findUnique({
      where: { id: listing.vendorId },
      select: { id: true, name: true },
    });
    if (!vendor) continue;

    const interaction = await prisma.interaction.upsert({
      where: { id: is.id },
      update: {
        partnerId: partner.id,
        vendorId: vendor.id,
        listingId: listing.id,
        verticalType: 'real_estate',
        interactionType: 'LEAD',
        contactName: is.contactName,
        contactEmail: is.contactEmail,
        contactPhone: '+601333333333',
        message: is.message,
        status: is.status,
        source: 'web',
        referrer: 'seed',
      },
      create: {
        id: is.id,
        partnerId: partner.id,
        vendorId: vendor.id,
        listingId: listing.id,
        verticalType: 'real_estate',
        interactionType: 'LEAD',
        contactName: is.contactName,
        contactEmail: is.contactEmail,
        contactPhone: '+601333333333',
        message: is.message,
        status: is.status,
        source: 'web',
        referrer: 'seed',
      },
      select: { id: true },
    });

    // Two messages per interaction
    const msg1Id = `${is.id.slice(0, 8)}-0001-4aaa-8aaa-aaaaaaaaaaaa`;
    const msg2Id = `${is.id.slice(0, 8)}-0002-4bbb-8bbb-bbbbbbbbbbbb`;

    await prisma.interactionMessage.upsert({
      where: { id: msg1Id },
      update: { interactionId: interaction.id, senderType: 'CUSTOMER', senderId: null, senderName: is.contactName, message: is.message, isInternal: false },
      create: { id: msg1Id, interactionId: interaction.id, senderType: 'CUSTOMER', senderId: null, senderName: is.contactName, message: is.message, isInternal: false },
    });

    await prisma.interactionMessage.upsert({
      where: { id: msg2Id },
      update: { interactionId: interaction.id, senderType: 'VENDOR', senderId: vendor.id, senderName: vendor.name, message: 'Thanks for reaching out — happy to arrange a viewing. What time works for you?', isInternal: false },
      create: { id: msg2Id, interactionId: interaction.id, senderType: 'VENDOR', senderId: vendor.id, senderName: vendor.name, message: 'Thanks for reaching out — happy to arrange a viewing. What time works for you?', isInternal: false },
    });
  }
  console.log(`✅ ${interactionSeeds.length} interactions seeded`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. REVIEWS
  // ═══════════════════════════════════════════════════════════════════════════
  const reviewSeeds: Array<{
    id: string;
    listingSlug: string;
    rating: number;
    title: string;
    content: string;
    status: ReviewStatus;
  }> = [
    { id: '33333333-3333-4333-8333-333333333333', listingSlug: 'modern-condo-bukit-bintang', rating: 5, title: 'Great experience', content: 'Super responsive agent and smooth process. The place looks exactly like the photos.', status: ReviewStatus.APPROVED },
    { id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', listingSlug: 'eco-living-cyberjaya', rating: 4, title: 'Nice place', content: 'Good facilities and convenient location. Would recommend.', status: ReviewStatus.APPROVED },
    { id: 'f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', listingSlug: 'luxury-bungalow-damansara-heights', rating: 5, title: 'Stunning property', content: 'Absolutely magnificent. The pool and gardens are even better in person. Worth every ringgit.', status: ReviewStatus.APPROVED },
    { id: 'f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2', listingSlug: 'spacious-condo-klcc-view', rating: 4, title: 'Amazing view', content: 'The KLCC view is breathtaking, especially at night. Facilities are top-notch.', status: ReviewStatus.PENDING },
    { id: 'f3f3f3f3-f3f3-4f3f-8f3f-f3f3f3f3f3f3', listingSlug: 'penthouse-klcc', rating: 5, title: 'World-class living', content: 'The epitome of luxury living in KL. Concierge service is exceptional.', status: ReviewStatus.APPROVED },
  ];

  for (const rs of reviewSeeds) {
    const listing = await prisma.listing.findFirst({
      where: { partnerId: partner.id, slug: rs.listingSlug },
      select: { id: true, vendorId: true },
    });
    if (!listing) continue;

    await prisma.review.upsert({
      where: { id: rs.id },
      update: {
        partnerId: partner.id,
        targetType: 'listing',
        targetId: listing.id,
        verticalType: 'real_estate',
        reviewerRef: 'seed:customer:anonymous',
        rating: rs.rating,
        title: rs.title,
        content: rs.content,
        status: rs.status,
        vendorId: listing.vendorId,
        listingId: listing.id,
      },
      create: {
        id: rs.id,
        partnerId: partner.id,
        targetType: 'listing',
        targetId: listing.id,
        verticalType: 'real_estate',
        reviewerRef: 'seed:customer:anonymous',
        rating: rs.rating,
        title: rs.title,
        content: rs.content,
        status: rs.status,
        vendorId: listing.vendorId,
        listingId: listing.id,
      },
    });
  }
  console.log(`✅ ${reviewSeeds.length} reviews seeded`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. ANALYTICS — 14 days of vendor + listing stats
  // ═══════════════════════════════════════════════════════════════════════════
  const days = 14;
  for (const vendorSlug of Object.keys(vendorRecords)) {
    const vendor = vendorRecords[vendorSlug];

    for (let d = 0; d < days; d++) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - d));

      await prisma.vendorStats.upsert({
        where: { partnerId_vendorId_date: { partnerId: partner.id, vendorId: vendor.id, date } },
        update: { viewsCount: 50 + d * 3, inquiriesCount: 2 + (d % 3), leadsCount: 1 + (d % 2), enquiriesCount: 2 + (d % 3), bookingsCount: 0 },
        create: { partnerId: partner.id, vendorId: vendor.id, date, viewsCount: 50 + d * 3, inquiriesCount: 2 + (d % 3), leadsCount: 1 + (d % 2), enquiriesCount: 2 + (d % 3), bookingsCount: 0 },
      });
    }
  }

  // Listing stats for published listings
  const publishedListings = await prisma.listing.findMany({
    where: { partnerId: partner.id, status: 'PUBLISHED' },
    select: { id: true, vendorId: true },
  });

  for (let d = 0; d < days; d++) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - d));

    for (let i = 0; i < publishedListings.length; i++) {
      const pl = publishedListings[i];
      await prisma.listingStats.upsert({
        where: { partnerId_listingId_date: { partnerId: partner.id, listingId: pl.id, date } },
        update: { vendorId: pl.vendorId, verticalType: 'real_estate', viewsCount: 10 + d + i, inquiriesCount: (d + i) % 3, leadsCount: (d + i) % 2, enquiriesCount: (d + i) % 3, bookingsCount: 0 },
        create: { partnerId: partner.id, listingId: pl.id, vendorId: pl.vendorId, verticalType: 'real_estate', date, viewsCount: 10 + d + i, inquiriesCount: (d + i) % 3, leadsCount: (d + i) % 2, enquiriesCount: (d + i) % 3, bookingsCount: 0 },
      });
    }
  }
  console.log(`✅ Analytics: ${days} days × ${Object.keys(vendorRecords).length} vendors + ${publishedListings.length} listings`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. PROPERTY MANAGEMENT: Tenant, Tenancy, Contract, Deposit
  // ═══════════════════════════════════════════════════════════════════════════
  const tenant = await prisma.tenant.upsert({
    where: { userId_partnerId: { userId: tenantUser.id, partnerId: partner.id } },
    update: { status: 'APPROVED', employmentType: 'EMPLOYED', monthlyIncome: 8000, employer: 'TechCorp Sdn Bhd', icNumber: '900101145678', icVerified: true, incomeVerified: true, emergencyName: 'James Tenant', emergencyPhone: '+60177777777', emergencyRelation: 'Spouse', screeningScore: 85, screeningNotes: 'Good credit history, stable employment', screenedAt: now },
    create: { userId: tenantUser.id, partnerId: partner.id, status: 'APPROVED', employmentType: 'EMPLOYED', monthlyIncome: 8000, employer: 'TechCorp Sdn Bhd', icNumber: '900101145678', icVerified: true, incomeVerified: true, emergencyName: 'James Tenant', emergencyPhone: '+60177777777', emergencyRelation: 'Spouse', screeningScore: 85, screeningNotes: 'Good credit history, stable employment', screenedAt: now },
    select: { id: true, status: true },
  });
  console.log(`✅ Tenant profile: ${tenant.id} (${tenant.status})`);

  // Tenant documents
  const occDocUuids: Record<string, string> = {
    ic_front: 'c0c00001-0000-4000-8000-000000000001',
    ic_back: 'c0c00001-0000-4000-8000-000000000002',
    payslip: 'c0c00001-0000-4000-8000-000000000003',
    employment_letter: 'c0c00001-0000-4000-8000-000000000004',
  };
  for (const docType of ['IC_FRONT', 'IC_BACK', 'PAYSLIP', 'EMPLOYMENT_LETTER']) {
    const docId = occDocUuids[docType.toLowerCase()];
    await prisma.tenantDocument.upsert({
      where: { id: docId },
      update: { verified: true, verifiedAt: now },
      create: { id: docId, tenantId: tenant.id, type: docType, fileName: `${docType.toLowerCase()}.pdf`, fileUrl: `https://storage.example.com/tenant/${tenant.id}/${docType.toLowerCase()}.pdf`, fileSize: 102400, mimeType: 'application/pdf', verified: true, verifiedAt: now },
    });
  }
  console.log('✅ Tenant documents: 4 docs');

  // Vendor KYC documents for first vendor
  const firstVendor = vendorRecords['sunrise-properties'];
  const vndDocUuids: Record<string, string> = {
    ic_front: 'd0d00001-0000-4000-8000-000000000001',
    ic_back: 'd0d00001-0000-4000-8000-000000000002',
    business_license: 'd0d00001-0000-4000-8000-000000000003',
    ssm: 'd0d00001-0000-4000-8000-000000000004',
  };
  for (const docType of ['IC_FRONT', 'IC_BACK', 'BUSINESS_LICENSE', 'SSM']) {
    const docId = vndDocUuids[docType.toLowerCase()];
    await prisma.vendorDocument.upsert({
      where: { id: docId },
      update: { verified: true, verifiedAt: now },
      create: { id: docId, vendorId: firstVendor.id, type: docType, fileName: `${docType.toLowerCase()}.pdf`, fileUrl: `https://storage.example.com/vendor/${firstVendor.id}/${docType.toLowerCase()}.pdf`, fileSize: 204800, mimeType: 'application/pdf', verified: true, verifiedAt: now },
    });
  }
  console.log(`✅ Vendor documents: ${firstVendor.name}`);

  // Tenancy on first published listing from sunrise
  const firstListing = await prisma.listing.findFirst({
    where: { vendorId: firstVendor.id, status: 'PUBLISHED' },
    select: { id: true, price: true },
  });

  if (firstListing) {
    const leaseStartDate = new Date();
    leaseStartDate.setMonth(leaseStartDate.getMonth() - 1);
    const leaseEndDate = new Date(leaseStartDate);
    leaseEndDate.setFullYear(leaseEndDate.getFullYear() + 1);
    const monthlyRent = firstListing.price ? Number(firstListing.price) : 2500;

    const tenancy = await prisma.tenancy.upsert({
      where: { id: 'e0e00001-0000-4000-8000-000000000001' },
      update: { status: 'ACTIVE', leaseStartDate, leaseEndDate, moveInDate: leaseStartDate, monthlyRent, securityDeposit: monthlyRent * 2, utilityDeposit: monthlyRent * 0.5 },
      create: {
        id: 'e0e00001-0000-4000-8000-000000000001',
        partnerId: partner.id,
        listingId: firstListing.id,
        ownerId: firstVendor.id,
        tenantId: tenant.id,
        status: 'ACTIVE',
        applicationDate: new Date(leaseStartDate.getTime() - 14 * 24 * 60 * 60 * 1000),
        leaseStartDate,
        leaseEndDate,
        moveInDate: leaseStartDate,
        monthlyRent,
        securityDeposit: monthlyRent * 2,
        utilityDeposit: monthlyRent * 0.5,
        keyDeposit: 100,
        billingDay: 1,
        paymentDueDay: 7,
        lateFeePercent: 5,
        notes: 'Demo tenancy for testing',
      },
      select: { id: true, status: true, monthlyRent: true },
    });
    console.log(`✅ Tenancy: ${tenancy.id} (${tenancy.status})`);

    // Status history
    const statusHistory = [
      { from: null, to: 'DRAFT', reason: 'Application submitted' },
      { from: 'DRAFT', to: 'BOOKED', reason: 'Booking confirmed by owner' },
      { from: 'BOOKED', to: 'DEPOSIT_PAID', reason: 'All deposits received' },
      { from: 'DEPOSIT_PAID', to: 'CONTRACT_PENDING', reason: 'Contract generated' },
      { from: 'CONTRACT_PENDING', to: 'ACTIVE', reason: 'Contract signed by both parties' },
    ];
    for (let i = 0; i < statusHistory.length; i++) {
      const sh = statusHistory[i];
      const changedAt = new Date(leaseStartDate);
      changedAt.setDate(changedAt.getDate() - (statusHistory.length - i));
      await prisma.tenancyStatusHistory.upsert({
        where: { id: `e0e10001-0000-4000-8000-00000000000${i + 1}` },
        update: {},
        create: { id: `e0e10001-0000-4000-8000-00000000000${i + 1}`, tenancyId: tenancy.id, fromStatus: sh.from as any, toStatus: sh.to as any, reason: sh.reason, changedBy: user.id, changedAt },
      });
    }
    console.log(`✅ Tenancy history: ${statusHistory.length} entries`);

    // Contract
    const contract = await prisma.contract.upsert({
      where: { tenancyId: tenancy.id },
      update: { status: 'ACTIVE', signedDate: leaseStartDate },
      create: {
        tenancyId: tenancy.id,
        contractNumber: 'CTR-2024-0001',
        status: 'ACTIVE',
        startDate: leaseStartDate,
        endDate: leaseEndDate,
        signedDate: leaseStartDate,
        ownerSignedAt: new Date(leaseStartDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        ownerSignedBy: firstVendor.id,
        ownerSignatureUrl: 'https://storage.example.com/signatures/owner-001.png',
        tenantSignedAt: new Date(leaseStartDate.getTime() - 1 * 24 * 60 * 60 * 1000),
        tenantSignedBy: tenantUser.id,
        tenantSignatureUrl: 'https://storage.example.com/signatures/tenant-001.png',
        documentUrl: 'https://storage.example.com/contracts/CTR-2024-0001.pdf',
        documentHash: 'sha256:abc123def456...',
        terms: {
          rentAmount: Number(tenancy.monthlyRent),
          securityDeposit: Number(tenancy.monthlyRent) * 2,
          utilityDeposit: Number(tenancy.monthlyRent) * 0.5,
          noticePeriod: 30,
          petAllowed: false,
          smokingAllowed: false,
          maxTenants: 2,
        },
      },
      select: { id: true, contractNumber: true, status: true },
    });
    console.log(`✅ Contract: ${contract.contractNumber} (${contract.status})`);

    // Deposits
    for (const dt of [
      { type: 'SECURITY', amount: Number(tenancy.monthlyRent) * 2, uuid: 'e0e20001-0000-4000-8000-000000000001' },
      { type: 'UTILITY', amount: Number(tenancy.monthlyRent) * 0.5, uuid: 'e0e20001-0000-4000-8000-000000000002' },
      { type: 'KEY', amount: 100, uuid: 'e0e20001-0000-4000-8000-000000000003' },
    ]) {
      await prisma.deposit.upsert({
        where: { id: dt.uuid },
        update: { status: 'HELD', collectedAt: leaseStartDate },
        create: { id: dt.uuid, tenancyId: tenancy.id, type: dt.type, amount: dt.amount, status: 'HELD', collectedAt: leaseStartDate, collectedVia: 'BANK_TRANSFER', paymentRef: `DEP-${dt.type}-001`, refundableAmount: dt.amount },
      });
    }
    console.log('✅ Deposits: 3 deposits');
  }

  // Contract template
  await prisma.contractTemplate.upsert({
    where: { id: 'e0e30001-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: 'e0e30001-0000-4000-8000-000000000001',
      partnerId: partner.id,
      name: 'Standard Residential Tenancy Agreement',
      description: 'Default template for residential property rentals',
      content: `
# TENANCY AGREEMENT

This Agreement is made on {{signDate}} between:

**LANDLORD:** {{ownerName}}
Address: {{ownerAddress}}

**Partner:** {{tenantName}}
IC Number: {{tenantIc}}

## PROPERTY
{{propertyAddress}}

## TERMS
- Monthly Rent: RM {{rentAmount}}
- Security Deposit: RM {{securityDeposit}}
- Utility Deposit: RM {{utilityDeposit}}
- Lease Period: {{leaseStartDate}} to {{leaseEndDate}}
- Notice Period: {{noticePeriod}} days

## CONDITIONS
1. The Tenant shall pay rent on or before the {{billingDay}}th of each month.
2. Late payment will incur a {{lateFeePercent}}% penalty.
3. The Tenant shall not sublet the property without written consent.
4. The Tenant shall maintain the property in good condition.

## SIGNATURES

Landlord: _____________________  Date: ___________

Partner: _____________________   Date: ___________
      `,
      variables: ['signDate', 'ownerName', 'ownerAddress', 'tenantName', 'tenantIc', 'propertyAddress', 'rentAmount', 'securityDeposit', 'utilityDeposit', 'leaseStartDate', 'leaseEndDate', 'noticePeriod', 'billingDay', 'lateFeePercent'],
      isDefault: true,
      isActive: true,
    },
  });
  console.log('✅ Contract template seeded');

  // ═══════════════════════════════════════════════════════════════════════════
  // VENDOR STAFF USERS (for property member assignments)
  // ═══════════════════════════════════════════════════════════════════════════
  const sunriseVendor = vendorRecords['sunrise-properties'];

  const vendorStaff1 = await prisma.user.upsert({
    where: { partnerId_email: { partnerId: partner.id, email: 'siti.pm@lamaniaga.local' } },
    update: { fullName: 'Siti Property Manager', role: 'VENDOR_STAFF', status: 'ACTIVE', vendorId: sunriseVendor.id },
    create: { partnerId: partner.id, email: 'siti.pm@lamaniaga.local', passwordHash, fullName: 'Siti Property Manager', phone: '+60123450001', role: 'VENDOR_STAFF', status: 'ACTIVE', vendorId: sunriseVendor.id },
    select: { id: true, email: true, role: true },
  });
  console.log(`✅ Vendor Staff: ${vendorStaff1.email}`);

  const vendorStaff2 = await prisma.user.upsert({
    where: { partnerId_email: { partnerId: partner.id, email: 'ahmad.maint@lamaniaga.local' } },
    update: { fullName: 'Ahmad Maintenance', role: 'VENDOR_STAFF', status: 'ACTIVE', vendorId: sunriseVendor.id },
    create: { partnerId: partner.id, email: 'ahmad.maint@lamaniaga.local', passwordHash, fullName: 'Ahmad Maintenance', phone: '+60123450002', role: 'VENDOR_STAFF', status: 'ACTIVE', vendorId: sunriseVendor.id },
    select: { id: true, email: true, role: true },
  });
  console.log(`✅ Vendor Staff: ${vendorStaff2.email}`);

  const vendorStaff3 = await prisma.user.upsert({
    where: { partnerId_email: { partnerId: partner.id, email: 'lisa.leasing@lamaniaga.local' } },
    update: { fullName: 'Lisa Leasing', role: 'VENDOR_STAFF', status: 'ACTIVE', vendorId: sunriseVendor.id },
    create: { partnerId: partner.id, email: 'lisa.leasing@lamaniaga.local', passwordHash, fullName: 'Lisa Leasing', phone: '+60123450003', role: 'VENDOR_STAFF', status: 'ACTIVE', vendorId: sunriseVendor.id },
    select: { id: true, email: true, role: true },
  });
  console.log(`✅ Vendor Staff: ${vendorStaff3.email}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PROPERTY MEMBERS — Assign staff to specific properties
  // ═══════════════════════════════════════════════════════════════════════════
  // Find the first Sunrise Properties listing for property member demo
  const sunriseListings = await prisma.listing.findMany({
    where: { vendorId: sunriseVendor.id },
    select: { id: true, title: true, slug: true },
    take: 3,
    orderBy: { createdAt: 'asc' },
  });

  if (sunriseListings.length > 0) {
    const listing1 = sunriseListings[0];
    const listing2 = sunriseListings[1] || sunriseListings[0];

    // Siti = Property Manager on listing 1 & 2
    await prisma.propertyMember.upsert({
      where: { listingId_userId: { listingId: listing1.id, userId: vendorStaff1.id } },
      update: { role: 'PROPERTY_MANAGER' },
      create: { partnerId: partner.id, listingId: listing1.id, userId: vendorStaff1.id, role: 'PROPERTY_MANAGER', notes: 'Main property manager for this unit' },
    });
    await prisma.propertyMember.upsert({
      where: { listingId_userId: { listingId: listing2.id, userId: vendorStaff1.id } },
      update: { role: 'PROPERTY_MANAGER' },
      create: { partnerId: partner.id, listingId: listing2.id, userId: vendorStaff1.id, role: 'PROPERTY_MANAGER', notes: 'Also managing this unit' },
    });

    // Ahmad = Maintenance Staff on listing 1
    await prisma.propertyMember.upsert({
      where: { listingId_userId: { listingId: listing1.id, userId: vendorStaff2.id } },
      update: { role: 'MAINTENANCE_STAFF' },
      create: { partnerId: partner.id, listingId: listing1.id, userId: vendorStaff2.id, role: 'MAINTENANCE_STAFF', notes: 'Handles all maintenance tickets' },
    });

    // Lisa = Leasing Manager on listing 1
    await prisma.propertyMember.upsert({
      where: { listingId_userId: { listingId: listing1.id, userId: vendorStaff3.id } },
      update: { role: 'LEASING_MANAGER' },
      create: { partnerId: partner.id, listingId: listing1.id, userId: vendorStaff3.id, role: 'LEASING_MANAGER', notes: 'Handles leasing and tenant screening' },
    });

    console.log(`✅ Property Members: 4 assignments across ${Math.min(sunriseListings.length, 2)} properties`);
    console.log(`   ${listing1.title}: Siti (PM), Ahmad (Maintenance), Lisa (Leasing)`);
    if (listing2.id !== listing1.id) {
      console.log(`   ${listing2.title}: Siti (PM)`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INDEPENDENT AGENT (no company)
  // ═══════════════════════════════════════════════════════════════════════════
  const independentAgentUser = await prisma.user.upsert({
    where: { partnerId_email: { partnerId: partner.id, email: 'solo.agent@lamaniaga.local' } },
    update: { fullName: 'Farid Independent', role: 'AGENT', status: 'ACTIVE' },
    create: { partnerId: partner.id, email: 'solo.agent@lamaniaga.local', passwordHash, fullName: 'Farid Independent', phone: '+60123450010', role: 'AGENT', status: 'ACTIVE' },
    select: { id: true, email: true, role: true },
  });

  await prisma.agent.upsert({
    where: { referralCode: 'FARID-SOLO' },
    update: { status: 'ACTIVE' },
    create: {
      userId: independentAgentUser.id,
      // companyId: null — independent agent, no company
      renNumber: 'REN 99999',
      renExpiry: new Date('2027-12-31'),
      referralCode: 'FARID-SOLO',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Independent Agent: ${independentAgentUser.email} (no company)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // DONE
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n🌱 Seed completed successfully!');
  console.log('─────────────────────────────────────');
  console.log('📊 Summary:');
  console.log(`   Partner:     ${partner.name} (slug: ${partner.slug})`);
  console.log(`   Vendors:    ${Object.keys(vendorRecords).length}`);
  console.log(`   Listings:   ${listingTemplates.length} (${listingTemplates.filter(l => !l.status || l.status === 'PUBLISHED').length} published)`);
  console.log(`   Reviews:    ${reviewSeeds.length}`);
  console.log(`   Leads:      ${interactionSeeds.length}`);
  console.log(`   Users:      admin, superadmin, customer, tenant + ${Object.keys(vendorRecords).length} vendor admins + 3 vendor staff + 1 independent agent`);
  console.log(`   PropertyMembers: 4 assignments`);
  console.log(`   Password:   ${demoPassword} (all users)`);
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
