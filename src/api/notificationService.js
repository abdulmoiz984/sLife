import { ENDPOINTS } from './endpoints';
import api from './api';

/**
 * GET /notifications
 * @param {{ per_page?: number, unread_only?: boolean|0|1|'true'|'false', page?: number }} [params]
 */
export const getNotifications = async (params = {}) => {
  const response = await api.get(ENDPOINTS.NOTIFICATIONS, {
    params: {
      per_page: params.per_page ?? 20,
      page: params.page,
      ...(params.unread_only != null
        ? { unread_only: params.unread_only }
        : {}),
    },
  });
  return response.data;
};

/**
 * POST /notifications/{notification_id}/read
 * Idempotent — safe to call again on an already-read item.
 */
export const markNotificationRead = async notificationId => {
  const response = await api.post(
    ENDPOINTS.NOTIFICATION_READ(notificationId),
  );
  return response.data;
};

/**
 * POST /notifications/read-all
 */
export const markAllNotificationsRead = async () => {
  const response = await api.post(ENDPOINTS.NOTIFICATIONS_READ_ALL);
  return response.data;
};
