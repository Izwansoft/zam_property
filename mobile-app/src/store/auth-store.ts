import { create } from 'zustand';

type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (payload: { accessToken: string; user: AuthUser }) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setSession: ({ accessToken, user }) => {
    set({ accessToken, user });
  },
  clearSession: () => {
    set({ accessToken: null, user: null });
  },
}));
