# PART 29 — VERTICAL EXAMPLE: REAL ESTATE (REFERENCE IMPLEMENTATION)

This part provides a **complete reference implementation** of the `real_estate` vertical.
Use this as the template for all future vertical modules.

All rules from PART 0–28 apply.

---

## 29.1 VERTICAL IDENTITY

```typescript
const verticalDefinition = {
  verticalType: "real_estate",
  displayName: "Real Estate",
  description: "Residential and commercial property listings for sale and rent",
  iconUrl: "/icons/verticals/real-estate.svg",
  uiHints: {
    primaryColor: "#2563eb",
    listingCardLayout: "image-prominent",
    showMapByDefault: true
  }
};
```

---

## 29.2 LISTING SUBTYPES

Real estate supports multiple listing subtypes:

| Subtype | Description |
|---------|-------------|
| `residential_sale` | Houses, apartments for sale |
| `residential_rent` | Houses, apartments for rent |
| `commercial_sale` | Office, retail, industrial for sale |
| `commercial_rent` | Office, retail, industrial for rent |
| `land` | Land plots and development sites |
| `new_development` | Off-plan and new projects |

---

## 29.3 ATTRIBUTE SCHEMA (v1.0)

```typescript
const attributeSchema = {
  verticalType: "real_estate",
  schemaVersion: "1.0",
  
  attributes: [
    // === PROPERTY TYPE ===
    {
      key: "propertyType",
      label: "Property Type",
      type: "enum",
      required: true,
      requiredForPublish: true,
      options: [
        { value: "apartment", label: "Apartment / Flat" },
        { value: "condominium", label: "Condominium" },
        { value: "terrace", label: "Terrace House" },
        { value: "semi_detached", label: "Semi-Detached" },
        { value: "bungalow", label: "Bungalow" },
        { value: "townhouse", label: "Townhouse" },
        { value: "studio", label: "Studio" },
        { value: "penthouse", label: "Penthouse" },
        { value: "duplex", label: "Duplex" },
        { value: "villa", label: "Villa" },
        { value: "shop_lot", label: "Shop Lot" },
        { value: "office", label: "Office" },
        { value: "warehouse", label: "Warehouse" },
        { value: "factory", label: "Factory" },
        { value: "land", label: "Land" },
        { value: "other", label: "Other" }
      ],
      uiHints: {
        group: "basic",
        order: 1,
        displayAs: "select"
      },
      searchable: true,
      filterable: true
    },
    
    // === LISTING TYPE ===
    {
      key: "listingType",
      label: "Listing Type",
      type: "enum",
      required: true,
      requiredForPublish: true,
      options: [
        { value: "sale", label: "For Sale" },
        { value: "rent", label: "For Rent" }
      ],
      uiHints: {
        group: "basic",
        order: 2,
        displayAs: "radio"
      },
      searchable: true,
      filterable: true
    },
    
    // === TENURE (for sale) ===
    {
      key: "tenure",
      label: "Tenure",
      type: "enum",
      required: false,
      requiredForPublish: false,
      options: [
        { value: "freehold", label: "Freehold" },
        { value: "leasehold", label: "Leasehold" },
        { value: "malay_reserve", label: "Malay Reserve" },
        { value: "bumi_lot", label: "Bumi Lot" }
      ],
      uiHints: {
        group: "details",
        order: 10,
        displayAs: "select",
        showWhen: { listingType: "sale" }
      },
      searchable: true,
      filterable: true
    },
    
    // === SIZE ===
    {
      key: "builtUpSize",
      label: "Built-up Size",
      type: "number",
      required: false,
      requiredForPublish: true,
      unit: "sq ft",
      constraints: {
        min: 1,
        max: 1000000
      },
      uiHints: {
        group: "size",
        order: 3,
        placeholder: "e.g., 1200"
      },
      searchable: true,
      filterable: true,
      sortable: true,
      rangeFilter: true
    },
    
    {
      key: "landSize",
      label: "Land Size",
      type: "number",
      required: false,
      requiredForPublish: false,
      unit: "sq ft",
      constraints: {
        min: 1,
        max: 10000000
      },
      uiHints: {
        group: "size",
        order: 4,
        placeholder: "e.g., 2400",
        showWhen: { propertyType: ["terrace", "semi_detached", "bungalow", "land"] }
      },
      searchable: true,
      filterable: true,
      rangeFilter: true
    },
    
    // === ROOMS ===
    {
      key: "bedrooms",
      label: "Bedrooms",
      type: "number",
      required: false,
      requiredForPublish: true,
      constraints: {
        min: 0,
        max: 20
      },
      uiHints: {
        group: "rooms",
        order: 5,
        displayAs: "stepper"
      },
      searchable: true,
      filterable: true,
      sortable: true
    },
    
    {
      key: "bathrooms",
      label: "Bathrooms",
      type: "number",
      required: false,
      requiredForPublish: true,
      constraints: {
        min: 0,
        max: 20
      },
      uiHints: {
        group: "rooms",
        order: 6,
        displayAs: "stepper"
      },
      searchable: true,
      filterable: true
    },
    
    {
      key: "carParks",
      label: "Car Parks",
      type: "number",
      required: false,
      requiredForPublish: false,
      constraints: {
        min: 0,
        max: 10
      },
      uiHints: {
        group: "rooms",
        order: 7,
        displayAs: "stepper"
      },
      searchable: true,
      filterable: true
    },
    
    // === FURNISHING ===
    {
      key: "furnishing",
      label: "Furnishing",
      type: "enum",
      required: false,
      requiredForPublish: false,
      options: [
        { value: "unfurnished", label: "Unfurnished" },
        { value: "partially_furnished", label: "Partially Furnished" },
        { value: "fully_furnished", label: "Fully Furnished" }
      ],
      uiHints: {
        group: "details",
        order: 11,
        displayAs: "select"
      },
      searchable: true,
      filterable: true
    },
    
    // === FLOOR LEVEL (for high-rise) ===
    {
      key: "floorLevel",
      label: "Floor Level",
      type: "string",
      required: false,
      requiredForPublish: false,
      constraints: {
        maxLength: 20
      },
      uiHints: {
        group: "details",
        order: 12,
        placeholder: "e.g., 15, Ground, Penthouse",
        showWhen: { propertyType: ["apartment", "condominium", "studio", "penthouse", "duplex"] }
      },
      searchable: false,
      filterable: false
    },
    
    // === FACILITIES ===
    {
      key: "facilities",
      label: "Facilities",
      type: "array",
      itemType: "enum",
      required: false,
      requiredForPublish: false,
      options: [
        { value: "swimming_pool", label: "Swimming Pool" },
        { value: "gym", label: "Gymnasium" },
        { value: "playground", label: "Playground" },
        { value: "tennis_court", label: "Tennis Court" },
        { value: "security", label: "24hr Security" },
        { value: "parking", label: "Covered Parking" },
        { value: "bbq", label: "BBQ Area" },
        { value: "clubhouse", label: "Clubhouse" },
        { value: "sauna", label: "Sauna" },
        { value: "jogging_track", label: "Jogging Track" },
        { value: "mini_mart", label: "Mini Mart" },
        { value: "cafe", label: "Cafe" }
      ],
      uiHints: {
        group: "facilities",
        order: 20,
        displayAs: "checkbox-group"
      },
      searchable: true,
      filterable: true,
      facet: true
    },
    
    // === AMENITIES (NEARBY) ===
    {
      key: "nearbyAmenities",
      label: "Nearby Amenities",
      type: "array",
      itemType: "enum",
      required: false,
      requiredForPublish: false,
      options: [
        { value: "mrt", label: "MRT / LRT Station" },
        { value: "bus", label: "Bus Stop" },
        { value: "school", label: "School" },
        { value: "hospital", label: "Hospital" },
        { value: "shopping_mall", label: "Shopping Mall" },
        { value: "supermarket", label: "Supermarket" },
        { value: "park", label: "Park / Garden" },
        { value: "highway", label: "Highway Access" }
      ],
      uiHints: {
        group: "amenities",
        order: 21,
        displayAs: "checkbox-group"
      },
      searchable: true,
      filterable: true,
      facet: true
    },
    
    // === PROPERTY CONDITION ===
    {
      key: "condition",
      label: "Property Condition",
      type: "enum",
      required: false,
      requiredForPublish: false,
      options: [
        { value: "new", label: "Brand New" },
        { value: "good", label: "Good Condition" },
        { value: "renovated", label: "Renovated" },
        { value: "needs_renovation", label: "Needs Renovation" }
      ],
      uiHints: {
        group: "details",
        order: 13,
        displayAs: "select"
      },
      searchable: true,
      filterable: true
    },
    
    // === YEAR BUILT ===
    {
      key: "yearBuilt",
      label: "Year Built",
      type: "number",
      required: false,
      requiredForPublish: false,
      constraints: {
        min: 1900,
        max: 2030
      },
      uiHints: {
        group: "details",
        order: 14,
        placeholder: "e.g., 2020"
      },
      searchable: true,
      filterable: true,
      rangeFilter: true
    },
    
    // === FACING DIRECTION ===
    {
      key: "facing",
      label: "Facing",
      type: "enum",
      required: false,
      requiredForPublish: false,
      options: [
        { value: "north", label: "North" },
        { value: "south", label: "South" },
        { value: "east", label: "East" },
        { value: "west", label: "West" },
        { value: "north_east", label: "North East" },
        { value: "north_west", label: "North West" },
        { value: "south_east", label: "South East" },
        { value: "south_west", label: "South West" }
      ],
      uiHints: {
        group: "details",
        order: 15,
        displayAs: "select"
      },
      searchable: false,
      filterable: true
    },
    
    // === RENTAL TERMS (for rent) ===
    {
      key: "rentalDeposit",
      label: "Rental Deposit",
      type: "string",
      required: false,
      requiredForPublish: false,
      constraints: {
        maxLength: 50
      },
      uiHints: {
        group: "rental",
        order: 30,
        placeholder: "e.g., 2+1",
        showWhen: { listingType: "rent" }
      },
      searchable: false,
      filterable: false
    },
    
    {
      key: "minimumRentalPeriod",
      label: "Minimum Rental Period",
      type: "enum",
      required: false,
      requiredForPublish: false,
      options: [
        { value: "6_months", label: "6 Months" },
        { value: "12_months", label: "1 Year" },
        { value: "24_months", label: "2 Years" },
        { value: "flexible", label: "Flexible" }
      ],
      uiHints: {
        group: "rental",
        order: 31,
        displayAs: "select",
        showWhen: { listingType: "rent" }
      },
      searchable: false,
      filterable: true
    },
    
    // === ADDITIONAL FEATURES ===
    {
      key: "additionalFeatures",
      label: "Additional Features",
      type: "array",
      itemType: "string",
      required: false,
      requiredForPublish: false,
      uiHints: {
        group: "features",
        order: 40,
        displayAs: "tags-input",
        placeholder: "Add features like 'Corner Lot', 'Renovated Kitchen'..."
      },
      searchable: true,
      filterable: false
    }
  ],
  
  // === VALIDATION GROUPS ===
  requiredForDraft: ["propertyType", "listingType"],
  requiredForPublish: ["propertyType", "listingType", "builtUpSize", "bedrooms", "bathrooms"],
  
  // === ATTRIBUTE GROUPS ===
  groups: [
    { key: "basic", label: "Basic Information", order: 1 },
    { key: "size", label: "Size", order: 2 },
    { key: "rooms", label: "Rooms", order: 3 },
    { key: "details", label: "Property Details", order: 4 },
    { key: "facilities", label: "Facilities", order: 5 },
    { key: "amenities", label: "Nearby Amenities", order: 6 },
    { key: "rental", label: "Rental Terms", order: 7 },
    { key: "features", label: "Additional Features", order: 8 }
  ]
};
```

---

## 29.4 SEARCH MAPPING

```typescript
const searchMapping = {
  verticalType: "real_estate",
  
  filterableFields: [
    { key: "propertyType", type: "term", label: "Property Type" },
    { key: "listingType", type: "term", label: "Listing Type" },
    { key: "tenure", type: "term", label: "Tenure" },
    { key: "furnishing", type: "term", label: "Furnishing" },
    { key: "condition", type: "term", label: "Condition" },
    { key: "facing", type: "term", label: "Facing" },
    { key: "minimumRentalPeriod", type: "term", label: "Min Rental Period" },
    { key: "facilities", type: "terms", label: "Facilities" },
    { key: "nearbyAmenities", type: "terms", label: "Nearby Amenities" },
    { key: "builtUpSize", type: "range", label: "Built-up Size", unit: "sq ft" },
    { key: "landSize", type: "range", label: "Land Size", unit: "sq ft" },
    { key: "bedrooms", type: "range", label: "Bedrooms" },
    { key: "bathrooms", type: "range", label: "Bathrooms" },
    { key: "carParks", type: "range", label: "Car Parks" },
    { key: "yearBuilt", type: "range", label: "Year Built" },
    { key: "price", type: "range", label: "Price", unit: "MYR" },
    { key: "location", type: "geo", label: "Location" }
  ],
  
  sortableFields: [
    { key: "price", label: "Price" },
    { key: "builtUpSize", label: "Size" },
    { key: "bedrooms", label: "Bedrooms" },
    { key: "createdAt", label: "Date Listed" },
    { key: "updatedAt", label: "Recently Updated" }
  ],
  
  facetFields: [
    { key: "propertyType", label: "Property Type" },
    { key: "listingType", label: "For Sale / Rent" },
    { key: "bedrooms", label: "Bedrooms" },
    { key: "facilities", label: "Facilities" }
  ],
  
  defaultSort: { key: "createdAt", order: "desc" },
  
  boostFields: [
    { key: "title", boost: 2.0 },
    { key: "description", boost: 1.0 },
    { key: "location.city", boost: 1.5 }
  ]
};
```

---

## 29.5 OPENSEARCH INDEX MAPPING

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "tenantId": { "type": "keyword" },
      "vendorId": { "type": "keyword" },
      "verticalType": { "type": "keyword" },
      "status": { "type": "keyword" },
      
      "title": { 
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "description": { "type": "text", "analyzer": "standard" },
      "slug": { "type": "keyword" },
      
      "price": { "type": "float" },
      "currency": { "type": "keyword" },
      
      "location": {
        "properties": {
          "address": { "type": "text" },
          "city": { "type": "keyword" },
          "state": { "type": "keyword" },
          "country": { "type": "keyword" },
          "postalCode": { "type": "keyword" },
          "coordinates": { "type": "geo_point" }
        }
      },
      
      "attributes": {
        "properties": {
          "propertyType": { "type": "keyword" },
          "listingType": { "type": "keyword" },
          "tenure": { "type": "keyword" },
          "builtUpSize": { "type": "integer" },
          "landSize": { "type": "integer" },
          "bedrooms": { "type": "integer" },
          "bathrooms": { "type": "integer" },
          "carParks": { "type": "integer" },
          "furnishing": { "type": "keyword" },
          "condition": { "type": "keyword" },
          "yearBuilt": { "type": "integer" },
          "facing": { "type": "keyword" },
          "facilities": { "type": "keyword" },
          "nearbyAmenities": { "type": "keyword" },
          "minimumRentalPeriod": { "type": "keyword" },
          "additionalFeatures": { "type": "text" }
        }
      },
      
      "isFeatured": { "type": "boolean" },
      "featuredUntil": { "type": "date" },
      
      "publishedAt": { "type": "date" },
      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" }
    }
  }
}
```

---

## 29.6 VALIDATION RULES

```typescript
const validationRules = {
  verticalType: "real_estate",
  
  rules: [
    // Cross-field validation
    {
      id: "land_size_required_for_landed",
      condition: "propertyType in ['terrace', 'semi_detached', 'bungalow', 'land']",
      requiredFields: ["landSize"],
      errorMessage: "Land size is required for landed properties"
    },
    
    {
      id: "rental_fields_for_rent",
      condition: "listingType == 'rent'",
      recommendedFields: ["rentalDeposit", "minimumRentalPeriod"],
      warningMessage: "Consider adding rental terms for better listing quality"
    },
    
    {
      id: "tenure_for_sale",
      condition: "listingType == 'sale'",
      recommendedFields: ["tenure"],
      warningMessage: "Tenure information helps buyers make decisions"
    },
    
    // Value constraints
    {
      id: "price_positive",
      field: "price",
      rule: "price > 0",
      errorMessage: "Price must be greater than 0"
    },
    
    {
      id: "reasonable_bedrooms",
      field: "bedrooms",
      rule: "bedrooms <= 20",
      errorMessage: "Bedroom count seems unusually high"
    },
    
    {
      id: "built_up_vs_land",
      condition: "landSize != null && builtUpSize != null",
      rule: "builtUpSize <= landSize * 5",
      warningMessage: "Built-up size seems large compared to land size"
    }
  ]
};
```

---

## 29.7 DISPLAY FORMATTERS

```typescript
const displayFormatters = {
  verticalType: "real_estate",
  
  formatters: {
    price: (value, currency, attributes) => {
      const formatted = new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: currency || 'MYR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
      
      if (attributes.listingType === 'rent') {
        return `${formatted}/month`;
      }
      return formatted;
    },
    
    builtUpSize: (value) => `${value.toLocaleString()} sq ft`,
    landSize: (value) => `${value.toLocaleString()} sq ft`,
    
    propertyType: (value) => {
      const labels = {
        apartment: "Apartment",
        condominium: "Condominium",
        terrace: "Terrace House",
        semi_detached: "Semi-D",
        bungalow: "Bungalow",
        // ... etc
      };
      return labels[value] || value;
    },
    
    bedrooms: (value) => `${value} Bed`,
    bathrooms: (value) => `${value} Bath`,
    carParks: (value) => `${value} Parking`,
    
    summary: (listing) => {
      const parts = [];
      if (listing.attributes.bedrooms) parts.push(`${listing.attributes.bedrooms} Bed`);
      if (listing.attributes.bathrooms) parts.push(`${listing.attributes.bathrooms} Bath`);
      if (listing.attributes.builtUpSize) parts.push(`${listing.attributes.builtUpSize} sq ft`);
      return parts.join(' • ');
    }
  }
};
```

---

## 29.8 LISTING CARD TEMPLATE

```typescript
const listingCardConfig = {
  verticalType: "real_estate",
  
  primaryFields: [
    { key: "title", display: "title" },
    { key: "price", display: "formatted", formatter: "price" }
  ],
  
  secondaryFields: [
    { key: "location.city", display: "text" },
    { key: "attributes.propertyType", display: "badge", formatter: "propertyType" }
  ],
  
  metaFields: [
    { key: "attributes.bedrooms", icon: "bed", formatter: "bedrooms" },
    { key: "attributes.bathrooms", icon: "bath", formatter: "bathrooms" },
    { key: "attributes.builtUpSize", icon: "maximize", formatter: "builtUpSize" }
  ],
  
  badges: [
    { condition: "isFeatured", label: "Featured", color: "gold" },
    { condition: "attributes.listingType == 'rent'", label: "For Rent", color: "blue" },
    { condition: "attributes.listingType == 'sale'", label: "For Sale", color: "green" }
  ]
};
```

---

## 29.9 MODULE REGISTRATION

```typescript
// verticals/real-estate/vertical.module.ts

import { Module } from '@nestjs/common';
import { VerticalRegistryService } from '@core/verticals/vertical-registry.service';
import { 
  verticalDefinition, 
  attributeSchema, 
  searchMapping, 
  validationRules 
} from './registry';

@Module({})
export class RealEstateVerticalModule {
  constructor(private readonly registry: VerticalRegistryService) {
    this.registerVertical();
  }
  
  private registerVertical() {
    this.registry.register({
      definition: verticalDefinition,
      schemas: [attributeSchema],
      searchMapping: searchMapping,
      validationRules: validationRules
    });
  }
}
```

---

## 29.10 SAMPLE LISTING DATA

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenantId": "tenant-uuid",
  "vendorId": "vendor-uuid",
  "verticalType": "real_estate",
  "schemaVersion": "1.0",
  "title": "Modern 3BR Condo in KLCC with Stunning Twin Tower View",
  "description": "Luxurious fully-furnished condominium...",
  "slug": "modern-3br-condo-klcc-twin-tower-view",
  "price": 850000,
  "currency": "MYR",
  "priceType": "sale",
  "location": {
    "address": "Jalan Ampang, KLCC",
    "city": "Kuala Lumpur",
    "state": "Wilayah Persekutuan",
    "country": "MY",
    "postalCode": "50088",
    "lat": 3.1569,
    "lng": 101.7123
  },
  "attributes": {
    "propertyType": "condominium",
    "listingType": "sale",
    "tenure": "freehold",
    "builtUpSize": 1450,
    "bedrooms": 3,
    "bathrooms": 2,
    "carParks": 2,
    "furnishing": "fully_furnished",
    "condition": "good",
    "yearBuilt": 2018,
    "facing": "north",
    "floorLevel": "32",
    "facilities": ["swimming_pool", "gym", "security", "parking", "sauna"],
    "nearbyAmenities": ["mrt", "shopping_mall", "park"],
    "additionalFeatures": ["Corner Unit", "Renovated Kitchen", "Walk-in Wardrobe"]
  },
  "status": "PUBLISHED",
  "publishedAt": "2025-01-10T10:00:00Z",
  "isFeatured": true,
  "featuredUntil": "2025-02-10T10:00:00Z",
  "createdAt": "2025-01-08T08:30:00Z",
  "updatedAt": "2025-01-10T10:00:00Z"
}
```

---

## 29.11 USAGE AS TEMPLATE

When creating new verticals:

1. Copy this structure
2. Replace `real_estate` with new vertical type
3. Define appropriate attributes for the domain
4. Define search mappings
5. Define validation rules
6. Register the module

All verticals MUST follow this contract structure.

END OF PART 29.
