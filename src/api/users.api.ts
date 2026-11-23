import { api } from '../lib/api';

export const usersApi = {
  me: () => api.get('/users/me'),

  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    preferredLanguage?: 'en' | 'fr';
    dateOfBirth?: string;
    province?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    bio?: string;
    notifPush?: boolean;
    notifSms?: boolean;
    notifEmail?: boolean;
    notifMarketing?: boolean;
    onboardingCompleted?: boolean;
  }) => api.patch('/users/me', data),
};
