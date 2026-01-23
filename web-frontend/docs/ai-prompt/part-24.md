# FRONTEND (WEB) — PART 24 — REAL ESTATE VERTICAL IMPLEMENTATION (LOCKED)

This part implements the **Real Estate vertical** for frontend.
Must align exactly with **Backend Part 29** schema and specifications.

All rules from WEB PART 0–23 apply fully.

---

## 24.1 VERTICAL REGISTRATION

```typescript
// verticals/real-estate/index.ts
import { VerticalConfig } from '@/types/vertical';
import { realEstateSchema } from './schema';
import { realEstateFilters } from './filters';
import { realEstateFormatters } from './formatters';
import { RealEstateListingCard } from './components/listing-card';
import { RealEstateSearchFilters } from './components/search-filters';

export const realEstateVertical: VerticalConfig = {
  type: 'real_estate',
  displayName: 'Real Estate',
  icon: Building2,
  schema: realEstateSchema,
  filters: realEstateFilters,
  formatters: realEstateFormatters,
  components: {
    ListingCard: RealEstateListingCard,
    SearchFilters: RealEstateSearchFilters,
  },
};

// Register with vertical registry
registerVertical(realEstateVertical);
```

---

## 24.2 ATTRIBUTE SCHEMA (BACKEND-ALIGNED)

Must match **Backend Part 29** exactly:

```typescript
// verticals/real-estate/schema.ts
import { z } from 'zod';
import { AttributeSchema, AttributeType } from '@/types/vertical';

export const realEstateSchema: AttributeSchema = {
  verticalType: 'real_estate',
  schemaVersion: '1.0',
  
  attributes: [
    // Core Attributes
    {
      key: 'propertyType',
      type: AttributeType.ENUM,
      label: 'Property Type',
      required: true,
      requiredForPublish: true,
      options: [
        { value: 'apartment', label: 'Apartment / Flat' },
        { value: 'condominium', label: 'Condominium' },
        { value: 'terrace', label: 'Terrace House' },
        { value: 'semi_detached', label: 'Semi-Detached' },
        { value: 'bungalow', label: 'Bungalow' },
        { value: 'townhouse', label: 'Townhouse' },
        { value: 'studio', label: 'Studio' },
        { value: 'penthouse', label: 'Penthouse' },
        { value: 'duplex', label: 'Duplex' },
        { value: 'villa', label: 'Villa' },
        { value: 'shop_lot', label: 'Shop Lot' },
        { value: 'office', label: 'Office' },
        { value: 'warehouse', label: 'Warehouse' },
        { value: 'factory', label: 'Factory' },
        { value: 'land', label: 'Land' },
        { value: 'other', label: 'Other' },
      ],
      searchable: true,
      filterable: true,
      group: 'basic',
    },
    {
      key: 'listingType',
      type: AttributeType.ENUM,
      label: 'Listing Type',
      required: true,
      requiredForPublish: true,
      options: [
        { value: 'sale', label: 'For Sale' },
        { value: 'rent', label: 'For Rent' },
      ],
      searchable: true,
      filterable: true,
      group: 'basic',
    },
    {
      key: 'tenure',
      type: AttributeType.ENUM,
      label: 'Tenure',
      required: false,
      requiredForPublish: false,
      options: [
        { value: 'freehold', label: 'Freehold' },
        { value: 'leasehold', label: 'Leasehold' },
        { value: 'malay_reserve', label: 'Malay Reserve' },
        { value: 'bumi_lot', label: 'Bumi Lot' },
      ],
      helpText: 'Property ownership type',
      group: 'legal',
      showWhen: { listingType: ['sale'] },
    },
    
    // Size & Dimensions
    {
      key: 'builtUpSize',
      type: AttributeType.NUMBER,
      label: 'Built-up Size',
      unit: 'sq ft',
      required: false,
      requiredForPublish: true,
      min: 1,
      max: 1000000,
      searchable: true,
      filterable: true,
      group: 'size',
      showWhen: { propertyType: ['apartment', 'condominium', 'house', 'townhouse', 'commercial', 'industrial'] },
    },
    {
      key: 'landSize',
      type: AttributeType.NUMBER,
      label: 'Land Size',
      unit: 'sq ft',
      required: false,
      min: 1,
      max: 10000000,
      searchable: true,
      filterable: true,
      group: 'size',
      showWhen: { propertyType: ['terrace', 'semi_detached', 'bungalow', 'land'] },
    },
    
    // Rooms
    {
      key: 'bedrooms',
      type: AttributeType.NUMBER,
      label: 'Bedrooms',
      required: false,
      requiredForPublish: true,
      min: 0,
      max: 20,
      step: 1,
      searchable: true,
      filterable: true,
      group: 'rooms',
    },
    {
      key: 'bathrooms',
      type: AttributeType.NUMBER,
      label: 'Bathrooms',
      required: false,
      requiredForPublish: true,
      min: 0,
      max: 20,
      step: 1,
      searchable: true,
      filterable: true,
      group: 'rooms',
    },
    {
      key: 'carParks',
      type: AttributeType.NUMBER,
      label: 'Car Parks',
      required: false,
      min: 0,
      max: 10,
      step: 1,
      searchable: true,
      filterable: true,
      group: 'rooms',
    },
    
    // Features
    {
      key: 'furnishing',
      type: AttributeType.ENUM,
      label: 'Furnishing',
      required: false,
      options: [
        { value: 'unfurnished', label: 'Unfurnished' },
        { value: 'partially_furnished', label: 'Partially Furnished' },
        { value: 'fully_furnished', label: 'Fully Furnished' },
      ],
      searchable: true,
      filterable: true,
      group: 'details',
    },
    {
      key: 'facing',
      type: AttributeType.ENUM,
      label: 'Facing',
      required: false,
      options: [
        { value: 'north', label: 'North' },
        { value: 'south', label: 'South' },
        { value: 'east', label: 'East' },
        { value: 'west', label: 'West' },
        { value: 'north_east', label: 'North East' },
        { value: 'north_west', label: 'North West' },
        { value: 'south_east', label: 'South East' },
        { value: 'south_west', label: 'South West' },
      ],
      group: 'features',
    },
    {
      key: 'floorLevel',
      type: AttributeType.STRING,
      label: 'Floor Level',
      required: false,
      maxLength: 20,
      placeholder: 'e.g., 15, Ground, Penthouse',
      group: 'details',
      showWhen: { propertyType: ['apartment', 'condominium', 'studio', 'penthouse', 'duplex'] },
    },
    {
      key: 'totalFloors',
      type: AttributeType.NUMBER,
      label: 'Total Floors',
      required: false,
      min: 1,
      max: 200,
      group: 'features',
      showWhen: { propertyType: ['apartment', 'condominium'] },
    },
    
    // Facilities (property facilities)
    {
      key: 'facilities',
      type: AttributeType.MULTI_SELECT,
      label: 'Facilities',
      required: false,
      options: [
        { value: 'swimming_pool', label: 'Swimming Pool' },
        { value: 'gym', label: 'Gymnasium' },
        { value: 'playground', label: 'Playground' },
        { value: 'tennis_court', label: 'Tennis Court' },
        { value: 'security', label: '24hr Security' },
        { value: 'parking', label: 'Covered Parking' },
        { value: 'bbq', label: 'BBQ Area' },
        { value: 'clubhouse', label: 'Clubhouse' },
        { value: 'sauna', label: 'Sauna' },
        { value: 'jogging_track', label: 'Jogging Track' },
        { value: 'mini_mart', label: 'Mini Mart' },
        { value: 'cafe', label: 'Cafe' },
      ],
      searchable: true,
      filterable: true,
      group: 'facilities',
    },
    
    // Nearby Amenities
    {
      key: 'nearbyAmenities',
      type: AttributeType.MULTI_SELECT,
      label: 'Nearby Amenities',
      required: false,
      options: [
        { value: 'mrt', label: 'MRT / LRT Station' },
        { value: 'bus', label: 'Bus Stop' },
        { value: 'school', label: 'School' },
        { value: 'hospital', label: 'Hospital' },
        { value: 'shopping_mall', label: 'Shopping Mall' },
        { value: 'supermarket', label: 'Supermarket' },
        { value: 'park', label: 'Park / Garden' },
        { value: 'highway', label: 'Highway Access' },
      ],
      searchable: true,
      filterable: true,
      group: 'amenities',
    },
    
    // Year & Condition
    {
      key: 'yearBuilt',
      type: AttributeType.NUMBER,
      label: 'Year Built',
      required: false,
      min: 1900,
      max: new Date().getFullYear() + 5,
      group: 'details',
    },
    {
      key: 'condition',
      type: AttributeType.ENUM,
      label: 'Property Condition',
      required: false,
      options: [
        { value: 'new', label: 'Brand New' },
        { value: 'good', label: 'Good Condition' },
        { value: 'renovated', label: 'Renovated' },
        { value: 'needs_renovation', label: 'Needs Renovation' },
      ],
      searchable: true,
      filterable: true,
      group: 'details',
    },
    
    // Rental Specific
    {
      key: 'minimumRentalPeriod',
      type: AttributeType.ENUM,
      label: 'Minimum Rental Period',
      required: false,
      options: [
        { value: '6_months', label: '6 Months' },
        { value: '12_months', label: '1 Year' },
        { value: '24_months', label: '2 Years' },
        { value: 'flexible', label: 'Flexible' },
      ],
      filterable: true,
      group: 'rental',
      showWhen: { listingType: ['rent'] },
    },
    {
      key: 'rentalDeposit',
      type: AttributeType.STRING,
      label: 'Rental Deposit',
      required: false,
      maxLength: 50,
      placeholder: 'e.g., 2+1',
      group: 'rental',
      showWhen: { listingType: ['rent'] },
    },
    
    // Reference
    {
      key: 'referenceId',
      type: AttributeType.STRING,
      label: 'Reference ID',
      required: false,
      helpText: 'Your internal reference number',
      group: 'reference',
    },
  ],
  
  groups: [
    { key: 'basic', label: 'Basic Information', order: 1 },
    { key: 'size', label: 'Size', order: 2 },
    { key: 'rooms', label: 'Rooms', order: 3 },
    { key: 'details', label: 'Property Details', order: 4 },
    { key: 'facilities', label: 'Facilities', order: 5 },
    { key: 'amenities', label: 'Nearby Amenities', order: 6 },
    { key: 'rental', label: 'Rental Terms', order: 7, showWhen: { listingType: ['rent'] } },
    { key: 'features', label: 'Additional Features', order: 8 },
    { key: 'reference', label: 'Reference', order: 9 },
  ],
  
  requiredForDraft: ['propertyType', 'listingType'],
  requiredForPublish: ['propertyType', 'listingType', 'builtUpSize', 'bedrooms', 'bathrooms'],
};
```

---

## 24.3 ZOD VALIDATION SCHEMA

```typescript
// verticals/real-estate/validation.ts
import { z } from 'zod';

export const realEstateAttributesSchema = z.object({
  propertyType: z.enum([
    'apartment', 'condominium', 'terrace', 'semi_detached', 'bungalow',
    'townhouse', 'studio', 'penthouse', 'duplex', 'villa',
    'shop_lot', 'office', 'warehouse', 'factory', 'land', 'other'
  ]),
  listingType: z.enum(['sale', 'rent']),
  tenure: z.enum(['freehold', 'leasehold', 'malay_reserve', 'bumi_lot']).optional(),
  builtUpSize: z.number().min(1).max(1000000).optional(),
  landSize: z.number().min(1).max(10000000).optional(),
  bedrooms: z.number().min(0).max(20).optional(),
  bathrooms: z.number().min(0).max(20).optional(),
  carParks: z.number().min(0).max(10).optional(),
  furnishing: z.enum(['unfurnished', 'partially_furnished', 'fully_furnished']).optional(),
  facing: z.enum([
    'north', 'south', 'east', 'west',
    'north_east', 'north_west', 'south_east', 'south_west'
  ]).optional(),
  floorLevel: z.string().max(20).optional(),
  totalFloors: z.number().min(1).max(200).optional(),
  facilities: z.array(z.string()).optional(),
  nearbyAmenities: z.array(z.string()).optional(),
  yearBuilt: z.number().min(1900).max(2030).optional(),
  condition: z.enum(['new', 'good', 'renovated', 'needs_renovation']).optional(),
  minimumRentalPeriod: z.enum(['6_months', '12_months', '24_months', 'flexible']).optional(),
  rentalDeposit: z.string().max(50).optional(),
  additionalFeatures: z.array(z.string()).optional(),
  referenceId: z.string().max(50).optional(),
}).refine(
  // Cross-field validation: bedrooms required for residential
  (data) => {
    if (['apartment', 'condominium', 'terrace', 'semi_detached', 'bungalow', 'townhouse', 'studio', 'penthouse', 'duplex', 'villa'].includes(data.propertyType)) {
      return data.bedrooms !== undefined;
    }
    return true;
  },
  { message: 'Bedrooms required for residential properties', path: ['bedrooms'] }
).refine(
  // Cross-field validation: landSize required for land type
  (data) => {
    if (data.propertyType === 'land') {
      return data.landSize !== undefined;
    }
    return true;
  },
  { message: 'Land size required for land listings', path: ['landSize'] }
);
    }
    return true;
  },
  { message: 'Bedrooms required for residential properties', path: ['bedrooms'] }
).refine(
  // Cross-field validation: landSize required for land type
  (data) => {
    if (data.propertyType === 'land') {
      return data.landSize !== undefined;
    }
    return true;
  },
  { message: 'Land size required for land listings', path: ['landSize'] }
);

export type RealEstateAttributes = z.infer<typeof realEstateAttributesSchema>;
```

---

## 24.4 SEARCH FILTERS

```typescript
// verticals/real-estate/filters.ts
import { FilterConfig } from '@/types/filters';

export const realEstateFilters: FilterConfig[] = [
  {
    key: 'propertyType',
    type: 'select',
    label: 'Property Type',
    multiple: true,
    options: [
      { value: 'apartment', label: 'Apartment / Flat' },
      { value: 'condominium', label: 'Condominium' },
      { value: 'terrace', label: 'Terrace House' },
      { value: 'semi_detached', label: 'Semi-Detached' },
      { value: 'bungalow', label: 'Bungalow' },
      { value: 'townhouse', label: 'Townhouse' },
      { value: 'studio', label: 'Studio' },
      { value: 'penthouse', label: 'Penthouse' },
      { value: 'duplex', label: 'Duplex' },
      { value: 'villa', label: 'Villa' },
      { value: 'shop_lot', label: 'Shop Lot' },
      { value: 'office', label: 'Office' },
      { value: 'warehouse', label: 'Warehouse' },
      { value: 'factory', label: 'Factory' },
      { value: 'land', label: 'Land' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    key: 'listingType',
    type: 'select',
    label: 'For',
    options: [
      { value: 'sale', label: 'Sale' },
      { value: 'rent', label: 'Rent' },
    ],
  },
  {
    key: 'price',
    type: 'range',
    label: 'Price',
    presets: {
      sale: [
        { label: 'Under RM300K', max: 300000 },
        { label: 'RM300K - RM500K', min: 300000, max: 500000 },
        { label: 'RM500K - RM1M', min: 500000, max: 1000000 },
        { label: 'RM1M - RM2M', min: 1000000, max: 2000000 },
        { label: 'Above RM2M', min: 2000000 },
      ],
      rent: [
        { label: 'Under RM1,500', max: 1500 },
        { label: 'RM1,500 - RM3,000', min: 1500, max: 3000 },
        { label: 'RM3,000 - RM5,000', min: 3000, max: 5000 },
        { label: 'Above RM5,000', min: 5000 },
      ],
    },
  },
  {
    key: 'bedrooms',
    type: 'select',
    label: 'Bedrooms',
    options: [
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3' },
      { value: '4', label: '4' },
      { value: '5+', label: '5+' },
    ],
  },
  {
    key: 'bathrooms',
    type: 'select',
    label: 'Bathrooms',
    options: [
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3+' },
    ],
  },
  {
    key: 'builtUpSize',
    type: 'range',
    label: 'Built-up Size',
    unit: 'sq ft',
    min: 0,
    max: 10000,
    step: 100,
  },
  {
    key: 'furnishing',
    type: 'select',
    label: 'Furnishing',
    options: [
      { value: 'unfurnished', label: 'Unfurnished' },
      { value: 'partially_furnished', label: 'Partially Furnished' },
      { value: 'fully_furnished', label: 'Fully Furnished' },
    ],
  },
  {
    key: 'tenure',
    type: 'select',
    label: 'Tenure',
    options: [
      { value: 'freehold', label: 'Freehold' },
      { value: 'leasehold', label: 'Leasehold' },
      { value: 'malay_reserve', label: 'Malay Reserve' },
      { value: 'bumi_lot', label: 'Bumi Lot' },
    ],
  },
  {
    key: 'facilities',
    type: 'multiselect',
    label: 'Facilities',
    options: [
      { value: 'swimming_pool', label: 'Swimming Pool' },
      { value: 'gym', label: 'Gymnasium' },
      { value: 'playground', label: 'Playground' },
      { value: 'tennis_court', label: 'Tennis Court' },
      { value: 'security', label: '24hr Security' },
      { value: 'parking', label: 'Covered Parking' },
      { value: 'bbq', label: 'BBQ Area' },
      { value: 'clubhouse', label: 'Clubhouse' },
      { value: 'sauna', label: 'Sauna' },
      { value: 'jogging_track', label: 'Jogging Track' },
    ],
  },
];
```

---

## 24.5 DISPLAY FORMATTERS

```typescript
// verticals/real-estate/formatters.ts
import { Formatters } from '@/types/vertical';

export const realEstateFormatters: Formatters = {
  // Price formatting
  price: (value: number, attributes: Record<string, unknown>) => {
    const formatted = new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      maximumFractionDigits: 0,
    }).format(value);
    
    if (attributes.listingType === 'rent') {
      return `${formatted}/month`;
    }
    return formatted;
  },
  
  // Size formatting
  builtUpSize: (value: number) => `${value.toLocaleString()} sq ft`,
  landSize: (value: number) => `${value.toLocaleString()} sq ft`,
  
  // Rooms formatting
  bedrooms: (value: number) => `${value} bed${value !== 1 ? 's' : ''}`,
  bathrooms: (value: number) => `${value} bath${value !== 1 ? 's' : ''}`,
  carParks: (value: number) => `${value} parking`,
  
  // Enum formatting
  propertyType: (value: string) => ({
    apartment: 'Apartment / Flat',
    condominium: 'Condominium',
    terrace: 'Terrace House',
    semi_detached: 'Semi-Detached',
    bungalow: 'Bungalow',
    townhouse: 'Townhouse',
    studio: 'Studio',
    penthouse: 'Penthouse',
    duplex: 'Duplex',
    villa: 'Villa',
    shop_lot: 'Shop Lot',
    office: 'Office',
    warehouse: 'Warehouse',
    factory: 'Factory',
    land: 'Land',
    other: 'Other',
  }[value] || value),
  
  listingType: (value: string) => ({
    sale: 'For Sale',
    rent: 'For Rent',
  }[value] || value),
  
  tenure: (value: string) => ({
    freehold: 'Freehold',
    leasehold: 'Leasehold',
    malay_reserve: 'Malay Reserve',
    bumi_lot: 'Bumi Lot',
  }[value] || value),
  
  furnishing: (value: string) => ({
    unfurnished: 'Unfurnished',
    partially_furnished: 'Partially Furnished',
    fully_furnished: 'Fully Furnished',
  }[value] || value),
  
  // Multi-select formatting
  facilities: (values: string[]) => {
    const labels: Record<string, string> = {
      swimming_pool: 'Pool',
      gym: 'Gym',
      playground: 'Playground',
      tennis_court: 'Tennis Court',
      security: 'Security',
      parking: 'Covered Parking',
      bbq: 'BBQ',
      clubhouse: 'Clubhouse',
      sauna: 'Sauna',
      jogging_track: 'Jogging Track',
      mini_mart: 'Mini Mart',
      cafe: 'Cafe',
    };
    return values.map(v => labels[v] || v);
  },
  
  nearbyAmenities: (values: string[]) => {
    const labels: Record<string, string> = {
      mrt: 'MRT / LRT',
      bus: 'Bus Stop',
      school: 'School',
      hospital: 'Hospital',
      shopping_mall: 'Shopping Mall',
      supermarket: 'Supermarket',
      park: 'Park',
      highway: 'Highway Access',
    };
    return values.map(v => labels[v] || v);
  },
  
  condition: (value: string) => ({
    new: 'Brand New',
    good: 'Good Condition',
    renovated: 'Renovated',
    needs_renovation: 'Needs Renovation',
  }[value] || value),
  
  minimumRentalPeriod: (value: string) => ({
    '6_months': '6 Months',
    '12_months': '1 Year',
    '24_months': '2 Years',
    flexible: 'Flexible',
  }[value] || value),
};
```

---

## 24.6 LISTING CARD COMPONENT

```typescript
// verticals/real-estate/components/listing-card.tsx
import { ListingCardProps } from '@/types/vertical';
import { Badge } from '@/components/ui/badge';
import { realEstateFormatters as fmt } from '../formatters';

export function RealEstateListingCard({ listing, onClick }: ListingCardProps) {
  const { attributes } = listing;
  
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      {/* Image */}
      <div className="relative aspect-[4/3]">
        <Image
          src={listing.primaryImage?.url || '/placeholder.jpg'}
          alt={listing.title}
          fill
          className="object-cover rounded-t-lg"
        />
        <Badge className="absolute top-2 left-2">
          {fmt.listingType(attributes.listingType)}
        </Badge>
        {listing.isFeatured && (
          <Badge variant="secondary" className="absolute top-2 right-2">
            Featured
          </Badge>
        )}
      </div>
      
      {/* Content */}
      <CardContent className="p-4">
        {/* Price */}
        <p className="text-xl font-bold text-primary">
          {fmt.price(listing.price, attributes)}
        </p>
        
        {/* Title */}
        <h3 className="font-semibold truncate mt-1">{listing.title}</h3>
        
        {/* Location */}
        <p className="text-sm text-muted-foreground truncate">
          {listing.location.address}, {listing.location.city}
        </p>
        
        {/* Specs */}
        <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
          {attributes.bedrooms !== undefined && (
            <span className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              {attributes.bedrooms}
            </span>
          )}
          {attributes.bathrooms !== undefined && (
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              {attributes.bathrooms}
            </span>
          )}
          {attributes.builtUpSize && (
            <span className="flex items-center gap-1">
              <Maximize className="h-4 w-4" />
              {attributes.builtUpSize.toLocaleString()} sqft
            </span>
          )}
        </div>
        
        {/* Property Type */}
        <Badge variant="outline" className="mt-3">
          {fmt.propertyType(attributes.propertyType)}
        </Badge>
      </CardContent>
    </Card>
  );
}
```

---

## 24.7 SEARCH FILTERS COMPONENT

```typescript
// verticals/real-estate/components/search-filters.tsx
import { SearchFiltersProps } from '@/types/vertical';
import { realEstateFilters } from '../filters';

export function RealEstateSearchFilters({ 
  filters, 
  onChange,
  onReset 
}: SearchFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterSelect
          label="Property Type"
          options={realEstateFilters.find(f => f.key === 'propertyType')?.options || []}
          value={filters.propertyType}
          onChange={(v) => onChange({ ...filters, propertyType: v })}
          multiple
        />
        <FilterSelect
          label="For"
          options={realEstateFilters.find(f => f.key === 'listingType')?.options || []}
          value={filters.listingType}
          onChange={(v) => onChange({ ...filters, listingType: v })}
        />
      </div>
      
      {/* Price Range */}
      <PriceRangeFilter
        value={{ min: filters.priceMin, max: filters.priceMax }}
        onChange={(range) => onChange({ 
          ...filters, 
          priceMin: range.min, 
          priceMax: range.max 
        })}
        presets={filters.listingType === 'rent' 
          ? realEstateFilters.find(f => f.key === 'price')?.presets?.rent
          : realEstateFilters.find(f => f.key === 'price')?.presets?.sale
        }
      />
      
      {/* Bedrooms */}
      <FilterButtonGroup
        label="Bedrooms"
        options={['Any', '1', '2', '3', '4', '5+']}
        value={filters.bedrooms}
        onChange={(v) => onChange({ ...filters, bedrooms: v === 'Any' ? undefined : v })}
      />
      
      {/* More Filters (collapsible) */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          More Filters
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          <FilterSelect
            label="Furnishing"
            options={realEstateFilters.find(f => f.key === 'furnishing')?.options || []}
            value={filters.furnishing}
            onChange={(v) => onChange({ ...filters, furnishing: v })}
          />
          <FilterSelect
            label="Tenure"
            options={realEstateFilters.find(f => f.key === 'tenure')?.options || []}
            value={filters.tenure}
            onChange={(v) => onChange({ ...filters, tenure: v })}
          />
          <RangeSlider
            label="Built-up Size"
            unit="sq ft"
            min={0}
            max={10000}
            step={100}
            value={[filters.builtUpSizeMin || 0, filters.builtUpSizeMax || 10000]}
            onChange={([min, max]) => onChange({ 
              ...filters, 
              builtUpSizeMin: min, 
              builtUpSizeMax: max 
            })}
          />
          <FilterMultiSelect
            label="Amenities"
            options={realEstateFilters.find(f => f.key === 'amenities')?.options || []}
            value={filters.amenities || []}
            onChange={(v) => onChange({ ...filters, amenities: v })}
          />
        </CollapsibleContent>
      </Collapsible>
      
      {/* Reset */}
      <Button variant="ghost" onClick={onReset}>
        Reset Filters
      </Button>
    </div>
  );
}
```

---

## 24.8 ATTRIBUTE FORM COMPONENT

```typescript
// verticals/real-estate/components/attribute-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { realEstateAttributesSchema, RealEstateAttributes } from '../validation';
import { realEstateSchema } from '../schema';

export function RealEstateAttributeForm({
  defaultValues,
  onSubmit,
  isPublishing = false,
}: {
  defaultValues?: Partial<RealEstateAttributes>;
  onSubmit: (data: RealEstateAttributes) => void;
  isPublishing?: boolean;
}) {
  const form = useForm<RealEstateAttributes>({
    resolver: zodResolver(realEstateAttributesSchema),
    defaultValues,
  });
  
  const propertyType = form.watch('propertyType');
  const listingType = form.watch('listingType');
  
  // Group attributes by section
  const groups = realEstateSchema.groups.filter(group => {
    if (group.showWhen) {
      return Object.entries(group.showWhen).every(([key, values]) => {
        const currentValue = form.watch(key as keyof RealEstateAttributes);
        return values.includes(currentValue);
      });
    }
    return true;
  });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {groups.map(group => (
          <Card key={group.key}>
            <CardHeader>
              <CardTitle>{group.label}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {realEstateSchema.attributes
                .filter(attr => attr.group === group.key)
                .filter(attr => {
                  // Check showWhen conditions
                  if (attr.showWhen) {
                    return Object.entries(attr.showWhen).every(([key, values]) => {
                      const currentValue = form.watch(key as keyof RealEstateAttributes);
                      return values.includes(currentValue);
                    });
                  }
                  return true;
                })
                .map(attr => (
                  <AttributeField
                    key={attr.key}
                    attribute={attr}
                    control={form.control}
                    isRequired={isPublishing && attr.requiredForPublish}
                  />
                ))}
            </CardContent>
          </Card>
        ))}
        
        <Button type="submit">
          {isPublishing ? 'Publish Listing' : 'Save Draft'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## 24.9 EXECUTION DIRECTIVE

Real Estate vertical implementation must:
- Match backend schema exactly
- Implement all cross-field validations
- Show/hide fields based on conditions
- Format values consistently
- Provide intuitive search filters
- Support grouped attribute rendering

Vertical alignment is critical for data integrity.

END OF WEB PART 24.
