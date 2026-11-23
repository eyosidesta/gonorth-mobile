import { api } from '../lib/api';

export const authApi = {
  // Email/password registration flow
  register: (data: { firstName: string; lastName: string; email: string; password: string }) =>
    api.post<{ message: string }>('/auth/register', data),

  verifyEmail: (email: string, code: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/email/verify', { email, code }),

  resendEmailOtp: (email: string) =>
    api.post<{ message: string }>('/auth/email/resend', { email }),

  login: (email: string, password: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/login', { email, password }),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/reset-password', { email, code, newPassword }),

  // Phone verification during onboarding (requires auth token)
  sendPhoneOtp: (phone: string) =>
    api.post<{ message: string }>('/auth/phone/send', { phone }),

  verifyPhoneOtp: (phone: string, code: string) =>
    api.post<{ id: string; phone: string; phoneVerified: boolean }>('/auth/phone/verify', { phone, code }),

  // Legacy phone-OTP login (kept for backward compat)
  sendOtp: (phone: string) =>
    api.post('/auth/otp/send', { phone }),

  verifyOtp: (phone: string, code: string, fcmToken?: string) =>
    api.post<{ accessToken: string; refreshToken: string; isNewUser: boolean }>(
      '/auth/otp/verify',
      { phone, code, ...(fcmToken ? { fcmToken, platform: 'android' } : {}) },
    ),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
};
