import React, {Component, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  initPaymentSheet,
  initStripe,
  presentPaymentSheet,
} from '@stripe/stripe-react-native';
import {COLORS, RADIUS} from '../../globalStyle/Theme';
import {useCustomQuery} from '../../query/useCustomQuery';
import {useCustomMutation} from '../../query/useCustomMutation';
import {useSubscriptionMe} from '../../hooks/useSubscriptionMe';
import {
  activateTrial,
  cancelSubscription,
  createBillingPortal,
  createPaymentSheet,
  getPackages,
  resumeSubscription,
} from '../../api/subscriptionService';
import {
  PACKAGES_KEY,
  PORTAL_RETURN_URL,
  STRIPE_RETURN_URL,
  invalidateSubscriptionQueries,
  mapPackage,
  openPortalUrl,
  subscribeCtaLabel,
  unwrapPackages,
  waitForSubscriptionActive,
} from '../../helpers/subscriptionHelpers';
import {showMessage} from '../../utils';

const FALLBACK_PERKS = [
  'Unlimited messaging',
  'Advanced Discover filters',
  'Priority visibility in Discover',
  'Cancel anytime',
];

class SubscriptionErrorBoundary extends Component {
  state = {error: null};

  static getDerivedStateFromError(error) {
    return {error};
  }

  componentDidCatch(error, info) {
    console.log('SubscriptionScreen render error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorPage}>
          <Text style={styles.title}>Subscription & Billing</Text>
          <Text style={styles.copy}>
            {this.state.error?.message || 'Unable to display subscription details.'}
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => this.props.navigation.goBack()}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}

const SubscriptionContent = ({navigation}) => {
  const [busy, setBusy] = useState(false);
  const [pendingWebhook, setPendingWebhook] = useState(false);

  const {
    subscription,
    isSubscribed,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useSubscriptionMe();

  const {
    data: packagesResponse,
    isLoading: packagesLoading,
    isError: packagesError,
    refetch: refetchPackages,
  } = useCustomQuery({
    queryKey: PACKAGES_KEY,
    queryFn: getPackages,
  });

  const pkg = useMemo(() => {
    const packages = unwrapPackages(packagesResponse)
      .map(mapPackage)
      .filter(Boolean);
    return packages.find(item => item.isCheckoutReady) || packages[0] || null;
  }, [packagesResponse]);

  const displayPackage = pkg || subscription?.package || null;
  const perks =
    displayPackage?.featureLabels?.length > 0
      ? displayPackage.featureLabels
      : FALLBACK_PERKS;
  const formattedPrice =
    displayPackage?.formattedPrice ||
    (displayPackage?.price != null ? `$${displayPackage.price}` : '—');
  const loading = statusLoading || packagesLoading;

  const {mutateAsync: runCancel, isPending: cancelling} = useCustomMutation({
    mutationFn: cancelSubscription,
  });
  const {mutateAsync: runResume, isPending: resuming} = useCustomMutation({
    mutationFn: resumeSubscription,
  });
  const {mutateAsync: runPortal, isPending: openingPortal} = useCustomMutation({
    mutationFn: () => createBillingPortal(PORTAL_RETURN_URL),
  });

  const refreshStatus = async () => {
    await Promise.allSettled([
      invalidateSubscriptionQueries(),
      refetchStatus(),
      refetchPackages(),
    ]);
  };

  const subscribe = async () => {
    if (!pkg?.id || !pkg.isCheckoutReady || busy) return;

    setBusy(true);
    setPendingWebhook(false);
    try {
      const response = await createPaymentSheet(pkg.id);
      const sheet = response?.payment_sheet;
      if (!sheet?.intent_client_secret || !sheet?.publishable_key) {
        throw new Error(response?.message || 'Unable to initialize payment.');
      }

      await initStripe({
        publishableKey: sheet.publishable_key,
        urlScheme: 'slife',
      });

      const clientSecret =
        sheet.intent_type === 'payment'
          ? {paymentIntentClientSecret: sheet.intent_client_secret}
          : {setupIntentClientSecret: sheet.intent_client_secret};

      const {error: setupError} = await initPaymentSheet({
        merchantDisplayName: 'SLife',
        customerId: sheet.customer_id,
        customerSessionClientSecret: sheet.customer_session_client_secret,
        returnURL: STRIPE_RETURN_URL,
        allowsDelayedPaymentMethods: false,
        ...clientSecret,
      });
      if (setupError) throw new Error(setupError.message);

      const {error: paymentError} = await presentPaymentSheet();
      if (paymentError?.code === 'Canceled') return;
      if (paymentError) throw new Error(paymentError.message);

      if (sheet.requires_subscription_activation && sheet.setup_intent_id) {
        await activateTrial(pkg.id, sheet.setup_intent_id);
      }

      const active = await waitForSubscriptionActive();
      if (!active?.isSubscribed) setPendingWebhook(true);
      await refreshStatus();
    } catch (error) {
      showMessage({
        type: 'danger',
        message:
          error?.response?.data?.message ||
          error?.response?.data?.errors?.package_id?.[0] ||
          error?.message ||
          'Checkout failed. Please try again.',
      });
    } finally {
      setBusy(false);
    }
  };

  const manageBilling = async () => {
    try {
      const response = await runPortal();
      const url =
        response?.portal_url ||
        response?.url ||
        response?.data?.portal_url;
      if (!url) throw new Error('Billing portal unavailable.');
      await openPortalUrl(url);
    } catch (error) {
      showMessage({
        type: 'danger',
        message:
          error?.response?.data?.message ||
          error?.message ||
          'Could not open billing.',
      });
    }
  };

  const resume = async () => {
    try {
      await runResume();
      await refreshStatus();
    } catch (error) {
      showMessage({
        type: 'danger',
        message: error?.response?.data?.message || 'Could not resume subscription.',
      });
    }
  };

  const cancel = () => {
    Alert.alert(
      'Cancel subscription',
      'You will keep access until the end of the current billing period.',
      [
        {text: 'Keep plan', style: 'cancel'},
        {
          text: 'Cancel plan',
          style: 'destructive',
          onPress: async () => {
            try {
              await runCancel();
              await refreshStatus();
            } catch (error) {
              showMessage({
                type: 'danger',
                message:
                  error?.response?.data?.message ||
                  'Could not cancel subscription.',
              });
            }
          },
        },
      ],
    );
  };

  const badge = subscription?.onGracePeriod
    ? 'Cancelling'
    : subscription?.onTrial
      ? 'On trial'
      : 'Subscribed';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Close"
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={styles.closeButton}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Subscription & Billing</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>SLIFE PREMIUM</Text>
        <Text style={styles.title}>
          {isSubscribed ? 'Your membership' : 'Unlock full access'}
        </Text>
        <Text style={styles.copy}>
          {isSubscribed
            ? 'Your plan includes messaging and advanced discovery.'
            : 'Message matches and use advanced Discover filters.'}
        </Text>

        <View style={styles.packageCard}>
          <View style={styles.packageHeader}>
            <Text style={styles.packageName}>
              {displayPackage?.name || 'SLife Membership'}
            </Text>
            {isSubscribed ? (
              <View
                style={[
                  styles.badge,
                  subscription?.onGracePeriod && styles.warningBadge,
                ]}>
                <Text
                  style={[
                    styles.badgeText,
                    subscription?.onGracePeriod && styles.warningBadgeText,
                  ]}>
                  {badge}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.price}>
            {String(formattedPrice).replace(/\/mo$/i, '')}
          </Text>
          <Text style={styles.billingCycle}>
            {displayPackage?.billingCycle === 'yearly'
              ? 'Per year'
              : 'Per month'}
          </Text>

          {isSubscribed && subscription?.paymentMethod?.lastFour ? (
            <Text style={styles.paymentMethod}>
              {subscription.paymentMethod.type || 'Card'} ending in{' '}
              {subscription.paymentMethod.lastFour}
            </Text>
          ) : null}

          {!displayPackage && loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading package…</Text>
            </View>
          ) : null}

          {!displayPackage && packagesError ? (
            <Text style={styles.errorText}>
              Package details could not be loaded. Tap Refresh status.
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>
          {isSubscribed ? 'Included in your plan' : 'What you get'}
        </Text>
        {perks.map(perk => (
          <View key={perk} style={styles.perkRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.perkText}>{perk}</Text>
          </View>
        ))}

        {pendingWebhook ? (
          <Text style={styles.pendingText}>
            Payment received. Activation is pending; refresh again shortly.
          </Text>
        ) : null}

        {!isSubscribed ? (
          <Pressable
            disabled={!pkg?.id || !pkg.isCheckoutReady || busy}
            onPress={subscribe}
            style={[
              styles.primaryButton,
              (!pkg?.id || !pkg.isCheckoutReady || busy) &&
                styles.disabledButton,
            ]}>
            {busy ? (
              <ActivityIndicator color={COLORS.white100} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {pkg ? subscribeCtaLabel(pkg) : 'Loading package…'}
              </Text>
            )}
          </Pressable>
        ) : (
          <>
            <Pressable
              disabled={openingPortal}
              onPress={manageBilling}
              style={styles.primaryButton}>
              {openingPortal ? (
                <ActivityIndicator color={COLORS.white100} />
              ) : (
                <Text style={styles.primaryButtonText}>Manage billing</Text>
              )}
            </Pressable>
            <Pressable
              disabled={cancelling || resuming}
              onPress={subscription?.onGracePeriod ? resume : cancel}
              style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>
                {subscription?.onGracePeriod
                  ? 'Resume subscription'
                  : 'Cancel subscription'}
              </Text>
            </Pressable>
          </>
        )}

        <Pressable onPress={refreshStatus} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh status</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const SubscriptionScreenFixed = props => (
  <SubscriptionErrorBoundary navigation={props.navigation}>
    <SubscriptionContent {...props} />
  </SubscriptionErrorBoundary>
);

export default SubscriptionScreenFixed;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: COLORS.foreground,
    fontSize: 30,
    lineHeight: 32,
  },
  headerTitle: {
    flex: 1,
    color: COLORS.foreground,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  title: {
    color: COLORS.foreground,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
  },
  copy: {
    color: COLORS.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  packageCard: {
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.xxl,
    marginTop: 28,
    padding: 20,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  packageName: {
    flex: 1,
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  badge: {
    backgroundColor: 'rgba(61, 220, 132, 0.12)',
    borderColor: COLORS.success,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  warningBadge: {
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
    borderColor: COLORS.actionOrange,
  },
  warningBadgeText: {
    color: COLORS.actionOrange,
  },
  price: {
    color: COLORS.foreground,
    fontSize: 38,
    fontWeight: '700',
    marginTop: 18,
  },
  billingCycle: {
    color: COLORS.mute,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
    textTransform: 'uppercase',
  },
  paymentMethod: {
    color: COLORS.body,
    fontSize: 13,
    marginTop: 14,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  loadingText: {
    color: COLORS.body,
    marginLeft: 10,
  },
  errorText: {
    color: COLORS.destructive,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
  },
  sectionTitle: {
    color: COLORS.mute,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 28,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  check: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: '700',
    marginRight: 12,
  },
  perkText: {
    flex: 1,
    color: COLORS.foreground,
    fontSize: 15,
  },
  pendingText: {
    color: COLORS.primary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  primaryButton: {
    minHeight: 52,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: COLORS.white100,
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  disabledButton: {
    backgroundColor: COLORS.border,
    opacity: 0.7,
  },
  secondaryButton: {
    minHeight: 48,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: COLORS.foreground,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  refreshButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 4,
  },
  refreshText: {
    color: COLORS.mute,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  errorPage: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
});
