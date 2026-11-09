import { useQuery } from '@tanstack/react-query';
import {
  APP_CONFIG_KEY,
  canShowSubscriptionUi,
  fetchAppConfig,
  initialAppConfig,
} from '../helpers/appConfig';

/**
 * `true` only when GET /config returned `subscription_enabled: true`
 * (or that was the last value received on this device). Fail closed otherwise.
 */
export function useSubscriptionEnabled() {
  const { data, isFetching, refetch } = useQuery({
    queryKey: APP_CONFIG_KEY,
    queryFn: fetchAppConfig,
    initialData: initialAppConfig,
    // Treat the stored value as stale so a real fetch always runs on mount.
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    subscriptionEnabled: canShowSubscriptionUi(data?.subscriptionEnabled),
    isFetching,
    refetch,
  };
}

