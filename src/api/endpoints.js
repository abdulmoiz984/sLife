// ✅ Base URLs — from mobile-api-integration.md
export const BASE_URL = __DEV__
  ? 'https://pro-fixer.demoappprojects.com/slife/'
  : 'https://pro-fixer.demoappprojects.com/slife/';

export const API_DOMAIN = `${BASE_URL}api/`;

/** Site origin without trailing slash or `/api` — used by Pusher auth. */
export const API_ORIGIN = BASE_URL.replace(/\/+$/, '');

export const ENDPOINTS = {
  // --- Auth (Module A) ---
  REGISTER: 'register',
  LOGIN: 'login',
  ME: 'me',
  LOGOUT: 'logout',
  PUSH_REGISTER: 'push/register',
  PUSH_UNREGISTER: 'push/unregister',
  PUSH_TEST: 'push/test',
  FORGOT_PASSWORD: 'forgot-password',
  VERIFY_RESET_OTP: 'verify-reset-otp',
  RESET_PASSWORD: 'reset-password',

  // --- Profile & onboarding (Module B) ---
  PROFILE_OPTIONS: 'profile/options',
  GET_PROFILE: 'profile',
  PROFILE_BASIC_INFO: 'profile/basic-info',
  PROFILE_PROFESSIONAL_INFO: 'profile/professional-info',
  PROFILE_ORGANIZATION: 'profile/organization',
  PROFILE_VERIFICATION_DOCUMENTS: 'profile/verification-documents',
  PROFILE_BIO_INTERESTS: 'profile/bio-interests',
  PROFILE_NETWORKING_GOALS: 'profile/networking-goals',

  // --- Educations (Module C) ---
  EDUCATIONS: 'profile/educations',
  EDUCATION: id => `profile/educations/${id}`,
  EDUCATIONS_SYNC: 'profile/educations/sync',

  // --- Members (Module D) ---
  MEMBERS: 'members',
  MEMBERS_MATCHES: 'members/matches',
  MEMBER: userId => `members/${userId}`,

  // --- Connections (Module E) ---
  CONNECTIONS: 'connections',
  CONNECTION_ACCEPT: id => `connections/${id}/accept`,
  CONNECTION_DECLINE: id => `connections/${id}/decline`,
  CONNECTION_CANCEL: id => `connections/${id}/cancel`,
  CONNECTION: id => `connections/${id}`,

  // --- Reports (Module F) ---
  REPORT_REASONS: 'reports/reasons',
  REPORTS: 'reports',

  // --- Chat (one-to-one text) ---
  CHATS: 'chats',
  CHAT_MESSAGES: id => `chats/${id}/messages`,
  CHAT_READ: id => `chats/${id}/read`,
  BROADCAST_AUTH: 'broadcasting/auth',

  // --- Blocking ---
  BLOCKED_USERS: 'blocked-users',
  BLOCK_USER: userId => `users/${userId}/block`,

  // --- Notification inbox ---
  NOTIFICATIONS: 'notifications',
  NOTIFICATION_READ: id => `notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: 'notifications/read-all',

  // --- Subscriptions (Stripe PaymentSheet) ---
  PACKAGES: 'packages',
  SUBSCRIPTION_PAYMENT_SHEET: 'subscriptions/payment-sheet',
  SUBSCRIPTION_ACTIVATE_TRIAL: 'subscriptions/activate-trial',
  SUBSCRIPTION_ME: 'subscriptions/me',
  SUBSCRIPTION_CANCEL: 'subscriptions/cancel',
  SUBSCRIPTION_RESUME: 'subscriptions/resume',
  SUBSCRIPTION_PORTAL: 'subscriptions/portal',
};
