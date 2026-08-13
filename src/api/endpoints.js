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
  FORGOT_PASSWORD: 'forgot-password',
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
};
