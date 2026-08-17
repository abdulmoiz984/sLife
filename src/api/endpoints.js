// ✅ Base URLs — from mobile-api-integration.md
export const BASE_URL = __DEV__
  ? 'https://pro-fixer.demoappprojects.com/slife/'
  : 'https://pro-fixer.demoappprojects.com/slife/';

export const API_DOMAIN = `${BASE_URL}api/`;

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
};
