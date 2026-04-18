import { create } from 'zustand';
import { User } from '@/types';
import { getUser, setUser, clearAuth } from '@/lib/auth';
import api from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: (user: User) => {
    setUser(user);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignorar erros de rede no logout
    }
    clearAuth();
    set({ user: null, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  hydrate: () => {
    const user = getUser();
    if (user) {
      set({ user, isAuthenticated: true });
    }
  },
}));
