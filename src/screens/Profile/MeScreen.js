import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
//------------------
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button } from '../../components';
import { FullProfileView, Icon, Overline } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { mapOwnProfile } from '../../helpers/memberMapper';
import { useCustomQuery } from '../../query/useCustomQuery';
import { getProfile } from '../../api/profileService';
import { setProfile } from '../../redux/slices/appSlice';

const membershipCopy = person => {
  const badge = person?.verificationBadgeLabel || person?.tier;
  if (person?.tier === 'Elite') {
    return `You are ${badge || 'Elite Verified'}. Your profile is open to every kind of professional.`;
  }
  if (person?.tier === 'Verified') {
    return `You are ${badge || 'Verified'}. Keep your profile complete to unlock more matches.`;
  }
  if (person?.raw?.verification_submitted_at || person?.profileCompleted) {
    return 'Your profile is submitted. Verification is pending review.';
  }
  return 'Complete your profile and submit for verification to get a badge.';
};

const MeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.app.user);
  const cachedProfile = useSelector(state => state.app.profile);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useCustomQuery({
    queryKey: ['profile', 'me'],
    queryFn: getProfile,
    placeholderData: cachedProfile
      ? { success: true, profile: cachedProfile }
      : undefined,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (data?.profile) {
      dispatch(setProfile(data.profile));
    }
  }, [data?.profile, dispatch]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const person = useMemo(
    () => mapOwnProfile(data?.profile || cachedProfile, user),
    [data?.profile, cachedProfile, user],
  );

  if (isLoading && !person) {
    return (
      <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      </SafeAreaWrapper>
    );
  }

  if (isError || !person) {
    return (
      <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
        <View style={styles.center}>
          <Typography fixed size={14} color={COLORS.body} textAlign="center">
            Could not load your profile.
          </Typography>
          <Button label="Retry" onPress={() => refetch()} mt={16} />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <FullProfileView
        person={person}
        showCompletion
        headerActions={
          <Pressable
            onPress={() => navigation.getParent()?.navigate('SettingsScreen')}
            style={styles.settingsBtn}>
            <Icon.Settings size={20} color={COLORS.foreground} />
          </Pressable>
        }
        actions={
          <View style={styles.actions}>
            {isFetching && !isLoading ? (
              <ActivityIndicator
                color={COLORS.mute}
                style={styles.refreshSpinner}
              />
            ) : null}
            <View style={styles.memberCard}>
              <View style={styles.shieldIconBox}>
                <Icon.Check size={16} color={COLORS.primary} strokeWidth={2.5} />
              </View>
              <View style={styles.memberCopy}>
                <Overline style={styles.memberOverline}>Membership status</Overline>
                <Typography fixed size={13} color={COLORS.foreground} mT={2} LineHeight={18}>
                  {membershipCopy(person)}
                </Typography>
              </View>
            </View>

            <View style={styles.btnRow}>
              <View style={styles.btnCol}>
                <Button
                  label="Edit profile"
                  onPress={() =>
                    navigation.getParent()?.navigate('ProfileSetupScreen')
                  }
                />
              </View>
              <View style={styles.btnCol}>
                <Button
                  type="outline"
                  label="Education"
                  textColor={COLORS.foreground}
                  onPress={() =>
                    navigation.getParent()?.navigate('EducationsScreen')
                  }
                />
              </View>
            </View>
          </View>
        }
      />
    </SafeAreaWrapper>
  );
};

export default MeScreen;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  settingsBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { gap: 12 },
  refreshSpinner: { marginBottom: 8 },
  memberCard: {
    borderWidth: 1,
    borderColor: 'rgba(241, 0, 0, 0.35)',
    backgroundColor: 'rgba(241, 0, 0, 0.06)',
    borderRadius: RADIUS.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  shieldIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(241, 0, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(241, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberCopy: { flex: 1 },
  memberOverline: {
    letterSpacing: 0.88,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCol: {
    flex: 1,
  },
});
