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
};
