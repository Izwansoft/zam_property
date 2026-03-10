// verticals/real-estate/schema.ts — Real Estate attribute schema definition
// Conforms to the AttributeSchema type from verticals/types

import type { AttributeSchema } from "../types";

/**
 * Complete attribute schema for the Real Estate vertical.
 * Matches backend Part 29 specification.
 *
 * 20 attributes across 9 groups.
 * Malaysian market: MYR currency, Malay Reserve / Bumi Lot tenure.
 */
export const realEstateSchema: AttributeSchema = {
  version: "1.0",

  groups: [
    { key: "basic", label: "Basic Information", order: 1 },
    { key: "size", label: "Size & Dimensions", order: 2 },
    { key: "rooms", label: "Rooms & Parking", order: 3 },
    { key: "details", label: "Property Details", order: 4 },
    { key: "project", label: "Project & Developer", order: 5, collapsible: true, defaultCollapsed: true },
    { key: "features", label: "Additional Features", order: 6, collapsible: true, defaultCollapsed: true },
    { key: "facilities", label: "Facilities", order: 7, collapsible: true, defaultCollapsed: true },
    { key: "amenities", label: "Nearby Amenities", order: 8, collapsible: true, defaultCollapsed: true },
    { key: "rental", label: "Rental Terms", order: 9, collapsible: true },
    { key: "reference", label: "Reference", order: 10, collapsible: true, defaultCollapsed: true },
  ],

  attributes: [
    // ─── Group: basic ──────────────────────────────────────────────
    {
      key: "propertyType",
      label: "Property Type",
      type: "enum",
      required: true,
      requiredForPublish: true,
      constraints: {
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
          { value: "other", label: "Other" },
        ],
      },
      ui: {
        group: "basic",
        order: 1,
        placeholder: "Select property type",
        showInCard: true,
        showInDetail: true,
        colSpan: 2,
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
          { value: "sale", label: "For Sale" },
          { value: "rent", label: "For Rent" },
        ],
      },
      ui: {
        group: "basic",
        order: 2,
        placeholder: "Select listing type",
        showInCard: true,
        showInDetail: true,
        colSpan: 2,
      },
    },

    // ─── Group: size ───────────────────────────────────────────────
    {
      key: "builtUpSize",
      label: "Built-up Size",
      type: "number",
      required: false,
      requiredForPublish: true,
      constraints: { min: 1, max: 1_000_000 },
      ui: {
        group: "size",
        order: 1,
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
      constraints: { min: 1, max: 10_000_000 },
      ui: {
        group: "size",
        order: 2,
        unit: "sq ft",
        unitPosition: "suffix",
        showInDetail: true,
      },
    },

    // ─── Group: rooms ──────────────────────────────────────────────
    {
      key: "bedrooms",
      label: "Bedrooms",
      type: "number",
      required: false,
      requiredForPublish: true,
      constraints: { min: 0, max: 20, step: 1 },
      ui: {
        group: "rooms",
        order: 1,
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
      ui: {
        group: "rooms",
        order: 2,
        showInCard: true,
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
      ui: {
        group: "rooms",
        order: 3,
        showInDetail: true,
      },
    },

    // ─── Group: details ────────────────────────────────────────────
    {
      key: "tenure",
      label: "Tenure",
      type: "enum",
      required: false,
      requiredForPublish: false,
      constraints: {
        options: [
          { value: "freehold", label: "Freehold" },
          { value: "leasehold", label: "Leasehold" },
          { value: "malay_reserve", label: "Malay Reserve" },
          { value: "bumi_lot", label: "Bumi Lot" },
        ],
      },
      ui: {
        group: "details",
        order: 1,
        helpText: "Property ownership type",
        showInDetail: true,
      },
    },
    {
      key: "furnishing",
      label: "Furnishing",
      type: "enum",
      required: false,
      requiredForPublish: false,
      constraints: {
        options: [
          { value: "unfurnished", label: "Unfurnished" },
          { value: "partially_furnished", label: "Partially Furnished" },
          { value: "fully_furnished", label: "Fully Furnished" },
        ],
      },
      ui: {
        group: "details",
        order: 2,
        showInCard: true,
        showInDetail: true,
      },
    },
    {
      key: "condition",
      label: "Property Condition",
      type: "enum",
      required: false,
      requiredForPublish: false,
      constraints: {
        options: [
          { value: "new", label: "Brand New" },
          { value: "good", label: "Good Condition" },
          { value: "renovated", label: "Renovated" },
          { value: "needs_renovation", label: "Needs Renovation" },
        ],
      },
      ui: {
        group: "details",
        order: 3,
        showInDetail: true,
      },
    },
    {
      key: "floorLevel",
      label: "Floor Level",
      type: "string",
      required: false,
      requiredForPublish: false,
      constraints: { max: 20 },
      ui: {
        group: "details",
        order: 4,
        placeholder: "e.g., 15, Ground, Penthouse",
        showInDetail: true,
      },
    },
    {
      key: "yearBuilt",
      label: "Year Built",
      type: "number",
      required: false,
      requiredForPublish: false,
      constraints: { min: 1900, max: new Date().getFullYear() + 5 },
      ui: {
        group: "details",
        order: 5,
        placeholder: "e.g., 2020",
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
          { value: "strata", label: "Strata" },
          { value: "individual", label: "Individual" },
          { value: "master", label: "Master Title" },
        ],
      },
      ui: {
        group: "details",
        order: 6,
        helpText: "Type of title (strata for high-rise, individual for landed)",
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
          { value: "owner_occupied", label: "Owner Occupied" },
          { value: "tenanted", label: "Tenanted" },
          { value: "vacant", label: "Vacant" },
        ],
      },
      ui: {
        group: "details",
        order: 7,
        showInDetail: true,
      },
    },
    {
      key: "maintenanceFee",
      label: "Maintenance Fee",
      type: "number",
      required: false,
      requiredForPublish: false,
      constraints: { min: 0, max: 100_000 },
      ui: {
        group: "details",
        order: 8,
        unit: "RM/month",
        unitPosition: "suffix",
        showInDetail: true,
      },
    },

    // ─── Group: project ────────────────────────────────────────────
    {
      key: "projectName",
      label: "Project Name",
      type: "string",
      required: false,
      requiredForPublish: false,
      constraints: { max: 100 },
      ui: {
        group: "project",
        order: 1,
        placeholder: "e.g., The Astaka",
        showInDetail: true,
      },
    },
    {
      key: "developerName",
      label: "Developer",
      type: "string",
      required: false,
      requiredForPublish: false,
      constraints: { max: 100 },
      ui: {
        group: "project",
        order: 2,
        placeholder: "e.g., SP Setia",
        showInDetail: true,
      },
    },

    // ─── Group: features ───────────────────────────────────────────
    {
      key: "facing",
      label: "Facing",
      type: "enum",
      required: false,
      requiredForPublish: false,
      constraints: {
        options: [
          { value: "north", label: "North" },
          { value: "south", label: "South" },
          { value: "east", label: "East" },
          { value: "west", label: "West" },
          { value: "north_east", label: "North East" },
          { value: "north_west", label: "North West" },
          { value: "south_east", label: "South East" },
          { value: "south_west", label: "South West" },
        ],
      },
      ui: {
        group: "features",
        order: 1,
        showInDetail: true,
      },
    },
    {
      key: "totalFloors",
      label: "Total Floors",
      type: "number",
      required: false,
      requiredForPublish: false,
      constraints: { min: 1, max: 200 },
      ui: {
        group: "features",
        order: 2,
        showInDetail: true,
      },
    },

    // ─── Group: facilities ─────────────────────────────────────────
    {
      key: "facilities",
      label: "Facilities",
      type: "array",
      required: false,
      requiredForPublish: false,
      constraints: {
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
          { value: "cafe", label: "Cafe" },
        ],
      },
      ui: {
        group: "facilities",
        order: 1,
        colSpan: 2,
        showInDetail: true,
      },
    },

    // ─── Group: amenities ──────────────────────────────────────────
    {
      key: "nearbyAmenities",
      label: "Nearby Amenities",
      type: "array",
      required: false,
      requiredForPublish: false,
      constraints: {
        options: [
          { value: "mrt", label: "MRT / LRT Station" },
          { value: "bus", label: "Bus Stop" },
          { value: "school", label: "School" },
          { value: "hospital", label: "Hospital" },
          { value: "shopping_mall", label: "Shopping Mall" },
          { value: "supermarket", label: "Supermarket" },
          { value: "park", label: "Park / Garden" },
          { value: "highway", label: "Highway Access" },
        ],
      },
      ui: {
        group: "amenities",
        order: 1,
        colSpan: 2,
        showInDetail: true,
      },
    },

    // ─── Group: rental ─────────────────────────────────────────────
    {
      key: "minimumRentalPeriod",
      label: "Minimum Rental Period",
      type: "enum",
      required: false,
      requiredForPublish: false,
      constraints: {
        options: [
          { value: "6_months", label: "6 Months" },
          { value: "12_months", label: "1 Year" },
          { value: "24_months", label: "2 Years" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      ui: {
        group: "rental",
        order: 1,
        showInDetail: true,
      },
    },
    {
      key: "rentalDeposit",
      label: "Rental Deposit",
      type: "string",
      required: false,
      requiredForPublish: false,
      constraints: { max: 50 },
      ui: {
        group: "rental",
        order: 2,
        placeholder: "e.g., 2+1",
        showInDetail: true,
      },
    },

    // ─── Group: reference ──────────────────────────────────────────
    {
      key: "referenceId",
      label: "Reference ID",
      type: "string",
      required: false,
      requiredForPublish: false,
      constraints: { max: 50 },
      ui: {
        group: "reference",
        order: 1,
        helpText: "Your internal reference number",
        showInDetail: true,
      },
    },
  ],
};
