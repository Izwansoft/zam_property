import axios from 'axios';

import { env } from '../../config/env';
import { useAuthStore } from '../../store/auth-store';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (env.tenantId) {
    config.headers['X-Tenant-ID'] = env.tenantId;
  }

  return config;
});
