import { AppState, Linking } from 'react-native';
import { queryClient } from '../api/api';
import { API_ORIGIN } from '../api/endpoints';
import { getSubscriptionMe } from '../api/subscriptionService';
import { navigate } from '../navigation/NavigationService';

export const SUBSCRIPTION_ME_KEY = ['subscription', 'me'];
export const PACKAGES_KEY = ['packages'];

/** PaymentSheet returnURL — register native scheme `slife`. */
export const STRIPE_RETURN_URL = 'slife://stripe-redirect';

/**
 * Safe HTTPS portal return URL (v1 — not the custom scheme).
 * User closes browser / returns to app manually.
 */
export const PORTAL_RETURN_URL = `${API_ORIGIN}/`;

export function isSubscriptionRequiredError(error) {
  return error?.response?.data?.code === 'SUBSCRIPTION_REQUIRED';
}

export function unwrapSubscription(data) {
  if (!data) return null;
  if (data.subscription) return data.subscription;
  if (data.data?.subscription) return data.data.subscription;
  if (data.is_subscribed != null) return data;
  return null;
}

export function unwrapPackages(data) {
  if (!data) return [];
  if (Array.isArray(data.packages)) return data.packages;
  if (Array.isArray(data.data?.packages)) return data.data.packages;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

export function mapPackage(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name || 'SLife Membership',
    price: raw.price,
    currency: raw.currency || 'USD',
    billingCycle: raw.billing_cycle || 'monthly',
    formattedPrice: raw.formatted_price || null,
    trialDays: Number(raw.trial_days || 0),
    features: raw.features || [],
    featureLabels: raw.feature_labels || [],
    isCheckoutReady: raw.is_checkout_ready !== false,
    raw,
  };
}

export function mapSubscription(raw) {
  if (!raw) return null;
  const pkg = raw.package ? mapPackage(raw.package) : null;
  const pm = raw.payment_method || null;
  return {
    isSubscribed: !!raw.is_subscribed,
    onTrial: !!raw.on_trial,
    onGracePeriod: !!raw.on_grace_period,
    status: raw.status || null,
    trialEndsAt: raw.trial_ends_at || null,
    endsAt: raw.ends_at || null,
    package: pkg,
    paymentMethod: pm
      ? {
          type: pm.type || null,
          lastFour: pm.last_four || null,
        }
      : null,
    raw,
  };
}

export function subscribeCtaLabel(pkg) {
  const days = Number(pkg?.trialDays || 0);
  if (days > 0) {
    return `Start ${days}-day free trial`;
  }
  return 'Subscribe now';
}

export function subscriptionSettingsHint(sub) {
  if (!sub) return '…';
  if (sub.isSubscribed && sub.onTrial) return 'Trial';
  if (sub.isSubscribed && sub.onGracePeriod) return 'Cancelling';
  if (sub.isSubscribed) {
    return sub.package?.formattedPrice || 'Active';
  }
  return sub.package?.formattedPrice || 'Upgrade';
}

export async function invalidateSubscriptionQueries() {
  await queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_ME_KEY });
}

export async function prefetchSubscriptionMe() {
  try {
    await queryClient.prefetchQuery({
      queryKey: SUBSCRIPTION_ME_KEY,
      queryFn: getSubscriptionMe,
    });
  } catch (err) {
    console.log('prefetchSubscriptionMe:', err?.response?.data || err);
  }
}

/** Poll until is_subscribed or timeout (doc: every 2s up to ~30s). */
export async function waitForSubscriptionActive({
  intervalMs = 2000,
  timeoutMs = 30000,
} = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const data = await getSubscriptionMe();
      queryClient.setQueryData(SUBSCRIPTION_ME_KEY, data);
      const sub = mapSubscription(unwrapSubscription(data));
      if (sub?.isSubscribed) {
        return sub;
      }
    } catch (err) {
      console.log('waitForSubscriptionActive:', err?.response?.data || err);
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  await invalidateSubscriptionQueries();
  return null;
}

export function openSubscriptionScreen(navigation) {
  if (navigation?.navigate) {
    const parent = navigation.getParent?.();
    if (parent?.navigate) {
      parent.navigate('SubscriptionScreen');
      return;
    }
    navigation.navigate('SubscriptionScreen');
    return;
  }
  navigate('SubscriptionScreen');
}

/**
 * Returns true if subscribed (or on grace — is_subscribed true).
 * Otherwise opens paywall and returns false.
 */
export function ensureSubscribed(navigation, subscription) {
  if (subscription?.isSubscribed) {
    return true;
  }
  openSubscriptionScreen(navigation);
  return false;
}

/** Read mapped subscription from React Query cache (may be stale/missing). */
export function getCachedSubscription() {
  const data = queryClient.getQueryData(SUBSCRIPTION_ME_KEY);
  return mapSubscription(unwrapSubscription(data));
}

/**
 * Async gate: uses cache first, then fetches /subscriptions/me once.
 * Opens paywall when not subscribed.
 */
export async function requireSubscription(navigation) {
  let sub = getCachedSubscription();
  if (sub?.isSubscribed) {
    return true;
  }
  try {
    const data = await queryClient.fetchQuery({
      queryKey: SUBSCRIPTION_ME_KEY,
      queryFn: getSubscriptionMe,
    });
    sub = mapSubscription(unwrapSubscription(data));
    if (sub?.isSubscribed) {
      return true;
    }
  } catch (err) {
    console.log('requireSubscription:', err?.response?.data || err);
  }
  openSubscriptionScreen(navigation);
  return false;
}

export function openPortalUrl(url) {
  if (!url) return Promise.resolve(false);
  return Linking.openURL(url);
}

/** Refetch subscription when app returns to foreground (logged-in callers). */
export function bindSubscriptionForegroundRefresh() {
  const sub = AppState.addEventListener('change', state => {
    if (state !== 'active') return;
    invalidateSubscriptionQueries().catch(() => {});
  });
  return () => sub.remove();
}
