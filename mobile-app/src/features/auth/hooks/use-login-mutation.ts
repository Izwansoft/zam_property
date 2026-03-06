import { useMutation } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api/client';
import { useAuthStore } from '../../../store/auth-store';

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
};

export function useLoginMutation() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await apiClient.post<LoginResponse>('/auth/login', payload);
      return response.data;
    },
    onSuccess: (data) => {
      setSession({
        accessToken: data.accessToken,
        user: data.user,
      });
    },
  });
}
