import React, { useCallback, useMemo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
//------------------
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button } from '../../components';
import { FullProfileView, Icon, Overline } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { getProfileCompletion } from '../../helpers/profileCompletion';
import { mapOwnProfile } from '../../helpers/memberMapper';
import { useCustomQuery } from '../../query/useCustomQuery';
import { getProfile } from '../../api/profileService';

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
  const user = useSelector(state => state.app.user);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useCustomQuery({
    queryKey: ['profile', 'me'],
    queryFn: getProfile,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const person = useMemo(
    () => mapOwnProfile(data?.profile, user),
    [data?.profile, user],
  );

  const completion = person ? getProfileCompletion(person) : 0;

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
              <View style={styles.checkBox}>
                <Icon.Check size={16} color={COLORS.primary} strokeWidth={2.5} />
              </View>
              <View style={styles.memberCopy}>
                <Overline>Membership status</Overline>
                <Typography fixed size={13} color={COLORS.foreground} mT={4}>
                  {membershipCopy(person)}
                </Typography>
              </View>
            </View>
            <Button
              type="secondary"
              label="Edit profile"
              onPress={() =>
                navigation.getParent()?.navigate('ProfileSetupScreen')
              }
            />
            <Button
              type="ghost"
              label="Education"
              onPress={() =>
                navigation.getParent()?.navigate('EducationsScreen')
              }
              mt={12}
              textColor={COLORS.mute}
            />
            {completion < 100 && (
              <Button
                label={`Complete profile (${completion}%)`}
                onPress={() =>
                  navigation.getParent()?.navigate('ProfileSetupScreen')
                }
                mt={12}
              />
            )}
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
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
  },
  actions: { gap: 0 },
  refreshSpinner: { marginBottom: 8 },
  memberCard: {
    borderWidth: 1,
    borderColor: 'rgba(241,0,0,0.6)',
    backgroundColor: 'rgba(241,0,0,0.05)',
    borderRadius: RADIUS.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  checkBox: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberCopy: { flex: 1 },
});
