import { create } from 'zustand';
import type { AuthUser } from '../services/auth/auth-service';
import { loginLocal, logoutLocal, restoreSession } from '../services/auth/auth-service';

interface AuthState {
  user: AuthUser | null;
  isHydrated: boolean;
  isLoading: boolean;
  hydrate: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isHydrated: false,
  isLoading: false,

  hydrate: async () => {
    set({ isLoading: true });
    const user = await restoreSession();
    set({ user, isHydrated: true, isLoading: false });
  },

  login: async (username, password) => {
    set({ isLoading: true });
    const user = await loginLocal(username, password);
    set({ user, isLoading: false });
    return user != null;
  },

  logout: async () => {
    await logoutLocal();
    set({ user: null });
  },
}));
