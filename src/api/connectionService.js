import { ENDPOINTS } from './endpoints';
import api from './api';

export const getConnections = async (params = {}) => {
  const response = await api.get(ENDPOINTS.CONNECTIONS, {
    params: {
      filter: params.filter || 'accepted',
      page: params.page,
      per_page: params.per_page,
    },
  });
  return response.data;
};

export const createConnection = async body => {
  const response = await api.post(ENDPOINTS.CONNECTIONS, {
    user_id: body.user_id,
    ...(body.message ? { message: body.message } : {}),
  });
  return response.data;
};

export const acceptConnection = async id => {
  const response = await api.post(ENDPOINTS.CONNECTION_ACCEPT(id));
  return response.data;
};

export const declineConnection = async id => {
  const response = await api.post(ENDPOINTS.CONNECTION_DECLINE(id));
  return response.data;
};

export const cancelConnection = async id => {
  const response = await api.post(ENDPOINTS.CONNECTION_CANCEL(id));
  return response.data;
};

export const removeConnection = async id => {
  const response = await api.delete(ENDPOINTS.CONNECTION(id));
  return response.data;
};
