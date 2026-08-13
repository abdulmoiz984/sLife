import { ENDPOINTS } from './endpoints';
import api from './api';

export const getReportReasons = async () => {
  const response = await api.get(ENDPOINTS.REPORT_REASONS);
  return response.data;
};

export const createReport = async body => {
  const response = await api.post(ENDPOINTS.REPORTS, {
    user_id: body.user_id,
    reason: body.reason,
    ...(body.details ? { details: body.details } : {}),
  });
  return response.data;
};
