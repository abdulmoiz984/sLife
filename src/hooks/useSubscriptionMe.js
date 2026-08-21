import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useCustomQuery } from '../query/useCustomQuery';
import { getSubscriptionMe } from '../api/subscriptionService';
import {
  SUBSCRIPTION_ME_KEY,
  mapSubscription,
  unwrapSubscription,
} from '../helpers/subscriptionHelpers';

/** React Query source of truth for GET /subscriptions/me. */
export function useSubscriptionMe(options = {}) {
  const isLogged = useSelector(s => s.app.isLogged);

  const query = useCustomQuery({
    queryKey: SUBSCRIPTION_ME_KEY,
    queryFn: getSubscriptionMe,
    enabled: isLogged && options.enabled !== false,
    staleTime: options.staleTime ?? 30_000,
    ...options,
  });

  const subscription = useMemo(
    () => mapSubscription(unwrapSubscription(query.data)),
    [query.data],
  );

  return {
    ...query,
    subscription,
    isSubscribed: !!subscription?.isSubscribed,
  };
}
