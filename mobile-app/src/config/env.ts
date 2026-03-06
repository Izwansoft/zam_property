const defaultApiBaseUrl = 'http://localhost:3000/api/v1';

export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultApiBaseUrl,
  appName: process.env.EXPO_PUBLIC_APP_NAME ?? 'ZAM Property Mobile',
  tenantId: process.env.EXPO_PUBLIC_TENANT_ID,
};
