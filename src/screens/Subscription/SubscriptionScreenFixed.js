import React, { Component, useEffect, useMemo, useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  confirmPayment,
  initPaymentSheet,
  initStripe,
  presentPaymentSheet,
} from '@stripe/stripe-react-native';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { queryClient } from '../../api/api';
import { useCustomQuery } from '../../query/useCustomQuery';
import { useCustomMutation } from '../../query/useCustomMutation';
import { useSubscriptionMe } from '../../hooks/useSubscriptionMe';
import { useSubscriptionEnabled } from '../../hooks/useSubscriptionEnabled';
import { refreshAppConfig } from '../../helpers/appConfig';
import {
  activateTrial,
  cancelSubscription,
  changeSubscriptionPlan,
  createBillingPortal,
  createPaymentSheet,
  getPackages,
  resumeSubscription,
} from '../../api/subscriptionService';
import {
  PACKAGES_KEY,
  PORTAL_RETURN_URL,
  STRIPE_RETURN_URL,
  SUBSCRIPTION_ME_KEY,
  formatMessageAllowance,
  getPlanChangeConfirmCopy,
  getPlanChangeCtaLabel,
  getMonthlyEquivalentPrice,
  getPlanChangeType,
  getStripePublishableKey,
  invalidateSubscriptionQueries,
  mapPackage,
  openPortalUrl,
  saveStripePublishableKey,
  subscribeCtaLabel,
  unwrapPackages,
  waitForSubscriptionActive,
} from '../../helpers/subscriptionHelpers';
import { showMessage } from '../../utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 64, 340);
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

const currencySymbol = currency =>
  !currency || String(currency).toUpperCase() === 'USD' ? '$' : `${currency} `;

const formatMoney = (amount, currency) => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  return `${currencySymbol(currency)}${n.toFixed(2).replace(/\.00$/, '')}`;
};

/** Price without the "/mo" or "/yr" suffix. */
const priceOnly = pkg => {
  if (!pkg) return '—';
  if (pkg.formattedPrice) {
    return String(pkg.formattedPrice).replace(/\s*\/\s*(mo|yr)$/i, '');
  }
  return pkg.price != null ? formatMoney(pkg.price, pkg.currency) : '—';
};

const formatDate = value => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = value => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return sameDay ? `today at ${time}` : `${formatDate(value)} at ${time}`;
};

class SubscriptionErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
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

const SubscriptionContent = ({ navigation }) => {
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

  const currentPackageId = subscription?.package?.id ?? null;

  const selectedPackage = useMemo(() => {
    if (selectedPackageId != null) {
      const found = packages.find(item => item.id === selectedPackageId);
      if (found && (!isSubscribed || found.id !== currentPackageId)) {
        return found;
      }
    }
    // Subscribed users must explicitly pick a plan to change to.
    if (isSubscribed) return null;
    return packages.find(item => item.isCheckoutReady) || packages[0] || null;
  }, [packages, selectedPackageId, isSubscribed, currentPackageId]);

  const displayPackage = useMemo(() => {
    if (!isSubscribed) return selectedPackage;
    const subPkg = subscription?.package;
    const matchedPkg = subPkg?.id
      ? packages.find(item => item.id === subPkg.id)
      : packages[0];
    if (subPkg && matchedPkg) {
      return {
        ...matchedPkg,
        ...subPkg,
        description:
          subPkg.description?.length > 0
            ? subPkg.description
            : matchedPkg.description,
        dailyMessageLimit:
          subPkg.dailyMessageLimit ?? matchedPkg.dailyMessageLimit,
        messageLimitLabel:
          subPkg.messageLimitLabel || matchedPkg.messageLimitLabel,
      };
    }
    return subPkg || matchedPkg || null;
  }, [isSubscribed, subscription, packages, selectedPackage]);

  const messageAllowanceText = useMemo(
    () => formatMessageAllowance(subscription, displayPackage),
    [subscription, displayPackage],
  );

  const otherPackages = useMemo(
    () => (isSubscribed ? packages.filter(item => item.id !== currentPackageId) : []),
    [isSubscribed, packages, currentPackageId],
  );

  const allowance = useMemo(() => {
    const ma = subscription?.messageAllowance;
    if (!ma) return null;
    if (ma.unlimited || ma.limit != null) return ma;
    return null;
  }, [subscription]);

  const allowancePercent = useMemo(() => {
    if (!allowance || allowance.unlimited || !allowance.limit) return 0;
    const used =
      allowance.remaining != null
        ? allowance.limit - allowance.remaining
        : allowance.used;
    return Math.min(100, Math.max(0, Math.round((used / allowance.limit) * 100)));
  }, [allowance]);

  const statusLine = useMemo(() => {
    if (!subscription) return null;
    if (subscription.onGracePeriod) {
      const date = formatDate(subscription.endsAt);
      return date ? `Access ends ${date}` : 'Cancels at period end';
    }
    if (subscription.onTrial) {
      const date = formatDate(subscription.trialEndsAt);
      return date ? `Free trial ends ${date}` : 'Free trial active';
    }
    return 'Renews automatically';
  }, [subscription]);

  const statusColor = subscription?.onGracePeriod
    ? COLORS.actionOrange
    : subscription?.onTrial
      ? COLORS.verified
      : COLORS.success;

  const loading = statusLoading || packagesLoading;

  const { mutateAsync: runCancel, isPending: cancelling } = useCustomMutation({
    mutationFn: cancelSubscription,
  });
  const { mutateAsync: runResume, isPending: resuming } = useCustomMutation({
    mutationFn: resumeSubscription,
  });
  const { mutateAsync: runPortal, isPending: openingPortal } = useCustomMutation({
    mutationFn: () => createBillingPortal(PORTAL_RETURN_URL),
  });
  const { mutateAsync: runChangePlan, isPending: changingPlan } =
    useCustomMutation({
      mutationFn: changeSubscriptionPlan,
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
    if (isSubscribed) {
      if (pkg.id === currentPackageId) return;
      // Tap again to deselect in the plan-change list.
      setSelectedPackageId(prev => (prev === pkg.id ? null : pkg.id));
      return;
    }
    setSelectedPackageId(pkg.id);
    carouselRef.current?.scrollTo({
      x: index * SNAP_INTERVAL,
      animated: true,
    });
  };

  const onMomentumScrollEnd = e => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    const candidate = packages[index];
    if (
      candidate &&
      candidate.isCheckoutReady &&
      (!isSubscribed || candidate.id !== currentPackageId)
    ) {
      setSelectedPackageId(candidate.id);
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
      saveStripePublishableKey(sheet.publishable_key);

      await initStripe({
        publishableKey: sheet.publishable_key,
        merchantIdentifier: merchantId,
        urlScheme: 'slife',
      });

      const clientSecret =
        sheet.intent_type === 'payment'
          ? { paymentIntentClientSecret: sheet.intent_client_secret }
          : { setupIntentClientSecret: sheet.intent_client_secret };

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

      let { error: setupError } = await initPaymentSheet(sheetParams);
      if (setupError && setupError.message?.includes('merchantIdentifier')) {
        delete sheetParams.applePay;
        const fallback = await initPaymentSheet(sheetParams);
        setupError = fallback.error;
      }
      if (setupError) throw new Error(setupError.message);

      const { error: paymentError } = await presentPaymentSheet();
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

  const executeChangePlan = async targetPkg => {
    if (!targetPkg?.id || busy || changingPlan) return;
    setBusy(true);
    try {
      const response = await runChangePlan(targetPkg.id);

      if (response?.requires_action && response?.payment_intent_client_secret) {
        // Server-provided key only: change-plan response, else the key saved
        // from this device's last POST /subscriptions/payment-sheet.
        const pubKey =
          response?.publishable_key ||
          response?.payment_sheet?.publishable_key ||
          subscription?.raw?.publishable_key ||
          getStripePublishableKey();
        if (!pubKey) {
          throw new Error(
            'Your plan was changed, but your bank needs extra verification. Open Payment methods & invoices to complete the payment.',
          );
        }
        saveStripePublishableKey(pubKey);
        await initStripe({
          publishableKey: pubKey,
          merchantIdentifier: 'merchant.com.slife',
          urlScheme: 'slife',
        });
        const { error: confirmError } = await confirmPayment(
          response.payment_intent_client_secret,
        );
        if (confirmError) {
          throw new Error(
            confirmError.message ||
            'Additional payment confirmation could not be completed.',
          );
        }
      } else if (response?.subscription) {
        queryClient.setQueryData(SUBSCRIPTION_ME_KEY, response);
      }

      setSelectedPackageId(null);
      await refreshStatus();
      showMessage({
        type: 'success',
        message: response?.message || 'Subscription plan updated.',
      });
    } catch (error) {
      await refreshStatus();
      showMessage({
        type: 'danger',
        message:
          error?.response?.data?.errors?.package_id?.[0] ||
          error?.response?.data?.errors?.subscription?.[0] ||
          error?.response?.data?.message ||
          error?.message ||
          'Could not change subscription plan. Please try again.',
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmChangePlan = () => {
    if (
      !selectedPackage?.id ||
      !selectedPackage.isCheckoutReady ||
      selectedPackage.id === currentPackageId ||
      busy ||
      changingPlan
    ) {
      return;
    }
    const changeType = getPlanChangeType(displayPackage, selectedPackage);
    const title = getPlanChangeCtaLabel(displayPackage, selectedPackage);
    const copy = getPlanChangeConfirmCopy(changeType);
    const actionLabel =
      changeType === 'upgrade'
        ? 'Upgrade'
        : changeType === 'downgrade'
          ? 'Downgrade'
          : 'Switch plan';

    Alert.alert(title, copy, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: actionLabel,
        onPress: () => executeChangePlan(selectedPackage),
      },
    ]);
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
        { text: 'Keep plan', style: 'cancel' },
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

  const canChangePlan =
    !!selectedPackage?.id &&
    selectedPackage.isCheckoutReady &&
    selectedPackage.id !== currentPackageId &&
    !busy &&
    !changingPlan;

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
            ? 'Manage your plan, billing and daily message allowance.'
            : 'Swipe and choose the plan that fits your networking goals.'}
        </Text>

        {isSubscribed ? (
          <>
            {subscription?.onGracePeriod ? (
              <View style={styles.noticeBanner}>
                <Text style={styles.noticeTitle}>Your plan is set to end</Text>
                <Text style={styles.noticeText}>
                  You keep full access until{' '}
                  {formatDate(subscription.endsAt) || 'the end of this billing period'}.
                  Resume anytime before then to keep your membership.
                </Text>
                <Pressable
                  disabled={resuming}
                  onPress={resume}
                  style={styles.noticeButton}>
                  {resuming ? (
                    <ActivityIndicator color={COLORS.white100} />
                  ) : (
                    <Text style={styles.noticeButtonText}>Resume subscription</Text>
                  )}
                </Pressable>
              </View>
            ) : null}

            {/* Current plan */}
            <View style={styles.currentCard}>
              <View style={styles.currentHeader}>
                <View style={styles.flex1}>
                  <Text style={styles.currentLabel}>Current plan</Text>
                  <Text style={styles.currentName} numberOfLines={1}>
                    {displayPackage?.name || 'SLife Membership'}
                  </Text>
                </View>
                <View style={[styles.statusPill, { borderColor: statusColor }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {badge}
                  </Text>
                </View>
              </View>

              <View style={styles.currentPriceRow}>
                <Text style={styles.currentPrice}>{priceOnly(displayPackage)}</Text>
                <Text style={styles.currentCycle}>
                  {displayPackage?.billingCycle === 'yearly' ? '/ year' : '/ month'}
                </Text>
              </View>

              {statusLine ? <Text style={styles.statusLine}>{statusLine}</Text> : null}

              {allowance ? (
                <View style={styles.allowanceBox}>
                  <View style={styles.allowanceHeader}>
                    <Text style={styles.allowanceLabel}>Daily messages</Text>
                    <Text style={styles.allowanceValue}>
                      {allowance.unlimited
                        ? 'Unlimited'
                        : allowance.remaining != null
                          ? `${allowance.remaining} of ${allowance.limit} left`
                          : `${allowance.limit} per day`}
                    </Text>
                  </View>
                  {!allowance.unlimited && allowance.limit > 0 ? (
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${allowancePercent}%` },
                          allowancePercent >= 90 && styles.progressFillWarn,
                        ]}
                      />
                    </View>
                  ) : null}
                  {allowance.resetsAt ? (
                    <Text style={styles.allowanceHint}>
                      Resets {formatTime(allowance.resetsAt)}
                    </Text>
                  ) : null}
                </View>
              ) : messageAllowanceText ? (
                <View style={styles.allowanceBox}>
                  <Text style={styles.allowanceLabel}>{messageAllowanceText}</Text>
                </View>
              ) : null}

              {subscription?.paymentMethod?.lastFour ? (
                <View style={styles.paymentRow}>
                  <View style={styles.cardChip}>
                    <Text style={styles.cardChipText}>
                      {String(subscription.paymentMethod.type || 'card').toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.paymentText}>
                    •••• {subscription.paymentMethod.lastFour}
                  </Text>
                </View>
              ) : null}

              {displayPackage?.description?.length > 0 ? (
                <View style={styles.currentBullets}>
                  {displayPackage.description.map((item, idx) => (
                    <View key={`${item}-${idx}`} style={styles.descRow}>
                      <Text style={styles.descCheck}>✓</Text>
                      <Text style={styles.descText}>{item}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {/* Change plan */}
            {otherPackages.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Change plan</Text>
                <Text style={styles.sectionSubcopy}>
                  Changes apply immediately. Stripe prorates the difference.
                </Text>

                {otherPackages.map(item => {
                  const isSelected = selectedPackage?.id === item.id;
                  const unavailable = !item.isCheckoutReady;
                  const changeType = getPlanChangeType(displayPackage, item);
                  const delta =
                    getMonthlyEquivalentPrice(item) -
                    getMonthlyEquivalentPrice(displayPackage);
                  const deltaText = unavailable
                    ? 'Currently unavailable'
                    : changeType === 'upgrade'
                      ? `+${formatMoney(delta, item.currency)} / mo`
                      : changeType === 'downgrade'
                        ? `Save ${formatMoney(Math.abs(delta), item.currency)} / mo`
                        : 'Same monthly price';

                  return (
                    <Pressable
                      key={item.id}
                      disabled={unavailable}
                      onPress={() => handleSelectPackage(item)}
                      style={[
                        styles.planRow,
                        isSelected && styles.planRowSelected,
                        unavailable && styles.disabledCard,
                      ]}>
                      <View style={styles.planRowTop}>
                        <View
                          style={[
                            styles.radioOuter,
                            isSelected && styles.radioOuterSelected,
                          ]}>
                          {isSelected ? <View style={styles.radioInner} /> : null}
                        </View>

                        <View style={styles.flex1}>
                          <View style={styles.planNameRow}>
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.planName,
                                isSelected && styles.selectedCardName,
                              ]}>
                              {item.name}
                            </Text>
                            {!unavailable ? (
                              <View
                                style={[
                                  styles.changeBadge,
                                  changeType === 'downgrade' && styles.downgradeBadge,
                                ]}>
                                <Text
                                  style={[
                                    styles.changeBadgeText,
                                    changeType === 'downgrade' &&
                                    styles.downgradeBadgeText,
                                  ]}>
                                  {changeType === 'upgrade'
                                    ? '↑ Upgrade'
                                    : changeType === 'downgrade'
                                      ? '↓ Downgrade'
                                      : 'Switch'}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <Text
                            style={[
                              styles.planDelta,
                              changeType === 'downgrade' && styles.planDeltaSave,
                            ]}>
                            {deltaText}
                          </Text>
                          {item.messageLimitLabel ? (
                            <Text style={styles.planMeta}>{item.messageLimitLabel}</Text>
                          ) : null}
                        </View>

                        <View style={styles.planPriceCol}>
                          <Text style={styles.planPrice}>{priceOnly(item)}</Text>
                          <Text style={styles.planCycle}>
                            {item.billingCycle === 'yearly' ? 'per year' : 'per month'}
                          </Text>
                        </View>
                      </View>

                      {isSelected && item.description?.length > 0 ? (
                        <View style={styles.planBullets}>
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
              </View>
            ) : null}

            {/* Actions */}
            {otherPackages.length > 0 ? (
              <Pressable
                disabled={!canChangePlan}
                onPress={confirmChangePlan}
                style={[styles.primaryButton, !canChangePlan && styles.disabledButton]}>
                {busy || changingPlan ? (
                  <ActivityIndicator color={COLORS.white100} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {selectedPackage
                      ? getPlanChangeCtaLabel(displayPackage, selectedPackage)
                      : 'Select a plan to change'}
                  </Text>
                )}
              </Pressable>
            ) : null}

            <Pressable
              disabled={openingPortal}
              onPress={manageBilling}
              style={
                otherPackages.length > 0 ? styles.secondaryButton : styles.primaryButton
              }>
              {openingPortal ? (
                <ActivityIndicator color={COLORS.white100} />
              ) : (
                <Text
                  style={
                    otherPackages.length > 0
                      ? styles.secondaryButtonText
                      : styles.primaryButtonText
                  }>
                  Payment methods & invoices
                </Text>
              )}
            </Pressable>

            {!subscription?.onGracePeriod ? (
              <Pressable
                disabled={cancelling}
                onPress={cancel}
                hitSlop={8}
                style={styles.linkButton}>
                <Text style={styles.cancelLinkText}>
                  {cancelling ? 'Cancelling…' : 'Cancel subscription'}
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <>
            {/* Paywall carousel */}
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
                            <Text style={styles.unavailableBadgeText}>Unavailable</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.priceRow}>
                        <Text style={styles.selectablePrice}>{priceOnly(item)}</Text>
                        <Text style={styles.selectableCycle}>
                          {item.billingCycle === 'yearly' ? ' / year' : ' / month'}
                        </Text>
                      </View>

                      {item.messageLimitLabel ? (
                        <Text style={styles.cardAllowanceHint}>
                          {item.messageLimitLabel}
                        </Text>
                      ) : null}

                      {item.description?.length > 0 ? (
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
                  {packages.map((item, index) => (
                    <Pressable
                      key={item.id}
                      hitSlop={8}
                      onPress={() => handleSelectPackage(item, index)}
                      style={[
                        styles.dot,
                        selectedPackage?.id === item.id && styles.activeDot,
                      ]}
                    />
                  ))}
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

            {pendingWebhook ? (
              <Text style={styles.pendingText}>
                Payment received. Activation is pending; refresh again shortly.
              </Text>
            ) : null}

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
                  {selectedPackage ? subscribeCtaLabel(selectedPackage) : 'Select a package'}
                </Text>
              )}
            </Pressable>
            <Text style={styles.paymentMethodsHint}>
              Accepts Credit/Debit Cards, Apple Pay & Cash App
            </Text>
          </>
        )}

        <Pressable onPress={refreshStatus} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh status</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const SubscriptionUnavailable = ({ navigation }) => (
  <SafeAreaView style={styles.safe}>
    <View style={styles.errorPage}>
      <Text style={styles.title}>Membership unavailable</Text>
      <Text style={styles.copy}>
        Membership is temporarily unavailable. Please check back later.
      </Text>
      <Pressable style={styles.primaryButton} onPress={() => navigation.goBack()}>
        <Text style={styles.primaryButtonText}>Go back</Text>
      </Pressable>
    </View>
  </SafeAreaView>
);

const SubscriptionScreenFixed = props => {
  const { subscriptionEnabled } = useSubscriptionEnabled();

  // Re-check GET /config every time the screen opens.
  useEffect(() => {
    refreshAppConfig();
  }, []);

  if (!subscriptionEnabled) {
    return <SubscriptionUnavailable navigation={props.navigation} />;
  }

  return (
    <SubscriptionErrorBoundary navigation={props.navigation}>
      <SubscriptionContent {...props} />
    </SubscriptionErrorBoundary>
  );
};

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
    backgroundColor: 'rgba(241, 0, 0, 0.06)',
  },
  currentPlanCard: {
    borderColor: COLORS.success,
    opacity: 0.78,
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
  radioOuterCurrent: {
    borderColor: COLORS.success,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioInnerCurrent: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
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
    backgroundColor: COLORS.primarySoft,
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
  downgradeBadge: {
    backgroundColor: 'rgba(150, 150, 150, 0.12)',
    borderColor: COLORS.body,
  },
  downgradeBadgeText: {
    color: COLORS.body,
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
  cardAllowanceHint: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginLeft: 30,
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
  allowancePill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  allowanceText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
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
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sectionSubcopy: {
    color: COLORS.body,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
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
  flex1: {
    flex: 1,
  },

  // --- Grace-period notice ---
  noticeBanner: {
    marginTop: 24,
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.45)',
    backgroundColor: 'rgba(234, 88, 12, 0.10)',
  },
  noticeTitle: {
    color: COLORS.foreground,
    fontSize: 14,
    fontWeight: '700',
  },
  noticeText: {
    color: COLORS.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  noticeButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.actionOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeButtonText: {
    color: COLORS.white100,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // --- Current plan card ---
  currentCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: 'rgba(241, 0, 0, 0.55)',
    backgroundColor: COLORS.elevated,
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currentLabel: {
    color: COLORS.mute,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  currentName: {
    color: COLORS.foreground,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
    marginRight: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
  },
  currentPrice: {
    color: COLORS.foreground,
    fontSize: 40,
    fontWeight: '800',
  },
  currentCycle: {
    color: COLORS.mute,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statusLine: {
    color: COLORS.body,
    fontSize: 13,
    marginTop: 4,
  },
  allowanceBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  allowanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  allowanceLabel: {
    color: COLORS.body,
    fontSize: 13,
    fontWeight: '600',
  },
  allowanceValue: {
    color: COLORS.foreground,
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  progressFillWarn: {
    backgroundColor: COLORS.actionOrange,
  },
  allowanceHint: {
    color: COLORS.mute,
    fontSize: 11,
    marginTop: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  cardChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginRight: 10,
  },
  cardChipText: {
    color: COLORS.foreground,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  paymentText: {
    color: COLORS.body,
    fontSize: 13,
    letterSpacing: 1,
  },
  currentBullets: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    gap: 8,
  },

  // --- Change plan list ---
  section: {
    marginTop: 32,
  },
  planRow: {
    marginTop: 10,
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.elevated,
  },
  planRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(241, 0, 0, 0.06)',
  },
  planRowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  planName: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  changeBadge: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  changeBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  planDelta: {
    color: COLORS.body,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  planDeltaSave: {
    color: COLORS.success,
  },
  planMeta: {
    color: COLORS.mute,
    fontSize: 12,
    marginTop: 2,
  },
  planPriceCol: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  planPrice: {
    color: COLORS.foreground,
    fontSize: 20,
    fontWeight: '800',
  },
  planCycle: {
    color: COLORS.mute,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  planBullets: {
    marginTop: 14,
    paddingTop: 12,
    marginLeft: 30,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    gap: 6,
  },

  // --- Footer actions ---
  linkButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  cancelLinkText: {
    color: COLORS.destructive,
    fontSize: 13,
    fontWeight: '600',
  },
});
