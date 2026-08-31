import React, {Component, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
  FALLBACK_FEATURE_LABELS,
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

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 64, 340);
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

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
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const carouselRef = useRef(null);

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

  const packages = useMemo(() => {
    return unwrapPackages(packagesResponse)
      .map(mapPackage)
      .filter(Boolean);
  }, [packagesResponse]);

  const selectedPackage = useMemo(() => {
    if (selectedPackageId != null) {
      const found = packages.find(item => item.id === selectedPackageId);
      if (found) return found;
    }
    return packages.find(item => item.isCheckoutReady) || packages[0] || null;
  }, [packages, selectedPackageId]);

  const displayPackage = isSubscribed
    ? subscription?.package || packages[0] || null
    : selectedPackage;

  const globalFeatures =
    displayPackage?.featureLabels?.length > 0
      ? displayPackage.featureLabels
      : FALLBACK_FEATURE_LABELS;

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

  const handleSelectPackage = (pkg, index) => {
    if (!pkg.isCheckoutReady) return;
    setSelectedPackageId(pkg.id);
    carouselRef.current?.scrollTo({
      x: index * SNAP_INTERVAL,
      animated: true,
    });
  };

  const onMomentumScrollEnd = e => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    if (packages[index] && packages[index].isCheckoutReady) {
      setSelectedPackageId(packages[index].id);
    }
  };

  const subscribe = async () => {
    if (!selectedPackage?.id || !selectedPackage.isCheckoutReady || busy) return;

    setBusy(true);
    setPendingWebhook(false);
    try {
      const response = await createPaymentSheet(selectedPackage.id);
      const sheet = response?.payment_sheet;
      if (!sheet?.intent_client_secret || !sheet?.publishable_key) {
        throw new Error(response?.message || 'Unable to initialize payment.');
      }

      const merchantId = sheet.merchant_identifier || 'merchant.com.slife';

      await initStripe({
        publishableKey: sheet.publishable_key,
        merchantIdentifier: merchantId,
        urlScheme: 'slife',
      });

      const clientSecret =
        sheet.intent_type === 'payment'
          ? {paymentIntentClientSecret: sheet.intent_client_secret}
          : {setupIntentClientSecret: sheet.intent_client_secret};

      const sheetParams = {
        merchantDisplayName: 'SLife',
        customerId: sheet.customer_id,
        customerSessionClientSecret: sheet.customer_session_client_secret,
        returnURL: STRIPE_RETURN_URL,
        allowsDelayedPaymentMethods: false,
        applePay: {
          merchantCountryCode: 'US',
        },
        ...clientSecret,
      };

      let {error: setupError} = await initPaymentSheet(sheetParams);
      if (setupError && setupError.message?.includes('merchantIdentifier')) {
        delete sheetParams.applePay;
        const fallback = await initPaymentSheet(sheetParams);
        setupError = fallback.error;
      }
      if (setupError) throw new Error(setupError.message);

      const {error: paymentError} = await presentPaymentSheet();
      if (paymentError?.code === 'Canceled') return;
      if (paymentError) throw new Error(paymentError.message);

      if (sheet.requires_subscription_activation && sheet.setup_intent_id) {
        await activateTrial(selectedPackage.id, sheet.setup_intent_id);
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
            : 'Swipe and choose the plan that fits your networking goals.'}
        </Text>

        {isSubscribed ? (
          /* Subscribed Card View */
          <View style={styles.packageCard}>
            <View style={styles.packageHeader}>
              <Text style={styles.packageName}>
                {displayPackage?.name || 'SLife Membership'}
              </Text>
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
            </View>

            <Text style={styles.price}>
              {displayPackage?.formattedPrice ||
                (displayPackage?.price != null ? `$${displayPackage.price}` : '—')}
            </Text>
            <Text style={styles.billingCycle}>
              {displayPackage?.billingCycle === 'yearly'
                ? 'Per year'
                : 'Per month'}
            </Text>

            {subscription?.paymentMethod?.lastFour ? (
              <Text style={styles.paymentMethod}>
                {subscription.paymentMethod.type || 'Card'} ending in{' '}
                {subscription.paymentMethod.lastFour}
              </Text>
            ) : null}

            {displayPackage?.description && displayPackage.description.length > 0 ? (
              <View style={styles.packageBullets}>
                {displayPackage.description.map((item, idx) => (
                  <View key={`${item}-${idx}`} style={styles.descRow}>
                    <Text style={styles.descCheck}>✓</Text>
                    <Text style={styles.descText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          /* Carousel Package Cards */
          <View style={styles.carouselContainer}>
            <ScrollView
              ref={carouselRef}
              horizontal
              pagingEnabled={false}
              snapToInterval={SNAP_INTERVAL}
              snapToAlignment="start"
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselScrollContent}
              onMomentumScrollEnd={onMomentumScrollEnd}>
              {packages.map((item, index) => {
                const isSelected = selectedPackage?.id === item.id;
                const hasTrial = item.trialDays > 0;
                const formattedPrice =
                  item.formattedPrice ||
                  (item.price != null ? `$${item.price}` : '—');

                return (
                  <Pressable
                    key={item.id}
                    disabled={!item.isCheckoutReady}
                    onPress={() => handleSelectPackage(item, index)}
                    style={[
                      styles.carouselCard,
                      isSelected && styles.selectedCard,
                      !item.isCheckoutReady && styles.disabledCard,
                    ]}>
                    <View style={styles.selectableCardHeader}>
                      <View style={styles.radioAndTitle}>
                        <View
                          style={[
                            styles.radioOuter,
                            isSelected && styles.radioOuterSelected,
                          ]}>
                          {isSelected ? <View style={styles.radioInner} /> : null}
                        </View>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.selectableCardName,
                            isSelected && styles.selectedCardName,
                          ]}>
                          {item.name}
                        </Text>
                      </View>

                      {hasTrial ? (
                        <View style={styles.trialBadge}>
                          <Text style={styles.trialBadgeText}>
                            {item.trialDays}-day trial
                          </Text>
                        </View>
                      ) : !item.isCheckoutReady ? (
                        <View style={styles.unavailableBadge}>
                          <Text style={styles.unavailableBadgeText}>
                            Unavailable
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.priceRow}>
                      <Text style={styles.selectablePrice}>
                        {String(formattedPrice).replace(/\/mo$/i, '').replace(/\/yr$/i, '')}
                      </Text>
                      <Text style={styles.selectableCycle}>
                        {item.billingCycle === 'yearly' ? ' / year' : ' / month'}
                      </Text>
                    </View>

                    {item.description && item.description.length > 0 ? (
                      <View style={styles.packageBullets}>
                        {item.description.map((bullet, idx) => (
                          <View key={`${bullet}-${idx}`} style={styles.descRow}>
                            <Text style={styles.descCheck}>✓</Text>
                            <Text style={styles.descText}>{bullet}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            {packages.length > 1 ? (
              <View style={styles.paginationDots}>
                {packages.map((item, index) => {
                  const isSelected = selectedPackage?.id === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      hitSlop={8}
                      onPress={() => handleSelectPackage(item, index)}
                      style={[styles.dot, isSelected && styles.activeDot]}
                    />
                  );
                })}
              </View>
            ) : null}

            {!packages.length && loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading packages…</Text>
              </View>
            ) : null}

            {!packages.length && packagesError ? (
              <Text style={styles.errorText}>
                Package details could not be loaded. Tap Refresh status.
              </Text>
            ) : null}
          </View>
        )}

        {isSubscribed ? (
          <>
            <Text style={styles.sectionTitle}>Included in your plan</Text>
            {globalFeatures.map((perk, idx) => (
              <View key={`${perk}-${idx}`} style={styles.perkRow}>
                <Text style={styles.check}>✓</Text>
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </>
        ) : null}

        {pendingWebhook ? (
          <Text style={styles.pendingText}>
            Payment received. Activation is pending; refresh again shortly.
          </Text>
        ) : null}

        {!isSubscribed ? (
          <>
            <Pressable
              disabled={!selectedPackage?.id || !selectedPackage.isCheckoutReady || busy}
              onPress={subscribe}
              style={[
                styles.primaryButton,
                (!selectedPackage?.id || !selectedPackage.isCheckoutReady || busy) &&
                  styles.disabledButton,
              ]}>
              {busy ? (
                <ActivityIndicator color={COLORS.white100} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {selectedPackage
                    ? subscribeCtaLabel(selectedPackage)
                    : 'Select a package'}
                </Text>
              )}
            </Pressable>
            <Text style={styles.paymentMethodsHint}>
              Accepts Credit/Debit Cards, Apple Pay & Cash App
            </Text>
          </>
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
  carouselContainer: {
    marginTop: 24,
  },
  carouselScrollContent: {
    gap: CARD_GAP,
    paddingVertical: 4,
  },
  carouselCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.elevated,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: 16,
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 126, 0, 0.05)',
  },
  disabledCard: {
    opacity: 0.5,
  },
  selectableCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.mute,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  selectableCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    flex: 1,
  },
  selectedCardName: {
    color: COLORS.primary,
  },
  trialBadge: {
    backgroundColor: 'rgba(255, 126, 0, 0.12)',
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  trialBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  unavailableBadge: {
    backgroundColor: 'rgba(150, 150, 150, 0.12)',
    borderColor: COLORS.mute,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  unavailableBadgeText: {
    color: COLORS.mute,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
    marginLeft: 30,
  },
  selectablePrice: {
    color: COLORS.foreground,
    fontSize: 26,
    fontWeight: '700',
  },
  selectableCycle: {
    color: COLORS.mute,
    fontSize: 13,
    fontWeight: '600',
  },
  packageBullets: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    marginLeft: 30,
    gap: 6,
  },
  descRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  descCheck: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
  descText: {
    color: COLORS.body,
    fontSize: 13,
    flex: 1,
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 4,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  activeDot: {
    width: 22,
    backgroundColor: COLORS.primary,
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
  paymentMethodsHint: {
    color: COLORS.mute,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
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
