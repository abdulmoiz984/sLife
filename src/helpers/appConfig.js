import { AppState } from 'react-native';
import { queryClient, storage } from '../api/api';
import { getAppConfig } from '../api/configService';
import { showMessage } from '../utils';

/**
 * App config from GET /config (see mobile subscription-enabled flag doc).
 *
 * Policy: FAIL CLOSED (App Store safe).
 *  - Until a successful /config returns `subscription_enabled: true`, all
 *    subscription / paywall UI is hidden.
 *  - If a later fetch fails, the last value received on this device is kept.
 */
export const APP_CONFIG_KEY = ['app', 'config'];
const SUBSCRIPTION_ENABLED_STORAGE = 'app_config_subscription_enabled';

export function getStoredSubscriptionEnabled() {
  try {
    return storage.getBoolean(SUBSCRIPTION_ENABLED_STORAGE) === true;
  } catch (_) {
    return false;
  }
}

/** queryFn for APP_CONFIG_KEY. Persists the flag for the next cold start. */
export async function fetchAppConfig() {
  const data = await getAppConfig();
  const config = data?.config ?? data?.data?.config ?? {};
  const subscriptionEnabled = config.subscription_enabled === true;
  try {
    storage.set(SUBSCRIPTION_ENABLED_STORAGE, subscriptionEnabled);
  } catch (_) {}
  return { subscriptionEnabled, raw: config };
}

/** Initial (cached) value so cold start never flashes subscription UI. */
export function initialAppConfig() {
  return { subscriptionEnabled: getStoredSubscriptionEnabled(), fromStorage: true };
}

/** Force a refetch (cold launch, foreground, before opening subscription screens). */
export function refreshAppConfig() {
  return queryClient
    .fetchQuery({ queryKey: APP_CONFIG_KEY, queryFn: fetchAppConfig, staleTime: 0 })
    .catch(err => {
      console.log('refreshAppConfig:', err?.response?.data || err?.message || err);
      return null;
    });
}

/** Synchronous read for non-React code (navigation helpers, error handlers). */
export function isSubscriptionUiEnabled() {
  const cached = queryClient.getQueryData(APP_CONFIG_KEY);
  if (cached && typeof cached.subscriptionEnabled === 'boolean') {
    return cached.subscriptionEnabled;
  }
  return getStoredSubscriptionEnabled();
}

export function canShowSubscriptionUi(subscriptionEnabled) {
  return subscriptionEnabled === true;
}

export const SUBSCRIPTION_UNAVAILABLE_MESSAGE =
  'Membership is temporarily unavailable.';

export function showSubscriptionUnavailable() {
  showMessage({ type: 'default', message: SUBSCRIPTION_UNAVAILABLE_MESSAGE });
}

/** Refetch config whenever the app returns to the foreground. */
export function bindAppConfigForegroundRefresh() {
  const sub = AppState.addEventListener('change', state => {
    if (state === 'active') refreshAppConfig();
  });
  return () => sub.remove();
}

