import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
//------------------
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { ScreenOverlayLoader } from '../../components';
import { Icon, TopBar } from '../../components/slife';
import { COLORS } from '../../globalStyle/Theme';
import { logout } from '../../api/authService';
import { handleLogout } from '../../redux/slices/appSlice';
import { queryClient } from '../../api/api';
import { showMessage } from '../../utils';
import {
  registerCurrentPushToken,
  sendTestPush,
  unregisterCurrentPushToken,
} from '../../api/pushService';
import { requestNotificationPermission } from '../../utils/notificationHelper';

const SECTIONS = [
  {
    label: 'Account',
    items: [
      { label: 'Edit Profile', to: 'ProfileSetupScreen' },
      { label: 'Education', to: 'EducationsScreen' },
      { label: 'Account & Security' },
      { label: 'Verification Status', hint: 'Verified' },
    ],
  },
  {
    label: 'Privacy & Notifications',
    items: [
      { label: 'Privacy Settings' },
      { label: 'Hidden Profile Mode' },
      { label: 'Notification Preferences' },
      { label: 'Send test notification', action: 'test_push' },
    ],
  },
  {
    label: 'Membership',
    items: [
      { label: 'Subscription & Billing', hint: '$15/mo', to: 'SubscriptionScreen' },
    ],
  },
  {
    label: 'Support',
    items: [
      { label: 'Help & Support' },
      { label: 'Report a member', action: 'report_hint' },
    ],
  },
  {
    label: '',
    items: [
      { label: 'Log Out', danger: true, action: 'logout' },
      { label: 'Delete Account', danger: true },
    ],
  },
];

const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [loggingOut, setLoggingOut] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

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
      queryClient.clear();
      dispatch(handleLogout());
      showMessage({ type: 'success', message: 'Logged out successfully.' });
      navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
      setLoggingOut(false);
    }
  };

  const performTestPush = async () => {
    if (testingPush) return;
    setTestingPush(true);
    try {
      await requestNotificationPermission();
      await registerCurrentPushToken();
      const res = await sendTestPush();
      showMessage({
        type: 'success',
        message: res?.message || 'Test push notification processed.',
      });
    } catch (err) {
      const status = err?.response?.status;
      const apiMessage = err?.response?.data?.message;
      showMessage({
        type: 'danger',
        message:
          apiMessage ||
          (status === 422
            ? 'No registered device. Grant notification permission and try again.'
            : 'Could not send test notification.'),
      });
    } finally {
      setTestingPush(false);
    }
  };

  const onItem = item => {
    if (item.action === 'logout') {
      performLogout();
      return;
    }
    if (item.action === 'test_push') {
      performTestPush();
      return;
    }
    if (item.action === 'report_hint') {
      showMessage({
        type: 'default',
        title: 'Report a member',
        message: 'Open any member profile and tap ⋮ → Report member.',
      });
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
        {SECTIONS.map((s, i) => (
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
                  disabled={
                    (it.action === 'logout' && loggingOut) ||
                    (it.action === 'test_push' && testingPush)
                  }
                  style={styles.row}>
                  <Typography
                    fixed
                    size={14}
                    fFamily="interMedium500"
                    color={it.danger ? COLORS.destructive : COLORS.foreground}>
                    {it.action === 'logout' && loggingOut
                      ? 'Logging out…'
                      : it.action === 'test_push' && testingPush
                      ? 'Sending…'
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
      <ScreenOverlayLoader visible={loggingOut || testingPush} />
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
