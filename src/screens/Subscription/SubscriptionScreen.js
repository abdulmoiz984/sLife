import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
//------------------
import {Typography} from '../../atomComponents';
import {Button, AppLogo, ScreenOverlayLoader} from '../../components';
import {Icon, Overline, ShimmerBlock} from '../../components/slife';
import {COLORS, RADIUS} from '../../globalStyle/Theme';
import {paywallBg} from '../../assets/images';
import {useCustomQuery} from '../../query/useCustomQuery';
import {useCustomMutation} from '../../query/useCustomMutation';
import {
  activateTrial,
  cancelSubscription,
  createBillingPortal,
  createPaymentSheet,
  getPackages,
  resumeSubscription,
} from '../../api/subscriptionService';
import {useSubscriptionMe} from '../../hooks/useSubscriptionMe';
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
  'Unlimited profile views',
  'Unlimited connection requests',
  'Unlimited messaging',
  'AI-powered recommendations',
  'Advanced search filters',
  'Priority verification support',
];

/** Load Stripe only when paying — keeps this screen opening reliably. */
function getStripe() {
  // eslint-disable-next-line global-require
  return require('@stripe/stripe-react-native');
}

const SubscriptionScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [pendingWebhook, setPendingWebhook] = useState(false);

  const {
    subscription,
    isSubscribed,
    refetch: refetchStatus,
  } = useSubscriptionMe();

  const {data: packagesRes, refetch: refetchPackages} = useCustomQuery({
    queryKey: PACKAGES_KEY,
    queryFn: getPackages,
  });

  const pkg = useMemo(() => {
    const list = unwrapPackages(packagesRes).map(mapPackage).filter(Boolean);
    return list.find(p => p.isCheckoutReady) || list[0] || null;
  }, [packagesRes]);

  const displayPkg = pkg || subscription?.package || null;

  useFocusEffect(
    useCallback(() => {
      refetchStatus();
      refetchPackages();
    }, [refetchStatus, refetchPackages]),
  );

  const perks =
    displayPkg?.featureLabels?.length > 0
      ? displayPkg.featureLabels
      : FALLBACK_PERKS;

  const priceLabel =
    displayPkg?.formattedPrice ||
    (displayPkg?.price != null ? `$${displayPkg.price}` : null) ||
    '$9.99';

  const ctaLabel = subscribeCtaLabel(displayPkg);
  const canCheckout = !!pkg?.id && pkg.isCheckoutReady && !isSubscribed;

  const badgeLabel = !isSubscribed
    ? displayPkg?.trialDays > 0
      ? `${displayPkg.trialDays}-day trial`
      : 'Most popular'
    : subscription?.onGracePeriod
      ? 'Cancelling'
      : subscription?.onTrial
        ? 'On trial'
        : 'Subscribed';

  const badgeColor = !isSubscribed
    ? COLORS.primary
    : subscription?.onGracePeriod
      ? COLORS.actionOrange
      : COLORS.success;

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
    try {
      await invalidateSubscriptionQueries();
      await refetchStatus();
      showMessage({type: 'success', message: 'Subscription status updated.'});
    } catch (_) {
      showMessage({
        type: 'danger',
        message: 'Could not refresh subscription status.',
      });
    }
  };

  const subscribe = async () => {
    if (!canCheckout || busy) return;
    setBusy(true);
    setPendingWebhook(false);
    try {
      const res = await createPaymentSheet(pkg.id);
      const sheet = res?.payment_sheet;
      if (!sheet?.intent_client_secret || !sheet?.publishable_key) {
        throw new Error(res?.message || 'Unable to initialize payment.');
      }

      const {
        initStripe,
        initPaymentSheet,
        presentPaymentSheet,
      } = getStripe();

      await initStripe({
        publishableKey: sheet.publishable_key,
        urlScheme: 'slife',
      });

      const intent =
        sheet.intent_type === 'payment'
          ? {paymentIntentClientSecret: sheet.intent_client_secret}
          : {setupIntentClientSecret: sheet.intent_client_secret};

      const {error: initError} = await initPaymentSheet({
        merchantDisplayName: 'SLife',
        customerId: sheet.customer_id,
        customerSessionClientSecret: sheet.customer_session_client_secret,
        returnURL: STRIPE_RETURN_URL,
        allowsDelayedPaymentMethods: false,
        ...intent,
      });
      if (initError) throw new Error(initError.message);

      const {error: paymentError} = await presentPaymentSheet();
      if (paymentError) {
        if (paymentError.code === 'Canceled') return;
        throw new Error(paymentError.message);
      }

      if (sheet.requires_subscription_activation && sheet.setup_intent_id) {
        await activateTrial(pkg.id, sheet.setup_intent_id);
      }

      const active = await waitForSubscriptionActive();
      if (active?.isSubscribed) {
        showMessage({
          type: 'success',
          message: 'Welcome to SLife Membership.',
        });
        return;
      }

      setPendingWebhook(true);
      showMessage({
        type: 'default',
        title: 'Payment received',
        message:
          'Your membership is activating. Tap Refresh status in a moment.',
      });
    } catch (err) {
      showMessage({
        type: 'danger',
        message:
          err?.response?.data?.message ||
          err?.response?.data?.errors?.package_id?.[0] ||
          err?.message ||
          'Checkout failed. Please try again.',
      });
    } finally {
      setBusy(false);
      await invalidateSubscriptionQueries();
    }
  };

  const confirmCancel = () => {
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
              const res = await runCancel();
              await invalidateSubscriptionQueries();
              showMessage({
                type: 'success',
                message: res?.message || 'Subscription cancelled.',
              });
            } catch (err) {
              showMessage({
                type: 'danger',
                message:
                  err?.response?.data?.message ||
                  'Could not cancel subscription.',
              });
            }
          },
        },
      ],
    );
  };

  const onResume = async () => {
    try {
      const res = await runResume();
      await invalidateSubscriptionQueries();
      showMessage({
        type: 'success',
        message: res?.message || 'Subscription resumed.',
      });
    } catch (err) {
      showMessage({
        type: 'danger',
        message:
          err?.response?.data?.message || 'Could not resume subscription.',
      });
    }
  };

  const onManageBilling = async () => {
    try {
      const res = await runPortal();
      const url = res?.portal_url || res?.url || res?.data?.portal_url;
      if (!url) throw new Error(res?.message || 'Billing portal unavailable.');
      await openPortalUrl(url);
    } catch (err) {
      showMessage({
        type: 'danger',
        message:
          err?.response?.data?.message ||
          err?.message ||
          'Could not open portal.',
      });
    } finally {
      invalidateSubscriptionQueries().catch(() => {});
    }
  };

  const overlayBusy = busy || cancelling || resuming || openingPortal;

  return (
    <View style={styles.root}>
      <Image source={paywallBg} style={styles.bg} resizeMode="cover" />
      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(10,10,10,0.70)',
          'rgba(10,10,10,0.55)',
          COLORS.background,
        ]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header always outside ScrollView so it cannot disappear */}
      <View style={[styles.header, {paddingTop: insets.top + 16}]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Icon.Close size={20} color={COLORS.foreground} />
        </Pressable>
        <AppLogo size={28} />
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.body,
          {paddingBottom: Math.max(insets.bottom, 16) + 32},
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.preview}>
          <ShimmerBlock height={80} style={styles.previewShimmer} />
          <ShimmerBlock height={12} width="66%" style={styles.previewLine} />
          <ShimmerBlock height={12} width="50%" />
          <View style={styles.previewLock}>
            <View style={styles.lockBox}>
              <Icon.Lock size={20} color={COLORS.primary} />
            </View>
          </View>
        </View>

        <Overline>Membership</Overline>
        <Typography
          fixed
          size={34}
          fFamily="spaceGroteskBold700"
          color={COLORS.foreground}
          mT={8}
          LineHeight={36}
          style={styles.headline}>
          {isSubscribed ? 'Your membership' : 'Unlock full access.'}
        </Typography>
        <Typography
          fixed
          size={14}
          color={COLORS.body}
          mT={12}
          LineHeight={20}
          style={styles.lead}>
          {isSubscribed
            ? subscription?.onGracePeriod
              ? `Access continues until ${
                  subscription.endsAt
                    ? new Date(subscription.endsAt).toLocaleDateString()
                    : 'period end'
                }.`
              : subscription?.onTrial
                ? 'You are on a free trial. Billing starts after the trial unless you cancel.'
                : 'You have full access to messaging and advanced discovery.'
            : 'Move beyond browse-mode. Message, match, and mine the full directory of verified leaders.'}
        </Typography>

        <View style={styles.perks}>
          {perks.map(p => (
            <View key={p} style={styles.perk}>
              <Icon.Check size={16} color={COLORS.primary} strokeWidth={2.5} />
              <Typography
                fixed
                size={14}
                color={COLORS.foreground}
                style={styles.perkText}>
                {p}
              </Typography>
            </View>
          ))}
        </View>

        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <View style={styles.priceCopy}>
              <Typography
                fixed
                size={12}
                fFamily="interSemiBold600"
                color={COLORS.mute}
                textTransform="uppercase"
                style={styles.track}>
                {displayPkg?.name || 'SLife Membership'}
              </Typography>
              <Typography
                fixed
                size={36}
                fFamily="spaceGroteskBold700"
                color={COLORS.foreground}
                mT={6}
                LineHeight={36}>
                {String(priceLabel).replace(/\/mo$/i, '')}
              </Typography>
              <Typography
                fixed
                size={12}
                color={COLORS.mute}
                textTransform="uppercase"
                mT={4}
                style={styles.track}>
                {displayPkg?.billingCycle === 'yearly'
                  ? 'Per year'
                  : 'Per month'}
              </Typography>
            </View>
            <View
              style={[
                styles.badge,
                isSubscribed && {borderColor: badgeColor},
                isSubscribed &&
                  !subscription?.onGracePeriod &&
                  styles.badgeSubscribed,
                subscription?.onGracePeriod && styles.badgeWarn,
              ]}>
              <Typography
                fixed
                size={11}
                fFamily="interSemiBold600"
                color={badgeColor}
                textTransform="uppercase"
                style={styles.track}>
                {badgeLabel}
              </Typography>
            </View>
          </View>

          {isSubscribed && subscription?.paymentMethod?.lastFour ? (
            <Typography fixed size={12} color={COLORS.body} mT={12}>
              {subscription.paymentMethod.type || 'Card'} ····{' '}
              {subscription.paymentMethod.lastFour}
            </Typography>
          ) : (
            <Typography fixed size={12} color={COLORS.body} mT={12}>
              {isSubscribed
                ? 'Manage payment methods and invoices in the billing portal.'
                : displayPkg?.trialDays > 0
                  ? `Billed after your ${displayPkg.trialDays}-day trial unless cancelled. Cancel anytime.`
                  : 'Billed monthly. Cancel anytime.'}
            </Typography>
          )}

          {pendingWebhook && !isSubscribed ? (
            <Typography fixed size={12} color={COLORS.primary} mT={10}>
              Activation pending — tap Refresh status in a moment.
            </Typography>
          ) : null}

          {!isSubscribed ? (
            <>
              <View style={styles.subscribeBtn}>
                <Button
                  label={!pkg ? 'Loading package…' : ctaLabel}
                  onPress={subscribe}
                  disabled={!canCheckout || busy}
                  loader={busy}
                />
              </View>
              <Pressable
                style={styles.restore}
                hitSlop={8}
                onPress={refreshStatus}>
                <Typography
                  fixed
                  size={11}
                  fFamily="interSemiBold600"
                  color={COLORS.mute}
                  textTransform="uppercase"
                  textAlign="center"
                  style={styles.track}>
                  Refresh status
                </Typography>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.subscribeBtn}>
                <Button
                  label="Manage billing"
                  onPress={onManageBilling}
                  loader={openingPortal}
                />
              </View>
              {subscription?.onGracePeriod ? (
                <View style={styles.secondaryBtn}>
                  <Button
                    type="outline"
                    label="Resume subscription"
                    onPress={onResume}
                    loader={resuming}
                  />
                </View>
              ) : (
                <Pressable
                  style={styles.restore}
                  hitSlop={8}
                  onPress={confirmCancel}>
                  <Typography
                    fixed
                    size={11}
                    fFamily="interSemiBold600"
                    color={COLORS.mute}
                    textTransform="uppercase"
                    textAlign="center"
                    style={styles.track}>
                    Cancel subscription
                  </Typography>
                </Pressable>
              )}
              <Pressable
                style={styles.restore}
                hitSlop={8}
                onPress={refreshStatus}>
                <Typography
                  fixed
                  size={11}
                  fFamily="interSemiBold600"
                  color={COLORS.mute}
                  textTransform="uppercase"
                  textAlign="center"
                  style={styles.track}>
                  Refresh status
                </Typography>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      <ScreenOverlayLoader visible={overlayBusy} />
    </View>
  );
};

export default SubscriptionScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    zIndex: 2,
    ...Platform.select({
      android: {elevation: 2},
      default: {},
    }),
  },
  spacer: {width: 20},
  scroll: {
    flex: 1,
    zIndex: 2,
    ...Platform.select({
      android: {elevation: 2},
      default: {},
    }),
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  preview: {
    marginBottom: 32,
    backgroundColor: 'rgba(20,20,20,0.8)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  previewShimmer: {marginBottom: 12},
  previewLine: {marginBottom: 8},
  previewLock: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBox: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {letterSpacing: -0.5},
  lead: {maxWidth: 320},
  perks: {marginTop: 24},
  perk: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  perkText: {marginLeft: 12},
  priceCard: {
    marginTop: 32,
    marginBottom: 8,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  priceCopy: {flex: 1, minWidth: 0, paddingRight: 12},
  badge: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeSubscribed: {
    backgroundColor: 'rgba(61, 220, 132, 0.12)',
  },
  badgeWarn: {
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
  },
  track: {letterSpacing: 0.88},
  subscribeBtn: {marginTop: 16},
  secondaryBtn: {marginTop: 10},
  restore: {
    marginTop: 12,
    alignItems: 'center',
  },
});
