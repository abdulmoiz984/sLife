import { ENDPOINTS } from './endpoints';
import api from './api';

export const getEducations = async () => {
  const response = await api.get(ENDPOINTS.EDUCATIONS);
  return response.data;
};

export const createEducation = async body => {
  const response = await api.post(ENDPOINTS.EDUCATIONS, {
    institution: body.institution,
    ...(body.degree ? { degree: body.degree } : {}),
    ...(body.field_of_study ? { field_of_study: body.field_of_study } : {}),
    ...(body.start_date ? { start_date: body.start_date } : {}),
    ...(body.end_date ? { end_date: body.end_date } : {}),
    ...(body.is_current != null ? { is_current: body.is_current } : {}),
    ...(body.description ? { description: body.description } : {}),
  });
  return response.data;
};

export const updateEducation = async ({ id, ...body }) => {
  const response = await api.put(ENDPOINTS.EDUCATION(id), body);
  return response.data;
};

export const deleteEducation = async id => {
  const response = await api.delete(ENDPOINTS.EDUCATION(id));
  return response.data;
};

/** Replace-all sync */
export const syncEducations = async educations => {
  const response = await api.put(ENDPOINTS.EDUCATIONS_SYNC, { educations });
  return response.data;
};
