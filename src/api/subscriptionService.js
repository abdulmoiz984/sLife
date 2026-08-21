import { ENDPOINTS } from './endpoints';
import api from './api';

/** GET /packages — public; still fine with bearer when logged in. */
export const getPackages = async () => {
  const response = await api.get(ENDPOINTS.PACKAGES);
  return response.data;
};

/** POST /subscriptions/payment-sheet */
export const createPaymentSheet = async packageId => {
  const response = await api.post(ENDPOINTS.SUBSCRIPTION_PAYMENT_SHEET, {
    package_id: packageId,
  });
  return response.data;
};

/** POST /subscriptions/activate-trial — after SetupIntent PaymentSheet success. */
export const activateTrial = async (packageId, setupIntentId) => {
  const response = await api.post(ENDPOINTS.SUBSCRIPTION_ACTIVATE_TRIAL, {
    package_id: packageId,
    setup_intent_id: setupIntentId,
  });
  return response.data;
};

/** GET /subscriptions/me */
export const getSubscriptionMe = async () => {
  const response = await api.get(ENDPOINTS.SUBSCRIPTION_ME);
  return response.data;
};

/** POST /subscriptions/cancel — end of current period. */
export const cancelSubscription = async () => {
  const response = await api.post(ENDPOINTS.SUBSCRIPTION_CANCEL);
  return response.data;
};

/** POST /subscriptions/resume — during grace period. */
export const resumeSubscription = async () => {
  const response = await api.post(ENDPOINTS.SUBSCRIPTION_RESUME);
  return response.data;
};

/**
 * POST /subscriptions/portal
 * return_url must be HTTPS for v1 (see mobile-subscription-decisions.md).
 */
export const createBillingPortal = async returnUrl => {
  const response = await api.post(ENDPOINTS.SUBSCRIPTION_PORTAL, {
    return_url: returnUrl,
  });
  return response.data;
};
