import { useMutation } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api/client';

type RegisterPayload = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
};

type RegisterResponse = {
  data?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
  };
};

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const response = await apiClient.post<RegisterResponse>('/auth/register', payload);
      return response.data;
    },
  });
}
