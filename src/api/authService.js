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

/**
 * DELETE /account — soft-deletes the user, revokes all Sanctum + push tokens,
 * cancels any active subscription. Re-registering with the same email later
 * restores the account (handled transparently by POST /register).
 */
export const deleteAccount = async () => {
  const response = await api.delete(ENDPOINTS.DELETE_ACCOUNT);
  return response.data;
};

/** Request a 6-digit password-reset OTP by email. */
export const forgotPassword = async body => {
  const response = await api.post(ENDPOINTS.FORGOT_PASSWORD, {
    email: body.email,
  });
  return response.data;
};

/** Verify OTP before opening the new-password screen. */
export const verifyResetOtp = async body => {
  const response = await api.post(ENDPOINTS.VERIFY_RESET_OTP, {
    email: body.email,
    otp: body.otp,
  });
  return response.data;
};

/** Reset password with email + 6-digit OTP (not token). */
export const resetPassword = async body => {
  const response = await api.post(ENDPOINTS.RESET_PASSWORD, {
    email: body.email,
    otp: body.otp,
    password: body.password,
    password_confirmation: body.password_confirmation,
  });
  return response.data;
};
