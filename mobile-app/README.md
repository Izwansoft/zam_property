# ZAM Property Mobile (Expo)

## Setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
pnpm install
```

3. Run app:

```bash
pnpm start
```

## Scripts

- `pnpm start` - start Expo dev server
- `pnpm android` - run on Android device/emulator
- `pnpm ios` - run on iOS simulator (macOS)
- `pnpm web` - run on web

## Environment Variables

- `EXPO_PUBLIC_APP_NAME` - app display name used by UI
- `EXPO_PUBLIC_API_BASE_URL` - backend API base URL (default: `http://localhost:3000/api/v1`)

## Current Foundation

- React Navigation native stack (auth flow)
- TanStack Query provider
- Axios API client with bearer token interceptor
- Zustand auth store skeleton
- Login screen stub and home screen stub

## Real-Estate Focus

- Primary module focus is `real_estate` listings
- Authenticated users land on `RealEstateListings` screen
- Listings data source: `GET /api/v1/listings` with `verticalType=real_estate`
- Optional tenant header support via `EXPO_PUBLIC_TENANT_ID`
