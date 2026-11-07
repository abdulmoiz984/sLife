import { AppState, Linking } from 'react-native';
import { queryClient, storage } from '../api/api';
import { API_ORIGIN } from '../api/endpoints';
import { getSubscriptionMe } from '../api/subscriptionService';
import { navigate } from '../navigation/NavigationService';

export const SUBSCRIPTION_ME_KEY = ['subscription', 'me'];
export const PACKAGES_KEY = ['packages'];
const STRIPE_PUBLISHABLE_KEY_STORAGE = 'stripe_publishable_key';

export function saveStripePublishableKey(key) {
  if (typeof key === 'string' && key.trim()) {
    try {
      storage.set(STRIPE_PUBLISHABLE_KEY_STORAGE, key.trim());
    } catch (_) {}
  }
}

export function getStripePublishableKey() {
  try {
    return storage.getString(STRIPE_PUBLISHABLE_KEY_STORAGE) || null;
  } catch (_) {
    return null;
  }
}

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

export const FALLBACK_FEATURE_LABELS = [
  'Full profile & portfolio access',
  'Unlimited member connections',
  'Direct messaging',
  'Advanced search filters',
  'Event & webinar access',
  'Verification badge eligibility',
  'Priority support',
  'Profile analytics dashboard',
];

export function mapPackage(raw) {
  if (!raw) return null;
  const description = Array.isArray(raw.description)
    ? raw.description.filter(item => typeof item === 'string' && item.trim().length > 0)
    : typeof raw.description === 'string' && raw.description.trim()
      ? [raw.description.trim()]
      : [];
  return {
    id: raw.id,
    name: raw.name || 'SLife Membership',
    description,
    price: raw.price,
    currency: raw.currency || 'USD',
    billingCycle: raw.billing_cycle || 'monthly',
    formattedPrice: raw.formatted_price || null,
    trialDays: Number(raw.trial_days || 0),
    features: Array.isArray(raw.features) ? raw.features : [],
    featureLabels:
      Array.isArray(raw.feature_labels) && raw.feature_labels.length > 0
        ? raw.feature_labels
        : FALLBACK_FEATURE_LABELS,
    dailyMessageLimit:
      raw.daily_message_limit != null ? Number(raw.daily_message_limit) : null,
    messageLimitLabel: raw.message_limit_label || null,
    isCheckoutReady: raw.is_checkout_ready !== false,
    raw,
  };
}

export function mapSubscription(raw) {
  if (!raw) return null;
  const pkg = raw.package ? mapPackage(raw.package) : null;
  const pm = raw.payment_method || null;
  const ma = raw.message_allowance || null;
  return {
    isSubscribed: !!raw.is_subscribed,
    onTrial: !!raw.on_trial,
    onGracePeriod: !!raw.on_grace_period,
    status: raw.status || null,
    trialEndsAt: raw.trial_ends_at || null,
    endsAt: raw.ends_at || null,
    package: pkg,
    messageAllowance: ma
      ? {
          limit: ma.limit != null ? Number(ma.limit) : null,
          used: Number(ma.used || 0),
          remaining: ma.remaining != null ? Number(ma.remaining) : null,
          unlimited: !!ma.unlimited,
          resetsAt: ma.resets_at || null,
        }
      : null,
    paymentMethod: pm
      ? {
          type: pm.type || null,
          lastFour: pm.last_four || null,
        }
      : null,
    raw,
  };
}

/**
 * Monthly-equivalent package price for upgrade/downgrade comparison.
 * Yearly packages are normalized as `price / 12`.
 */
export function getMonthlyEquivalentPrice(pkg) {
  const price = Number(pkg?.price ?? 0);
  if (!Number.isFinite(price)) return 0;
  return pkg?.billingCycle === 'yearly' ? price / 12 : price;
}

/**
 * Returns 'upgrade' | 'downgrade' | 'switch' comparing target to current package.
 */
export function getPlanChangeType(currentPkg, targetPkg) {
  if (!currentPkg || !targetPkg) return 'switch';
  const currentMonthly = getMonthlyEquivalentPrice(currentPkg);
  const targetMonthly = getMonthlyEquivalentPrice(targetPkg);
  const diff = targetMonthly - currentMonthly;
  if (Math.abs(diff) < 0.005) return 'switch';
  return diff > 0 ? 'upgrade' : 'downgrade';
}

export function getPlanChangeCtaLabel(currentPkg, targetPkg) {
  if (!targetPkg) return 'Select a plan';
  if (currentPkg?.id != null && targetPkg.id === currentPkg.id) {
    return 'Current plan';
  }
  const type = getPlanChangeType(currentPkg, targetPkg);
  if (type === 'upgrade') return `Upgrade to ${targetPkg.name}`;
  if (type === 'downgrade') return `Downgrade to ${targetPkg.name}`;
  return `Switch to ${targetPkg.name}`;
}

export function getPlanChangeConfirmCopy(changeType) {
  if (changeType === 'upgrade') {
    return "You'll move to this plan immediately. Stripe will prorate the unused time on your current plan and charge the difference when required.";
  }
  if (changeType === 'downgrade') {
    return "You'll move to this plan immediately. Stripe will credit unused time toward future invoices when prorations are enabled.";
  }
  return "You'll move to this plan immediately.";
}

export function formatMessageAllowance(subscription, displayPackage) {
  const ma = subscription?.messageAllowance;
  if (ma) {
    if (ma.unlimited) {
      return 'Unlimited daily messages';
    }
    if (ma.limit != null && ma.remaining != null) {
      return `Daily messages: ${ma.remaining} of ${ma.limit} remaining today`;
    }
    if (ma.limit != null) {
      return `Up to ${ma.limit} messages per day`;
    }
  }
  if (displayPackage?.messageLimitLabel) {
    return displayPackage.messageLimitLabel;
  }
  if (displayPackage?.dailyMessageLimit != null) {
    return `Up to ${displayPackage.dailyMessageLimit} messages per day`;
  }
  return null;
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
