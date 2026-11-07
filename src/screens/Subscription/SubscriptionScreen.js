import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  View,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {
  confirmPayment,
  initPaymentSheet,
  initStripe,
  presentPaymentSheet,
} from '@stripe/stripe-react-native';
//------------------
import {Typography} from '../../atomComponents';
import {Button, AppLogo, ScreenOverlayLoader} from '../../components';
import {Icon, Overline, ShimmerBlock} from '../../components/slife';
import {COLORS, RADIUS} from '../../globalStyle/Theme';
import {paywallBg} from '../../assets/images';
import {queryClient} from '../../api/api';
import {useCustomQuery} from '../../query/useCustomQuery';
import {useCustomMutation} from '../../query/useCustomMutation';
import {
  activateTrial,
  cancelSubscription,
  changeSubscriptionPlan,
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
  SUBSCRIPTION_ME_KEY,
  formatMessageAllowance,
  getPlanChangeConfirmCopy,
  getPlanChangeCtaLabel,
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
import {showMessage} from '../../utils';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 64, 340);
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

const SubscriptionScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [pendingWebhook, setPendingWebhook] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const carouselRef = useRef(null);

  const {
    subscription,
    isSubscribed,
    refetch: refetchStatus,
  } = useSubscriptionMe();

  const {data: packagesRes, refetch: refetchPackages} = useCustomQuery({
    queryKey: PACKAGES_KEY,
    queryFn: getPackages,
  });

  const packages = useMemo(() => {
    return unwrapPackages(packagesRes).map(mapPackage).filter(Boolean);
  }, [packagesRes]);

  const currentPackageId = subscription?.package?.id ?? null;

  const selectedPackage = useMemo(() => {
    if (selectedPackageId != null) {
      const found = packages.find(p => p.id === selectedPackageId);
      if (found && (!isSubscribed || found.id !== currentPackageId)) {
        return found;
      }
    }
    if (isSubscribed) {
      return (
        packages.find(p => p.isCheckoutReady && p.id !== currentPackageId) ||
        packages.find(p => p.id !== currentPackageId) ||
        null
      );
    }
    return packages.find(p => p.isCheckoutReady) || packages[0] || null;
  }, [packages, selectedPackageId, isSubscribed, currentPackageId]);

  const displayPkg = useMemo(() => {
    if (!isSubscribed) return selectedPackage;
    const subPkg = subscription?.package;
    const matchedPkg = subPkg?.id
      ? packages.find(p => p.id === subPkg.id)
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
    () => formatMessageAllowance(subscription, displayPkg),
    [subscription, displayPkg],
  );

  useFocusEffect(
    useCallback(() => {
      refetchStatus();
      refetchPackages();
    }, [refetchStatus, refetchPackages]),
  );

  const priceLabel =
    displayPkg?.formattedPrice ||
    (displayPkg?.price != null ? `$${displayPkg.price}` : null) ||
    '$29.99';

  const ctaLabel = selectedPackage
    ? subscribeCtaLabel(selectedPackage)
    : 'Select a package';
  const canCheckout =
    !!selectedPackage?.id && selectedPackage.isCheckoutReady && !isSubscribed;

  const badgeLabel = !isSubscribed
    ? selectedPackage?.trialDays > 0
      ? `${selectedPackage.trialDays}-day trial`
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
  const {mutateAsync: runChangePlan, isPending: changingPlan} =
    useCustomMutation({
      mutationFn: changeSubscriptionPlan,
    });

  const refreshStatus = async () => {
    try {
      await Promise.allSettled([
        invalidateSubscriptionQueries(),
        refetchStatus(),
        refetchPackages(),
      ]);
      showMessage({type: 'success', message: 'Subscription status updated.'});
    } catch (_) {
      showMessage({
        type: 'danger',
        message: 'Could not refresh subscription status.',
      });
    }
  };

  const handleSelectPackage = (pkg, index) => {
    if (!pkg.isCheckoutReady) return;
    if (isSubscribed && pkg.id === currentPackageId) return;
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
    if (!canCheckout || busy || !selectedPackage?.id) return;
    setBusy(true);
    setPendingWebhook(false);
    try {
      const res = await createPaymentSheet(selectedPackage.id);
      const sheet = res?.payment_sheet;
      if (!sheet?.intent_client_secret || !sheet?.publishable_key) {
        throw new Error(res?.message || 'Unable to initialize payment.');
      }

      const merchantId = sheet.merchant_identifier || 'merchant.com.slife';
      saveStripePublishableKey(sheet.publishable_key);

      await initStripe({
        publishableKey: sheet.publishable_key,
        merchantIdentifier: merchantId,
        urlScheme: 'slife',
      });

      const intent =
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
        ...intent,
      };

      let {error: initError} = await initPaymentSheet(sheetParams);
      if (initError && initError.message?.includes('merchantIdentifier')) {
        delete sheetParams.applePay;
        const fallback = await initPaymentSheet(sheetParams);
        initError = fallback.error;
      }
      if (initError) throw new Error(initError.message);

      const {error: paymentError} = await presentPaymentSheet();
      if (paymentError) {
        if (paymentError.code === 'Canceled') return;
        throw new Error(paymentError.message);
      }

      if (sheet.requires_subscription_activation && sheet.setup_intent_id) {
        await activateTrial(selectedPackage.id, sheet.setup_intent_id);
      }

      const active = await waitForSubscriptionActive();
      if (active?.isSubscribed) {
        showMessage({
          type: 'success',
          message: 'Welcome to SLife Membership.',
        });
        await refreshStatus();
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
              await refreshStatus();
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
      await refreshStatus();
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

  const executeChangePlan = async targetPkg => {
    if (!targetPkg?.id || busy || changingPlan) return;
    setBusy(true);
    try {
      const res = await runChangePlan(targetPkg.id);

      if (res?.requires_action && res?.payment_intent_client_secret) {
        // Server-provided key only: change-plan response, else the key saved
        // from this device's last POST /subscriptions/payment-sheet.
        const pubKey =
          res?.publishable_key ||
          res?.payment_sheet?.publishable_key ||
          subscription?.raw?.publishable_key ||
          getStripePublishableKey();
        if (!pubKey) {
          throw new Error(
            'Your plan was changed, but your bank needs extra verification. Open Manage billing to complete the payment.',
          );
        }
        saveStripePublishableKey(pubKey);
        await initStripe({
          publishableKey: pubKey,
          merchantIdentifier: 'merchant.com.slife',
          urlScheme: 'slife',
        });
        const {error: confirmError} = await confirmPayment(
          res.payment_intent_client_secret,
        );
        if (confirmError) {
          throw new Error(
            confirmError.message ||
              'Additional payment confirmation could not be completed.',
          );
        }
      } else if (res?.subscription) {
        queryClient.setQueryData(SUBSCRIPTION_ME_KEY, res);
      }

      setSelectedPackageId(null);
      await Promise.allSettled([
        invalidateSubscriptionQueries(),
        refetchStatus(),
        refetchPackages(),
      ]);
      showMessage({
        type: 'success',
        message: res?.message || 'Subscription plan updated.',
      });
    } catch (err) {
      await Promise.allSettled([
        invalidateSubscriptionQueries(),
        refetchStatus(),
        refetchPackages(),
      ]);
      showMessage({
        type: 'danger',
        message:
          err?.response?.data?.errors?.package_id?.[0] ||
          err?.response?.data?.errors?.subscription?.[0] ||
          err?.response?.data?.message ||
          err?.message ||
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
    const changeType = getPlanChangeType(displayPkg, selectedPackage);
    const title = getPlanChangeCtaLabel(displayPkg, selectedPackage);
    const copy = getPlanChangeConfirmCopy(changeType);
    const actionLabel =
      changeType === 'upgrade'
        ? 'Upgrade'
        : changeType === 'downgrade'
          ? 'Downgrade'
          : 'Switch plan';

    Alert.alert(title, copy, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: actionLabel,
        onPress: () => executeChangePlan(selectedPackage),
      },
    ]);
  };

  const overlayBusy =
    busy || cancelling || resuming || openingPortal || changingPlan;

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

      {/* Header outside ScrollView */}
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
            : 'Swipe and choose the plan that fits your networking goals.'}
        </Typography>

        {isSubscribed ? (
          /* Subscribed active plan card */
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
                  {String(priceLabel).replace(/\/mo$/i, '').replace(/\/yr$/i, '')}
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
                  {borderColor: badgeColor},
                  !subscription?.onGracePeriod && styles.badgeSubscribed,
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

            {subscription?.paymentMethod?.lastFour ? (
              <Typography fixed size={12} color={COLORS.body} mT={12}>
                {subscription.paymentMethod.type || 'Card'} ····{' '}
                {subscription.paymentMethod.lastFour}
              </Typography>
            ) : null}

            {messageAllowanceText ? (
              <Typography
                fixed
                size={12}
                fFamily="interSemiBold600"
                color={COLORS.primary}
                mT={10}>
                {messageAllowanceText}
              </Typography>
            ) : null}

            {displayPkg?.description && displayPkg.description.length > 0 ? (
              <View style={styles.packageBullets}>
                {displayPkg.description.map((item, idx) => (
                  <View key={`${item}-${idx}`} style={styles.bulletRow}>
                    <Icon.Check size={14} color={COLORS.primary} strokeWidth={2.5} />
                    <Typography fixed size={13} color={COLORS.body} style={styles.bulletText}>
                      {item}
                    </Typography>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.subscribeBtn}>
              <Button
                type={packages.length > 1 ? 'outline' : undefined}
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
            {packages.length <= 1 ? (
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
            ) : null}
          </View>
        ) : null}

        {!isSubscribed || packages.length > 1 ? (
          /* Multi-package Horizontal Carousel */
          <View style={styles.carouselContainer}>
            {isSubscribed ? (
              <Typography
                fixed
                size={16}
                fFamily="spaceGroteskBold700"
                color={COLORS.foreground}
                mB={12}>
                Change your plan
              </Typography>
            ) : null}

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
                const isCurrentPlan =
                  isSubscribed &&
                  currentPackageId != null &&
                  item.id === currentPackageId;
                const isSelected =
                  !isCurrentPlan && selectedPackage?.id === item.id;
                const hasTrial = !isSubscribed && item.trialDays > 0;
                const changeType =
                  isSubscribed && !isCurrentPlan
                    ? getPlanChangeType(displayPkg, item)
                    : null;
                const formattedPrice =
                  item.formattedPrice ||
                  (item.price != null ? `$${item.price}` : '—');
                const isSelectable = item.isCheckoutReady && !isCurrentPlan;

                return (
                  <Pressable
                    key={item.id}
                    disabled={!isSelectable}
                    onPress={() => handleSelectPackage(item, index)}
                    style={[
                      styles.carouselCard,
                      isSelected && styles.carouselCardActive,
                      (!item.isCheckoutReady || isCurrentPlan) &&
                        styles.carouselCardDisabled,
                    ]}>
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.radioAndName}>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}>
                          {isSelected ? <View style={styles.radioDot} /> : null}
                        </View>
                        <Typography
                          fixed
                          size={16}
                          fFamily="spaceGroteskBold700"
                          color={isSelected ? COLORS.primary : COLORS.foreground}>
                          {item.name}
                        </Typography>
                      </View>

                      {isCurrentPlan ? (
                        <View style={styles.unavailableBadge}>
                          <Typography
                            fixed
                            size={10}
                            fFamily="interSemiBold600"
                            color={COLORS.success}
                            textTransform="uppercase">
                            Current plan
                          </Typography>
                        </View>
                      ) : changeType ? (
                        <View style={styles.trialBadge}>
                          <Typography
                            fixed
                            size={10}
                            fFamily="interSemiBold600"
                            color={COLORS.primary}
                            textTransform="uppercase"
                            style={styles.track}>
                            {changeType === 'upgrade'
                              ? 'Upgrade'
                              : changeType === 'downgrade'
                                ? 'Downgrade'
                                : 'Switch'}
                          </Typography>
                        </View>
                      ) : hasTrial ? (
                        <View style={styles.trialBadge}>
                          <Typography
                            fixed
                            size={10}
                            fFamily="interSemiBold600"
                            color={COLORS.primary}
                            textTransform="uppercase"
                            style={styles.track}>
                            {item.trialDays}-day trial
                          </Typography>
                        </View>
                      ) : !item.isCheckoutReady ? (
                        <View style={styles.unavailableBadge}>
                          <Typography
                            fixed
                            size={10}
                            fFamily="interSemiBold600"
                            color={COLORS.mute}
                            textTransform="uppercase">
                            Unavailable
                          </Typography>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.priceRowCompact}>
                      <Typography
                        fixed
                        size={28}
                        fFamily="spaceGroteskBold700"
                        color={COLORS.foreground}>
                        {String(formattedPrice).replace(/\/mo$/i, '').replace(/\/yr$/i, '')}
                      </Typography>
                      <Typography
                        fixed
                        size={13}
                        fFamily="interSemiBold600"
                        color={COLORS.mute}
                        mL={6}>
                        {item.billingCycle === 'yearly' ? '/ year' : '/ month'}
                      </Typography>
                    </View>

                    {item.description && item.description.length > 0 ? (
                      <View style={styles.packageBullets}>
                        {item.description.map((bullet, idx) => (
                          <View key={`${bullet}-${idx}`} style={styles.bulletRow}>
                            <Icon.Check size={14} color={COLORS.primary} strokeWidth={2.5} />
                            <Typography fixed size={13} color={COLORS.body} style={styles.bulletText}>
                              {bullet}
                            </Typography>
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

            {pendingWebhook ? (
              <Typography fixed size={12} color={COLORS.primary} mT={10}>
                Activation pending — tap Refresh status in a moment.
              </Typography>
            ) : null}

            <View style={styles.subscribeBtn}>
              {isSubscribed ? (
                <Button
                  label={getPlanChangeCtaLabel(displayPkg, selectedPackage)}
                  onPress={confirmChangePlan}
                  disabled={
                    !selectedPackage?.id ||
                    !selectedPackage.isCheckoutReady ||
                    selectedPackage.id === currentPackageId ||
                    busy ||
                    changingPlan
                  }
                  loader={busy || changingPlan}
                />
              ) : (
                <Button
                  label={!selectedPackage ? 'Loading packages…' : ctaLabel}
                  onPress={subscribe}
                  disabled={!canCheckout || busy}
                  loader={busy}
                />
              )}
            </View>
            {!isSubscribed ? (
              <Typography
                fixed
                size={11}
                color={COLORS.mute}
                textAlign="center"
                mT={8}>
                Accepts Credit/Debit Cards, Apple Pay & Cash App
              </Typography>
            ) : null}

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
          </View>
        ) : null}

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
    marginBottom: 24,
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
  carouselCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 126, 0, 0.06)',
  },
  carouselCardDisabled: {
    opacity: 0.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioAndName: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.mute,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  trialBadge: {
    backgroundColor: 'rgba(255, 126, 0, 0.12)',
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  unavailableBadge: {
    backgroundColor: 'rgba(150, 150, 150, 0.12)',
    borderColor: COLORS.mute,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priceRowCompact: {
    flexDirection: 'row',
    alignItems: 'baseline',
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
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletText: {
    marginLeft: 8,
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
  perks: {marginTop: 8},
  perk: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  perkText: {marginLeft: 12},
  priceCard: {
    marginTop: 24,
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
