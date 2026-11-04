import { apiRequest } from './client';

export type NotificationPrefs = {
  bookingEmail?: boolean;
  cancelEmail?: boolean;
  memberEmail?: boolean;
  weeklyDigest?: boolean;
  marketing?: boolean;
  bookingPush?: boolean;
  cancelPush?: boolean;
  memberPush?: boolean;
  reminderPush?: boolean;
};

export type PrivacyConsent = {
  accepted?: boolean;
  version?: string;
  acceptedAt?: string | null;
  withdrawnAt?: string | null;
  source?: string | null;
  isCurrent?: boolean;
};

export type UiTheme = 'system' | 'light' | 'dark';

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role?: string;
  platformAdmin?: boolean;
  uiTheme?: UiTheme;
  notificationPrefs?: NotificationPrefs;
  privacyConsent?: PrivacyConsent;
};

export type LoginResult = {
  token: string;
  user: AuthUser;
  created?: boolean;
};

export async function login(email: string, password: string): Promise<LoginResult> {
  return apiRequest<LoginResult>('/auth/login', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), password },
    auth: false,
  });
}

export async function loginWithGoogle(
  idToken: string,
  intent: 'login' | 'register' = 'login',
): Promise<LoginResult> {
  return apiRequest<LoginResult>('/auth/google', {
    method: 'POST',
    body: { idToken, intent },
    auth: false,
  });
}

export async function getMe(token?: string): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>('/auth/me', token ? { token } : undefined);
}

export async function updateMe(body: Record<string, unknown>): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>('/auth/me', {
    method: 'PATCH',
    body,
  });
}

export async function changePassword(body: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok?: boolean; token?: string }> {
  return apiRequest<{ ok?: boolean; token?: string }>('/auth/password', {
    method: 'PATCH',
    body,
  });
}

export async function logoutRequest(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    // Local logout still proceeds if the network fails.
  }
}
