import { create } from 'zustand';
import { saveToken, removeToken, decodeJwtPayload } from '../lib/auth';

interface AuthUser {
  id: string;
  email: string;
  role: string;
  clientId: string;
  name?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (token: string) => {
    await saveToken(token);
    const payload = decodeJwtPayload(token);
    const user: AuthUser = {
      id: String(payload?.sub ?? ''),
      email: String(payload?.email ?? ''),
      role: String(payload?.role ?? ''),
      clientId: String(payload?.clientId ?? ''),
      name: payload?.name ? String(payload.name) : undefined,
    };
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await removeToken();
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),
}));
