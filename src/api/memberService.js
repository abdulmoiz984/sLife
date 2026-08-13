import { ENDPOINTS } from './endpoints';
import api from './api';

export const getMembers = async (params = {}) => {
  const response = await api.get(ENDPOINTS.MEMBERS, { params });
  return response.data;
};

export const getMemberMatches = async (params = {}) => {
  const response = await api.get(ENDPOINTS.MEMBERS_MATCHES, {
    params: { limit: params.limit ?? 8, ...params },
  });
  return response.data;
};

export const getMember = async userId => {
  const response = await api.get(ENDPOINTS.MEMBER(userId));
  return response.data;
};
