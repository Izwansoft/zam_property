// lib/mocks/handlers/verticals.ts — MSW handlers for vertical registry endpoints

import { http, HttpResponse } from "msw";
import { mockSuccessResponse, mockPaginatedResponse } from "../utils";
import type {
  VerticalDefinition,
  AttributeSchema,
  VerticalSearchMapping,
} from "@/verticals/types";

// ─── Real Estate Attribute Schema ────────────────────────────────────
const realEstateSchema: AttributeSchema = {
  version: "1.0",
  groups: [
    {
      key: "property_info",
      label: "Property Information",
      order: 1,
      description: "Basic property details",
      icon: "building",
    },
    {
      key: "specifications",
      label: "Specifications",
      order: 2,
      description: "Property specifications and measurements",
      icon: "ruler",
    },
    {
      key: "features",
      label: "Features & Amenities",
      order: 3,
      description: "Property features and available amenities",
      collapsible: true,
      defaultCollapsed: false,
      icon: "star",
    },
    {
      key: "additional",
      label: "Additional Details",
      order: 4,
      description: "Other relevant details",
      collapsible: true,
      defaultCollapsed: true,
      icon: "info",
    },
  ],
  attributes: [
    {
      key: "propertyType",
      label: "Property Type",
      type: "enum",
      required: true,
      requiredForPublish: true,
      constraints: {
        options: [
          { value: "APARTMENT", label: "Apartment / Flat" },
          { value: "CONDOMINIUM", label: "Condominium" },
          { value: "SERVICED_RESIDENCE", label: "Serviced Residence" },
          { value: "PENTHOUSE", label: "Penthouse" },
          { value: "STUDIO", label: "Studio" },
          { value: "DUPLEX", label: "Duplex" },
          { value: "TERRACE", label: "Terrace House" },
          { value: "SEMI_DETACHED", label: "Semi-Detached" },
          { value: "DETACHED", label: "Detached / Bungalow" },
          { value: "TOWNHOUSE", label: "Townhouse" },
          { value: "CLUSTER", label: "Cluster House" },
          { value: "LINK_BUNGALOW", label: "Link Bungalow" },
          { value: "COMMERCIAL", label: "Commercial" },
          { value: "SHOP_LOT", label: "Shop Lot" },
          { value: "LAND", label: "Land" },
          { value: "FACTORY", label: "Factory / Warehouse" },
        ],
      },
      defaultValue: undefined,
      ui: {
        group: "property_info",
        order: 1,
        placeholder: "Select property type",
        showInCard: true,
        showInDetail: true,
      },
    },
    {
      key: "listingType",
      label: "Listing Type",
      type: "enum",
      required: true,
      requiredForPublish: true,
      constraints: {
        options: [
          { value: "SALE", label: "For Sale" },
          { value: "RENT", label: "For Rent" },
          { value: "AUCTION", label: "Auction" },
        ],
      },
      defaultValue: undefined,
      ui: {
        group: "property_info",
        order: 2,
        placeholder: "Select listing type",
        showInCard: true,
        showInDetail: true,
      },
    },
    {
      key: "tenure",
      label: "Tenure",
      type: "enum",
      required: false,
      requiredForPublish: true,
      constraints: {
        options: [
          { value: "FREEHOLD", label: "Freehold" },
          { value: "LEASEHOLD", label: "Leasehold" },
          { value: "MALAY_RESERVE", label: "Malay Reserve" },
          { value: "BUMI_LOT", label: "Bumi Lot" },
        ],
      },
      defaultValue: undefined,
      ui: {
        group: "property_info",
        order: 3,
        placeholder: "Select tenure type",
        showInCard: true,
        showInDetail: true,
      },
    },
    {
      key: "bedrooms",
      label: "Bedrooms",
      type: "number",
      required: false,
      requiredForPublish: true,
      constraints: { min: 0, max: 20, step: 1 },
      defaultValue: undefined,
      ui: {
        group: "specifications",
        order: 1,
        placeholder: "Number of bedrooms",
        showInCard: true,
        showInDetail: true,
      },
    },
    {
      key: "bathrooms",
      label: "Bathrooms",
      type: "number",
      required: false,
      requiredForPublish: true,
      constraints: { min: 0, max: 20, step: 1 },
      defaultValue: undefined,
      ui: {
        group: "specifications",
        order: 2,
        placeholder: "Number of bathrooms",
        showInCard: true,
        showInDetail: true,
      },
    },
    {
      key: "builtUpSize",
      label: "Built-up Size",
      type: "number",
      required: false,
      requiredForPublish: true,
      constraints: { min: 100, max: 100000, step: 1 },
      defaultValue: undefined,
      ui: {
        group: "specifications",
        order: 3,
        placeholder: "e.g. 1200",
        unit: "sq ft",
        unitPosition: "suffix",
        showInCard: true,
        showInDetail: true,
      },
    },
    {
      key: "landSize",
      label: "Land Size",
      type: "number",
      required: false,
      requiredForPublish: false,
      constraints: { min: 100, max: 500000, step: 1 },
      defaultValue: undefined,
      ui: {
        group: "specifications",
        order: 4,
        placeholder: "e.g. 3000",
        unit: "sq ft",
        unitPosition: "suffix",
        showInCard: false,
        showInDetail: true,
      },
    },
    {
      key: "floors",
      label: "Number of Floors",
      type: "number",
      required: false,
      requiredForPublish: false,
      constraints: { min: 1, max: 10, step: 1 },
      defaultValue: undefined,
      ui: {
        group: "specifications",
        order: 5,
        placeholder: "e.g. 2",
        showInCard: false,
        showInDetail: true,
      },
    },
    {
      key: "carParks",
      label: "Car Parks",
      type: "number",
      required: false,
      requiredForPublish: false,
      constraints: { min: 0, max: 10, step: 1 },
      defaultValue: undefined,
      ui: {
        group: "specifications",
        order: 6,
        placeholder: "Number of car parks",
        showInCard: false,
        showInDetail: true,
      },
    },
    {
      key: "furnishing",
      label: "Furnishing",
      type: "enum",
      required: false,
      requiredForPublish: true,
      constraints: {
        options: [
          { value: "UNFURNISHED", label: "Unfurnished" },
          { value: "PARTIALLY_FURNISHED", label: "Partially Furnished" },
          { value: "FULLY_FURNISHED", label: "Fully Furnished" },
        ],
      },
      defaultValue: undefined,
      ui: {
        group: "features",
        order: 1,
        placeholder: "Select furnishing level",
        showInCard: true,
        showInDetail: true,
      },
    },
    {
      key: "facing",
      label: "Facing Direction",
      type: "enum",
      required: false,
      requiredForPublish: false,
      constraints: {
        options: [
          { value: "NORTH", label: "North" },
          { value: "SOUTH", label: "South" },
          { value: "EAST", label: "East" },
          { value: "WEST", label: "West" },
          { value: "NORTH_EAST", label: "North-East" },
          { value: "NORTH_WEST", label: "North-West" },
          { value: "SOUTH_EAST", label: "South-East" },
          { value: "SOUTH_WEST", label: "South-West" },
        ],
      },
      defaultValue: undefined,
      ui: {
        group: "features",
        order: 2,
        placeholder: "Select facing direction",
        showInCard: false,
        showInDetail: true,
      },
    },
    {
      key: "facilities",
      label: "Facilities",
      type: "array",
      required: false,
      requiredForPublish: false,
      constraints: {
        options: [
          { value: "SWIMMING_POOL", label: "Swimming Pool" },
          { value: "GYM", label: "Gymnasium" },
          { value: "PLAYGROUND", label: "Playground" },
          { value: "SECURITY_24HR", label: "24-Hour Security" },
          { value: "PARKING", label: "Covered Parking" },
          { value: "TENNIS_COURT", label: "Tennis Court" },
          { value: "BADMINTON_COURT", label: "Badminton Court" },
          { value: "JOGGING_TRACK", label: "Jogging Track" },
          { value: "SAUNA", label: "Sauna" },
          { value: "MINI_MART", label: "Mini Mart" },
          { value: "BBQ_AREA", label: "BBQ Area" },
          { value: "FUNCTION_ROOM", label: "Function Room" },
        ],
      },
      defaultValue: [],
      ui: {
        group: "features",
        order: 3,
        placeholder: "Select facilities",
        colSpan: 2,
        showInCard: false,
        showInDetail: true,
      },
    },
    {
      key: "amenities",
      label: "Nearby Amenities",
      type: "array",
      required: false,
      requiredForPublish: false,
      constraints: {
        options: [
          { value: "LRT", label: "LRT Station" },
          { value: "MRT", label: "MRT Station" },
          { value: "BUS", label: "Bus Stop" },
          { value: "SCHOOL", label: "School" },
          { value: "HOSPITAL", label: "Hospital" },
          { value: "SHOPPING_MALL", label: "Shopping Mall" },
          { value: "MOSQUE", label: "Mosque" },
          { value: "HIGHWAY", label: "Highway Access" },
          { value: "PARK", label: "Park / Recreation" },
        ],
      },
      defaultValue: [],
      ui: {
        group: "features",
        order: 4,
        placeholder: "Select nearby amenities",
        colSpan: 2,
        showInCard: false,
        showInDetail: true,
      },
    },
    {
      key: "yearBuilt",
      label: "Year Built",
      type: "number",
      required: false,
      requiredForPublish: false,
      constraints: { min: 1950, max: 2030, step: 1 },
      defaultValue: undefined,
      ui: {
        group: "additional",
        order: 1,
        placeholder: "e.g. 2020",
        showInCard: false,
        showInDetail: true,
      },
    },
    {
      key: "titleType",
      label: "Title Type",
      type: "enum",
      required: false,
      requiredForPublish: false,
      constraints: {
        options: [
          { value: "INDIVIDUAL", label: "Individual Title" },
          { value: "STRATA", label: "Strata Title" },
          { value: "MASTER", label: "Master Title" },
        ],
      },
      defaultValue: undefined,
      ui: {
        group: "additional",
        order: 2,
        placeholder: "Select title type",
        showInCard: false,
        showInDetail: true,
      },
    },
    {
      key: "occupancy",
      label: "Occupancy",
      type: "enum",
      required: false,
      requiredForPublish: false,
      constraints: {
        options: [
          { value: "VACANT", label: "Vacant" },
          { value: "PARTNERED", label: "partnered" },
          { value: "OWNER_OCCUPIED", label: "Owner Occupied" },
        ],
      },
      defaultValue: undefined,
      ui: {
        group: "additional",
        order: 3,
        placeholder: "Select occupancy status",
        showInCard: false,
        showInDetail: true,
      },
    },
  ],
};

// ─── Real Estate Search Mapping ──────────────────────────────────────
const realEstateSearchMapping: VerticalSearchMapping = {
  filterableFields: [
    {
      key: "propertyType",
      label: "Property Type",
      type: "enum",
      options: realEstateSchema.attributes
        .find((a) => a.key === "propertyType")!
        .constraints.options!,
      multiSelect: true,
      order: 1,
      group: "Property",
    },
    {
      key: "listingType",
      label: "Listing Type",
      type: "enum",
      options: realEstateSchema.attributes
        .find((a) => a.key === "listingType")!
        .constraints.options!,
      multiSelect: false,
      order: 2,
      group: "Property",
    },
    {
      key: "tenure",
      label: "Tenure",
      type: "enum",
      options: realEstateSchema.attributes
        .find((a) => a.key === "tenure")!
        .constraints.options!,
      multiSelect: true,
      order: 3,
      group: "Property",
    },
    {
      key: "furnishing",
      label: "Furnishing",
      type: "enum",
      options: realEstateSchema.attributes
        .find((a) => a.key === "furnishing")!
        .constraints.options!,
      multiSelect: false,
      order: 4,
      group: "Features",
    },
  ],
  sortableFields: [
    { key: "price", label: "Price", defaultDirection: "asc" },
    { key: "createdAt", label: "Date Listed", defaultDirection: "desc" },
    { key: "builtUpSize", label: "Built-up Size", defaultDirection: "desc" },
  ],
  rangeFields: [
    {
      key: "price",
      label: "Price",
      min: 0,
      max: 10000000,
      step: 10000,
      unit: "RM",
      unitPosition: "prefix",
      presets: [
        { label: "< RM300K", min: 0, max: 300000 },
        { label: "RM300K–500K", min: 300000, max: 500000 },
        { label: "RM500K–1M", min: 500000, max: 1000000 },
        { label: "RM1M–2M", min: 1000000, max: 2000000 },
        { label: "> RM2M", min: 2000000, max: null },
      ],
      minParamName: "priceMin",
      maxParamName: "priceMax",
      order: 1,
    },
    {
      key: "builtUpSize",
      label: "Built-up Size",
      min: 0,
      max: 50000,
      step: 100,
      unit: "sq ft",
      unitPosition: "suffix",
      presets: [
        { label: "< 800", min: 0, max: 800 },
        { label: "800–1,200", min: 800, max: 1200 },
        { label: "1,200–2,000", min: 1200, max: 2000 },
        { label: "> 2,000", min: 2000, max: null },
      ],
      minParamName: "builtUpSizeMin",
      maxParamName: "builtUpSizeMax",
      order: 2,
    },
    {
      key: "bedrooms",
      label: "Bedrooms",
      min: 0,
      max: 10,
      step: 1,
      minParamName: "bedroomsMin",
      maxParamName: "bedroomsMax",
      order: 3,
    },
  ],
  facetFields: [
    {
      key: "propertyType",
      label: "Property Type",
      order: 1,
      showCounts: true,
      maxValues: 10,
    },
    {
      key: "furnishing",
      label: "Furnishing",
      order: 2,
      showCounts: true,
    },
  ],
};

// ─── Vertical Definitions ────────────────────────────────────────────
const verticalDefinitions: VerticalDefinition[] = [
  {
    id: "vert-001",
    type: "REAL_ESTATE",
    name: "Real Estate",
    description: "Properties for sale and rent — residential and commercial",
    icon: "building",
    color: "#3B82F6",
    attributeSchema: realEstateSchema,
    validationRules: {
      draft: {
        required: ["propertyType", "listingType"],
      },
      publish: {
        required: [
          "propertyType",
          "listingType",
          "tenure",
          "bedrooms",
          "bathrooms",
          "builtUpSize",
          "furnishing",
        ],
        conditionalRequired: [
          {
            when: "propertyType",
            is: ["LAND"],
            then: ["landSize"],
          },
        ],
      },
    },
    searchMapping: realEstateSearchMapping,
    supportedStatuses: ["DRAFT", "PUBLISHED", "EXPIRED", "ARCHIVED"],
    displayMetadata: {
      cardLayout: "standard",
      primaryFields: ["propertyType", "bedrooms", "bathrooms", "builtUpSize"],
      secondaryFields: ["tenure", "furnishing"],
      iconName: "building",
      badgeColor: "blue",
    },
    schemaVersion: "1.0",
    isActive: true,
    isCore: true,
    maintenanceMode: false,
    maintenanceStartAt: null,
    maintenanceEndAt: null,
    maintenanceMessage: null,
    maintenanceScheduledBy: null,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  // N1: Second vertical — Automotive
  {
    id: "vert-002",
    type: "AUTOMOTIVE",
    name: "Automotive",
    description: "Cars, motorcycles, and commercial vehicles for sale",
    icon: "car",
    color: "#EF4444",
    attributeSchema: {
      version: "1.0",
      groups: [
        {
          key: "vehicle_info",
          label: "Vehicle Information",
          order: 1,
          description: "Basic vehicle details",
          icon: "car",
        },
        {
          key: "specifications",
          label: "Specifications",
          order: 2,
          description: "Vehicle specifications",
          icon: "gauge",
        },
      ],
      attributes: [
        {
          key: "vehicleType",
          label: "Vehicle Type",
          type: "enum",
          required: true,
          requiredForPublish: true,
          constraints: {
            options: [
              { value: "SEDAN", label: "Sedan" },
              { value: "SUV", label: "SUV" },
              { value: "HATCHBACK", label: "Hatchback" },
              { value: "MPV", label: "MPV" },
              { value: "PICKUP", label: "Pickup" },
              { value: "COUPE", label: "Coupe" },
              { value: "VAN", label: "Van" },
              { value: "MOTORCYCLE", label: "Motorcycle" },
            ],
          },
          defaultValue: undefined,
          ui: {
            group: "vehicle_info",
            order: 1,
            placeholder: "Select vehicle type",
            showInCard: true,
            showInDetail: true,
          },
        },
        {
          key: "make",
          label: "Make",
          type: "text",
          required: true,
          requiredForPublish: true,
          constraints: { minLength: 1, maxLength: 100 },
          defaultValue: undefined,
          ui: {
            group: "vehicle_info",
            order: 2,
            placeholder: "e.g. Toyota",
            showInCard: true,
            showInDetail: true,
          },
        },
        {
          key: "model",
          label: "Model",
          type: "text",
          required: true,
          requiredForPublish: true,
          constraints: { minLength: 1, maxLength: 100 },
          defaultValue: undefined,
          ui: {
            group: "vehicle_info",
            order: 3,
            placeholder: "e.g. Camry",
            showInCard: true,
            showInDetail: true,
          },
        },
        {
          key: "year",
          label: "Year",
          type: "number",
          required: true,
          requiredForPublish: true,
          constraints: { min: 1990, max: 2030, step: 1 },
          defaultValue: undefined,
          ui: {
            group: "vehicle_info",
            order: 4,
            placeholder: "e.g. 2023",
            showInCard: true,
            showInDetail: true,
          },
        },
        {
          key: "mileage",
          label: "Mileage (km)",
          type: "number",
          required: false,
          requiredForPublish: true,
          constraints: { min: 0, max: 1000000, step: 1 },
          defaultValue: undefined,
          ui: {
            group: "specifications",
            order: 1,
            placeholder: "e.g. 50000",
            unit: "km",
            unitPosition: "suffix",
            showInCard: true,
            showInDetail: true,
          },
        },
        {
          key: "transmission",
          label: "Transmission",
          type: "enum",
          required: false,
          requiredForPublish: true,
          constraints: {
            options: [
              { value: "AUTOMATIC", label: "Automatic" },
              { value: "MANUAL", label: "Manual" },
              { value: "CVT", label: "CVT" },
            ],
          },
          defaultValue: undefined,
          ui: {
            group: "specifications",
            order: 2,
            placeholder: "Select transmission",
            showInCard: true,
            showInDetail: true,
          },
        },
      ],
    } as AttributeSchema,
    validationRules: {
      draft: { required: ["vehicleType", "make", "model"] },
      publish: {
        required: ["vehicleType", "make", "model", "year", "mileage", "transmission"],
      },
    },
    searchMapping: {
      filterableFields: [
        {
          key: "vehicleType",
          label: "Vehicle Type",
          type: "enum",
          options: [
            { value: "SEDAN", label: "Sedan" },
            { value: "SUV", label: "SUV" },
            { value: "HATCHBACK", label: "Hatchback" },
            { value: "MPV", label: "MPV" },
          ],
          multiSelect: true,
          order: 1,
          group: "Vehicle",
        },
      ],
      sortableFields: [
        { key: "price", label: "Price", defaultDirection: "asc" },
        { key: "createdAt", label: "Date Listed", defaultDirection: "desc" },
        { key: "year", label: "Year", defaultDirection: "desc" },
      ],
      rangeFields: [
        {
          key: "price",
          label: "Price",
          min: 0,
          max: 1000000,
          step: 5000,
          unit: "RM",
          unitPosition: "prefix",
          presets: [
            { label: "< RM30K", min: 0, max: 30000 },
            { label: "RM30K–80K", min: 30000, max: 80000 },
            { label: "RM80K–150K", min: 80000, max: 150000 },
            { label: "> RM150K", min: 150000, max: null },
          ],
          minParamName: "priceMin",
          maxParamName: "priceMax",
          order: 1,
        },
      ],
      facetFields: [
        { key: "vehicleType", label: "Vehicle Type", order: 1, showCounts: true },
      ],
    } as VerticalSearchMapping,
    supportedStatuses: ["DRAFT", "PUBLISHED", "EXPIRED", "ARCHIVED"],
    displayMetadata: {
      cardLayout: "standard",
      primaryFields: ["vehicleType", "make", "model", "year"],
      secondaryFields: ["mileage", "transmission"],
      iconName: "car",
      badgeColor: "red",
    },
    schemaVersion: "1.0",
    isActive: true,
    isCore: false,
    maintenanceMode: false,
    maintenanceStartAt: null,
    maintenanceEndAt: null,
    maintenanceMessage: null,
    maintenanceScheduledBy: null,
    createdAt: "2025-01-15T00:00:00.000Z",
    updatedAt: "2025-01-15T00:00:00.000Z",
  },
];

// ─── MSW Handlers ────────────────────────────────────────────────────

// ─── Partner Vertical Mock Data ──────────────────────────────────────
// Simulates enabled verticals for the mock partner (partner-001).
interface MockPartnerVertical {
  id: string;
  partnerId: string;
  verticalType: string;
  isEnabled: boolean;
  configOverrides: Record<string, unknown>;
  customFields: Array<Record<string, unknown>>;
  listingLimit: number;
  listingCount: number;
  enabledAt: string;
  updatedAt: string;
  vertical: { type: string; name: string; icon: string; color: string };
}

const mockPartnerVerticals: MockPartnerVertical[] = [
  {
    id: "pv-001",
    partnerId: "partner-001",
    verticalType: "REAL_ESTATE",
    isEnabled: true,
    configOverrides: {},
    customFields: [],
    listingLimit: 1000,
    listingCount: 42,
    enabledAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    vertical: { type: "REAL_ESTATE", name: "Real Estate", icon: "building", color: "#3B82F6" },
  },
  {
    id: "pv-002",
    partnerId: "partner-001",
    verticalType: "AUTOMOTIVE",
    isEnabled: true,
    configOverrides: {},
    customFields: [],
    listingLimit: 500,
    listingCount: 8,
    enabledAt: "2025-01-15T00:00:00.000Z",
    updatedAt: "2025-01-15T00:00:00.000Z",
    vertical: { type: "AUTOMOTIVE", name: "Automotive", icon: "car", color: "#EF4444" },
  },
];

export const verticalHandlers = [
  // ─── Definitions Endpoints (used by platform admin UI) ─────────────

  // GET /api/v1/verticals/definitions/health — Runtime health check
  http.get("*/api/v1/verticals/definitions/health", () => {
    // Simulates the backend vertical registry — only Real Estate is implemented
    const healthResponse = {
      verticals: {
        real_estate: {
          type: "real_estate",
          name: "Real Estate",
          version: "1.0",
          status: "READY",
          registeredAt: "2026-01-01T00:00:00.000Z",
          features: ["search", "filters", "validation", "attribute-schema"],
        },
      },
      implementedCount: 1,
      implementedTypes: ["real_estate"],
      timestamp: new Date().toISOString(),
    };
    return HttpResponse.json(mockSuccessResponse(healthResponse));
  }),

  // GET /api/v1/verticals/definitions — List all vertical definitions (paginated)
  http.get("*/api/v1/verticals/definitions", ({ request }) => {
    const url = new URL(request.url);
    const pathname = url.pathname;
    // Skip if path has more segments (e.g. /definitions/active or /definitions/:id)
    if (pathname.endsWith("/active") || /\/definitions\/[^/]+/.test(pathname.replace("/definitions", ""))) {
      return undefined as never;
    }
    return HttpResponse.json(
      mockPaginatedResponse(verticalDefinitions, 1, 20, verticalDefinitions.length)
    );
  }),

  // GET /api/v1/verticals/definitions/active — Active definitions only
  http.get("*/api/v1/verticals/definitions/active", () => {
    const active = verticalDefinitions.filter((v) => v.isActive);
    return HttpResponse.json(mockSuccessResponse(active));
  }),

  // GET /api/v1/verticals/definitions/:id — Get definition by ID
  http.get("*/api/v1/verticals/definitions/:id", ({ params }) => {
    const id = params.id as string;
    if (id === "active") return undefined as never;
    const vertical = verticalDefinitions.find((v) => v.id === id);
    if (!vertical) {
      return HttpResponse.json(
        {
          error: { code: "NOT_FOUND", message: `Vertical definition ${id} not found` },
          meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }
    return HttpResponse.json(mockSuccessResponse(vertical));
  }),

  // POST /api/v1/verticals/definitions — Create a new vertical definition
  http.post("*/api/v1/verticals/definitions", async ({ request }) => {
    const body = (await request.json()) as {
      type: string;
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      attributeSchema?: Record<string, unknown>;
      validationRules?: Record<string, unknown>;
      searchMapping?: Record<string, unknown>;
      isActive?: boolean;
      isCore?: boolean;
    };

    // Check duplicate
    const existing = verticalDefinitions.find((v) => v.type === body.type);
    if (existing) {
      return HttpResponse.json(
        {
          error: { code: "DUPLICATE", message: `Vertical type ${body.type} already exists` },
          meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
        },
        { status: 409 }
      );
    }

    const newDef: VerticalDefinition = {
      id: `vert-${String(verticalDefinitions.length + 1).padStart(3, "0")}`,
      type: body.type,
      name: body.name,
      description: body.description ?? null,
      icon: body.icon ?? null,
      color: body.color ?? null,
      attributeSchema: (body.attributeSchema ?? { version: "1.0", groups: [], attributes: [] }) as unknown as AttributeSchema,
      validationRules: body.validationRules ?? {},
      searchMapping: (body.searchMapping ?? { filterableFields: [], sortableFields: [], rangeFields: [], facetFields: [] }) as unknown as VerticalSearchMapping,
      supportedStatuses: ["DRAFT", "PUBLISHED", "EXPIRED", "ARCHIVED"],
      displayMetadata: null,
      schemaVersion: "1.0",
      isActive: body.isActive ?? true,
      isCore: body.isCore ?? false,
      maintenanceMode: false,
      maintenanceStartAt: null,
      maintenanceEndAt: null,
      maintenanceMessage: null,
      maintenanceScheduledBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    verticalDefinitions.push(newDef);
    return HttpResponse.json(mockSuccessResponse(newDef), { status: 201 });
  }),

  // POST /api/v1/verticals/definitions/:id/activate
  http.post("*/api/v1/verticals/definitions/:id/activate", ({ params }) => {
    const id = params.id as string;
    const vertical = verticalDefinitions.find((v) => v.id === id);
    if (!vertical) {
      return HttpResponse.json(
        {
          error: { code: "NOT_FOUND", message: "Vertical not found" },
          meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }
    vertical.isActive = true;
    vertical.updatedAt = new Date().toISOString();
    return HttpResponse.json(mockSuccessResponse(vertical));
  }),

  // POST /api/v1/verticals/definitions/:id/deactivate
  http.post("*/api/v1/verticals/definitions/:id/deactivate", ({ params }) => {
    const id = params.id as string;
    const vertical = verticalDefinitions.find((v) => v.id === id);
    if (!vertical) {
      return HttpResponse.json(
        {
          error: { code: "NOT_FOUND", message: "Vertical not found" },
          meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }
    vertical.isActive = false;
    vertical.updatedAt = new Date().toISOString();
    return HttpResponse.json(mockSuccessResponse(vertical));
  }),

  // PATCH /api/v1/verticals/definitions/:id/maintenance — Set maintenance mode
  http.patch("*/api/v1/verticals/definitions/:id/maintenance", async ({ params, request }) => {
    const id = params.id as string;
    const vertical = verticalDefinitions.find((v) => v.id === id);
    if (!vertical) {
      return HttpResponse.json(
        {
          error: { code: "NOT_FOUND", message: "Vertical not found" },
          meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      enabled: boolean;
      startAt?: string;
      endAt?: string;
      message?: string;
    };

    vertical.maintenanceMode = body.enabled;
    vertical.maintenanceStartAt = body.enabled ? (body.startAt ?? new Date().toISOString()) : null;
    vertical.maintenanceEndAt = body.enabled ? (body.endAt ?? null) : null;
    vertical.maintenanceMessage = body.enabled ? (body.message ?? null) : null;
    vertical.maintenanceScheduledBy = body.enabled ? "mock-user-001" : null;
    vertical.updatedAt = new Date().toISOString();

    return HttpResponse.json(mockSuccessResponse(vertical));
  }),

  // GET /api/v1/verticals/definitions/maintenance/:type — Get maintenance status
  http.get("*/api/v1/verticals/definitions/maintenance/:type", ({ params }) => {
    const type = params.type as string;
    const vertical = verticalDefinitions.find(
      (v) => v.type.toLowerCase() === type.toLowerCase()
    );
    if (!vertical) {
      return HttpResponse.json(
        {
          error: { code: "NOT_FOUND", message: "Vertical not found" },
          meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    const now = new Date();
    const endAt = vertical.maintenanceEndAt ? new Date(vertical.maintenanceEndAt) : null;
    const estimatedRemainingMs = endAt ? Math.max(0, endAt.getTime() - now.getTime()) : undefined;

    return HttpResponse.json(mockSuccessResponse({
      type: vertical.type,
      name: vertical.name,
      isUnderMaintenance: vertical.maintenanceMode ?? false,
      message: vertical.maintenanceMessage,
      startAt: vertical.maintenanceStartAt,
      endAt: vertical.maintenanceEndAt,
      estimatedRemainingMs,
    }));
  }),

  // GET /api/v1/verticals/definitions/maintenance — Get all maintenance statuses
  http.get("*/api/v1/verticals/definitions/maintenance", () => {
    const now = new Date();
    const statuses = verticalDefinitions.map((v) => {
      const endAt = v.maintenanceEndAt ? new Date(v.maintenanceEndAt) : null;
      const estimatedRemainingMs = endAt ? Math.max(0, endAt.getTime() - now.getTime()) : undefined;

      return {
        type: v.type,
        name: v.name,
        isUnderMaintenance: v.maintenanceMode ?? false,
        message: v.maintenanceMessage,
        startAt: v.maintenanceStartAt,
        endAt: v.maintenanceEndAt,
        estimatedRemainingMs,
      };
    });
    return HttpResponse.json(mockSuccessResponse(statuses));
  }),

  // DELETE /api/v1/verticals/definitions/:id
  http.delete("*/api/v1/verticals/definitions/:id", ({ params }) => {
    const id = params.id as string;
    const idx = verticalDefinitions.findIndex((v) => v.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        {
          error: { code: "NOT_FOUND", message: "Vertical not found" },
          meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }
    verticalDefinitions.splice(idx, 1);
    return HttpResponse.json(mockSuccessResponse({ success: true }));
  }),

  // ─── Legacy Vertical Endpoints (used by listing flow, search, etc.) ──

  // GET /api/v1/verticals — List all verticals
  http.get("*/api/v1/verticals", () => {
    return HttpResponse.json(
      mockSuccessResponse(verticalDefinitions)
    );
  }),

  // GET /api/v1/verticals/:type — Get vertical by type
  http.get("*/api/v1/verticals/:type", ({ params }) => {
    const type = params.type as string;

    // Do NOT match paths that have more segments (e.g. /verticals/partner/...)
    // Those are handled by separate handlers below
    if (type === "partner") return undefined as never;

    const vertical = verticalDefinitions.find(
      (v) => v.type === type.toUpperCase()
    );

    if (!vertical) {
      return HttpResponse.json(
        {
          error: { code: "VERTICAL_NOT_FOUND", message: `Vertical ${type} not found` },
          meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(mockSuccessResponse(vertical));
  }),

  // GET /api/v1/verticals/:type/schema — Get schema for a vertical
  http.get("*/api/v1/verticals/:type/schema", ({ params }) => {
    const type = params.type as string;
    const vertical = verticalDefinitions.find(
      (v) => v.type === type.toUpperCase()
    );

    if (!vertical) {
      return HttpResponse.json(
        {
          error: {
            code: "VERTICAL_NOT_FOUND",
            message: `Vertical schema for ${type} not found`,
          },
          meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(
      mockSuccessResponse(vertical.attributeSchema)
    );
  }),

  // ─── Partner Vertical Endpoints ──────────────────────────────────

  // GET /api/v1/verticals/partner — List partner verticals (paginated)
  http.get("*/api/v1/verticals/partner", ({ request }) => {
    const url = new URL(request.url);
    // If the path has more segments beyond /partner (e.g. /partner/enabled), skip
    const pathname = url.pathname;
    if (pathname.includes("/partner/")) return undefined as never;

    const isEnabled = url.searchParams.get("isEnabled");
    let items = [...mockPartnerVerticals];

    if (isEnabled === "true") {
      items = items.filter((v) => v.isEnabled);
    } else if (isEnabled === "false") {
      items = items.filter((v) => !v.isEnabled);
    }

    return HttpResponse.json(
      mockPaginatedResponse(items, 1, 20, items.length)
    );
  }),

  // GET /api/v1/verticals/partner/enabled — Only enabled partner verticals (non-paginated)
  http.get("*/api/v1/verticals/partner/enabled", () => {
    const enabled = mockPartnerVerticals.filter((v) => v.isEnabled);
    return HttpResponse.json(mockSuccessResponse(enabled));
  }),

  // POST /api/v1/verticals/partner/enable — Enable a vertical for the partner
  http.post("*/api/v1/verticals/partner/enable", async ({ request }) => {
    const body = (await request.json()) as {
      verticalType: string;
      configOverrides?: Record<string, unknown>;
      customFields?: Array<Record<string, unknown>>;
      listingLimit?: number;
    };

    // Check if already enabled
    const existing = mockPartnerVerticals.find(
      (v) => v.verticalType === body.verticalType
    );
    if (existing && existing.isEnabled) {
      return HttpResponse.json(
        {
          error: { code: "ALREADY_ENABLED", message: `Vertical ${body.verticalType} is already enabled` },
          meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
        },
        { status: 409 }
      );
    }

    // Find the definition
    const definition = verticalDefinitions.find(
      (d) => d.type === body.verticalType
    );
    if (!definition) {
      return HttpResponse.json(
        {
          error: { code: "VERTICAL_NOT_FOUND", message: `Vertical ${body.verticalType} not found` },
          meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    if (existing) {
      // Re-enable
      existing.isEnabled = true;
      existing.updatedAt = new Date().toISOString();
      return HttpResponse.json(mockSuccessResponse(existing), { status: 200 });
    }

    const newPv: MockPartnerVertical = {
      id: `pv-${String(mockPartnerVerticals.length + 1).padStart(3, "0")}`,
      partnerId: "partner-001",
      verticalType: body.verticalType,
      isEnabled: true,
      configOverrides: body.configOverrides ?? {},
      customFields: body.customFields ?? [],
      listingLimit: body.listingLimit ?? 500,
      listingCount: 0,
      enabledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vertical: {
        type: definition.type,
        name: definition.name,
        icon: definition.icon ?? "layers",
        color: definition.color ?? "#6B7280",
      },
    };
    mockPartnerVerticals.push(newPv);

    return HttpResponse.json(mockSuccessResponse(newPv), { status: 201 });
  }),

  // DELETE /api/v1/verticals/partner/disable/:type — Disable a vertical
  http.delete("*/api/v1/verticals/partner/disable/:type", ({ params }) => {
    const type = params.type as string;
    const pv = mockPartnerVerticals.find(
      (v) => v.verticalType === type.toUpperCase()
    );

    if (!pv) {
      return HttpResponse.json(
        {
          error: { code: "NOT_FOUND", message: `Partner vertical ${type} not found` },
          meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    pv.isEnabled = false;
    pv.updatedAt = new Date().toISOString();

    return HttpResponse.json(mockSuccessResponse({ success: true }));
  }),

  // PATCH /api/v1/verticals/partner/:id — Update partner vertical config
  http.patch("*/api/v1/verticals/partner/:id", async ({ params, request }) => {
    const id = params.id as string;
    const pv = mockPartnerVerticals.find((v) => v.id === id);

    if (!pv) {
      return HttpResponse.json(
        {
          error: { code: "NOT_FOUND", message: "Partner vertical not found" },
          meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
        },
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      configOverrides?: Record<string, unknown>;
      customFields?: Array<Record<string, unknown>>;
      listingLimit?: number;
      isEnabled?: boolean;
    };

    if (body.configOverrides !== undefined) pv.configOverrides = body.configOverrides;
    if (body.customFields !== undefined) pv.customFields = body.customFields;
    if (body.listingLimit !== undefined) pv.listingLimit = body.listingLimit;
    if (body.isEnabled !== undefined) pv.isEnabled = body.isEnabled;
    pv.updatedAt = new Date().toISOString();

    return HttpResponse.json(mockSuccessResponse(pv));
  }),
];
