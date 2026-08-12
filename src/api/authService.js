import { ENDPOINTS } from './endpoints';
import api from './api';

export const register = async body => {
  const response = await api.post(ENDPOINTS.REGISTER, {
    full_name: body.full_name,
    email: body.email,
    password: body.password,
    password_confirmation: body.password_confirmation,
    terms_accepted: body.terms_accepted,
  });
  return response.data;
};

export const login = async (body, setIsLoading) => {
  setIsLoading?.(true);
  const response = await api.post(ENDPOINTS.LOGIN, {
    email: body?.email,
    password: body?.password,
  });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get(ENDPOINTS.ME);
  return response.data;
};

export const logout = async () => {
  const response = await api.post(ENDPOINTS.LOGOUT);
  return response.data;
};

export const forgotPassword = async body => {
  const response = await api.post(ENDPOINTS.FORGOT_PASSWORD, {
    email: body.email,
  });
  return response.data;
};

export const resetPassword = async body => {
  const response = await api.post(ENDPOINTS.RESET_PASSWORD, {
    email: body.email,
    token: body.token,
    password: body.password,
    password_confirmation: body.password_confirmation,
  });
  return response.data;
};
