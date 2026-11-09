import { ENDPOINTS } from './endpoints';
import api from './api';

/** GET /config — public app config (e.g. subscription_enabled). */
export const getAppConfig = async () => {
  const response = await api.get(ENDPOINTS.CONFIG, { skipErrorToast: true });
  return response.data;
};

