import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  profilePhoto: string | null;
  isDriver: boolean;
  adminRole: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  province: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  preferredLanguage: string | null;
  bio: string | null;
  notifPush: boolean;
  notifSms: boolean;
  notifEmail: boolean;
  notifMarketing: boolean;
  onboardingCompleted: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (v: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ user: null });
  },
}));
