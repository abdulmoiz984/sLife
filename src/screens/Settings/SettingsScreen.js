import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
//------------------
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { ScreenOverlayLoader } from '../../components';
import { Icon, TopBar } from '../../components/slife';
import { COLORS } from '../../globalStyle/Theme';
import { logout, deleteAccount } from '../../api/authService';
import { handleLogout } from '../../redux/slices/appSlice';
import { queryClient } from '../../api/api';
import { showMessage } from '../../utils';
import { unregisterCurrentPushToken } from '../../api/pushService';
import { disconnectEcho } from '../../helpers/echoClient';
import { useSubscriptionMe } from '../../hooks/useSubscriptionMe';
import { subscriptionSettingsHint } from '../../helpers/subscriptionHelpers';
import { useSubscriptionEnabled } from '../../hooks/useSubscriptionEnabled';

const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const busy = loggingOut || deleting;
  const { subscription } = useSubscriptionMe();
  const { subscriptionEnabled } = useSubscriptionEnabled();

  const sections = useMemo(
    () => [
      {
        label: 'Account',
        items: [
          { label: 'Edit Profile', to: 'ProfileSetupScreen' },
          { label: 'Education', to: 'EducationsScreen' },
        ],
      },
      // Hidden entirely when GET /config → subscription_enabled is false.
      ...(subscriptionEnabled
        ? [
          {
            label: 'Membership',
            items: [
              {
                label: 'Subscription & Billing',
                hint: subscriptionSettingsHint(subscription),
                to: 'SubscriptionScreen',
              },
            ],
          },
        ]
        : []),
      {
        label: '',
        items: [
          { label: 'Log Out', danger: true, action: 'logout' },
          { label: 'Delete Account', danger: true, action: 'delete' },
        ],
      },
    ],
    [subscription, subscriptionEnabled],
  );

  const performLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      try {
        await unregisterCurrentPushToken();
      } catch (err) {
        console.log('🚀 ~ push unregister err:', err?.response?.data || err);
      }
      await logout();
    } catch (err) {
      console.log('🚀 ~ logout err:', err?.response?.data || err);
    } finally {
      clearSessionAndExit('Logged out successfully.');
      setLoggingOut(false);
    }
  };

  /** Clear local auth token / cached user / realtime, then go to login. */
  const clearSessionAndExit = message => {
    queryClient.clear();
    disconnectEcho();
    dispatch(handleLogout());
    showMessage({ type: 'success', message });
    navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
  };

  // DELETE /account — backend revokes Sanctum + push tokens and cancels any
  // active subscription, so no separate logout / push-unregister call needed.
  const performDeleteAccount = async () => {
    if (busy) return;
    setDeleting(true);
    try {
      const res = await deleteAccount();
      setDeleting(false);
      clearSessionAndExit(res?.message || 'Account deleted successfully.');
    } catch (err) {
      console.log('🚀 ~ delete account err:', err?.response?.data || err);
      setDeleting(false);
      // 401 is handled globally in api.js (token invalid → login).
      if (err?.response?.status !== 401) {
        showMessage({
          type: 'danger',
          message:
            err?.response?.data?.message ||
            'Could not delete your account. Please try again.',
        });
      }
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account?',
      'This will delete your S-Life account, sign you out on all devices and cancel any active subscription.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDeleteAccount },
      ],
      { cancelable: true },
    );
  };

  const onItem = item => {
    if (item.action === 'logout') {
      performLogout();
      return;
    }
    if (item.action === 'delete') {
      confirmDeleteAccount();
      return;
    }
    if (!item.to) return;
    navigation.navigate(item.to);
  };

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <TopBar
        overline="Configuration"
        title="Settings"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}>
        {sections.map((s, i) => (
          <View key={i} style={styles.section}>
            {!!s.label && (
              <Typography
                fixed
                size={11}
                fFamily="interSemiBold600"
                color={COLORS.mute}
                textTransform="uppercase"
                style={styles.group}>
                {s.label}
              </Typography>
            )}
            <View style={styles.list}>
              {s.items.map(it => (
                <Pressable
                  key={it.label}
                  onPress={() => onItem(it)}
                  disabled={!!it.action && busy}
                  style={styles.row}>
                  <Typography
                    fixed
                    size={14}
                    fFamily="interMedium500"
                    color={it.danger ? COLORS.destructive : COLORS.foreground}>
                    {it.action === 'logout' && loggingOut
                      ? 'Logging out…'
                      : it.action === 'delete' && deleting
                        ? 'Deleting account…'
                        : it.label}
                  </Typography>
                  <View style={styles.right}>
                    {!!it.hint && (
                      <Typography
                        fixed
                        size={11}
                        color={COLORS.mute}
                        textTransform="uppercase"
                        style={styles.hint}>
                        {it.hint}
                      </Typography>
                    )}
                    {!it.danger && <Icon.Chevron size={16} color={COLORS.mute} />}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <Typography
          fixed
          size={11}
          color={COLORS.mute}
          textAlign="center"
          mT={32}
          mB={24}>
          S-Life · Version 1.0
        </Typography>
      </ScrollView>
      <ScreenOverlayLoader visible={busy} />
    </SafeAreaWrapper>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  body: { paddingTop: 8, paddingBottom: 32 },
  section: { marginTop: 24 },
  group: { paddingHorizontal: 20, paddingBottom: 8, letterSpacing: 1.54 },
  list: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hint: { letterSpacing: 0.66 },
});
