import { ENDPOINTS } from './endpoints';
import api from './api';
import { objectToFormData } from '../utils';

export const getProfileOptions = async () => {
  const response = await api.get(ENDPOINTS.PROFILE_OPTIONS);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get(ENDPOINTS.GET_PROFILE);
  return response.data;
};

/** POST multipart — basic info + optional profile_photo */
export const updateBasicInfo = async body => {
  const formData = objectToFormData(body);
  // Do not set Content-Type manually — axios sets multipart boundary
  const response = await api.post(ENDPOINTS.PROFILE_BASIC_INFO, formData);
  return response.data;
};

export const updateProfessionalInfo = async body => {
  const response = await api.put(ENDPOINTS.PROFILE_PROFESSIONAL_INFO, {
    professional_title: body.professional_title,
    industry: body.industry,
    years_of_experience: Number(body.years_of_experience),
    professional_role: body.professional_role,
  });
  return response.data;
};

export const updateOrganization = async body => {
  const payload = {};
  if (body.company_name) payload.company_name = body.company_name;
  if (body.organization_size) payload.organization_size = body.organization_size;
  if (body.website) payload.website = body.website;
  const response = await api.put(ENDPOINTS.PROFILE_ORGANIZATION, payload);
  return response.data;
};

/** POST multipart — verification docs */
export const updateVerificationDocuments = async body => {
  const formData = objectToFormData(body);
  const response = await api.post(
    ENDPOINTS.PROFILE_VERIFICATION_DOCUMENTS,
    formData,
  );
  return response.data;
};

export const updateBioInterests = async body => {
  const response = await api.put(ENDPOINTS.PROFILE_BIO_INTERESTS, {
    bio: body.bio || null,
    interests: body.interests,
  });
  return response.data;
};

export const updateNetworkingGoals = async body => {
  const response = await api.put(ENDPOINTS.PROFILE_NETWORKING_GOALS, {
    networking_goals: body.networking_goals,
    ...(body.submit_for_verification != null
      ? { submit_for_verification: body.submit_for_verification }
      : {}),
  });
  return response.data;
};
