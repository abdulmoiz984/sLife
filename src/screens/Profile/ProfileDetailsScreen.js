import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  View,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button } from '../../components';
import { Avatar, FullProfileView, Icon } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { getPersonById } from '../../constants/mockData';
import { useSubscriptionMe } from '../../hooks/useSubscriptionMe';
import { navigateToChat } from '../../navigation/NavigationService';
import PremiumGate from '../../components/subscription/PremiumGate';

const ProfileDetailsScreen = ({ navigation, route }) => {
  const {
    isSubscribed,
    isLoading: subscriptionLoading,
  } = useSubscriptionMe();
  const person = getPersonById(route.params?.id);

  if (subscriptionLoading) {
    return (
      <SafeAreaWrapper bgColor={COLORS.background}>
        <View style={styles.empty}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!person) {
    return (
      <SafeAreaWrapper bgColor={COLORS.background}>
        <View style={styles.empty}>
          <Typography fixed size={24} fFamily="spaceGroteskBold700" color={COLORS.foreground}>
            Profile unavailable
          </Typography>
          <Button label="Back to Network" onPress={() => navigation.goBack()} mt={24} />
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!isSubscribed) {
    return (
      <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
        <ScrollView contentContainerStyle={styles.lockedScroll}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.iconBtn, styles.leftBtn]}>
            <Icon.ArrowLeft size={20} color={COLORS.foreground} />
          </Pressable>
          <Avatar src={person.avatar} size={88} tier={person.tier} />
          <Typography
            fixed
            size={24}
            fFamily="spaceGroteskBold700"
            color={COLORS.foreground}
            textAlign="center"
            mT={14}>
            {person.name}
          </Typography>
          <Typography fixed size={14} color={COLORS.body} textAlign="center" mT={5}>
            {person.headline || 'SLife professional'}
          </Typography>
          <PremiumGate
            compact
            eyebrow="Full profile locked"
            title="See the complete professional story"
            description="Subscribe to unlock experience, interests, goals, and private messaging."
            cta="Unlock full profile"
            onUnlock={() => navigation.navigate('SubscriptionScreen')}
          />
        </ScrollView>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <FullProfileView
        person={person}
        headerActions={
          <>
            <Pressable onPress={() => navigation.goBack()} style={[styles.iconBtn, styles.leftBtn]}>
              <Icon.ArrowLeft size={20} color={COLORS.foreground} />
            </Pressable>
            <Pressable style={[styles.iconBtn, styles.rightBtn]}>
              <Icon.DotsV size={20} color={COLORS.foreground} />
            </Pressable>
          </>
        }
        actions={
          <View style={styles.ctaRow}>
            <View style={styles.col}>
              <Button
                type="outline"
                label="Connected"
                disabled
                icon={<Icon.Check size={16} color={COLORS.mute} />}
                textColor={COLORS.mute}
              />
            </View>
            <View style={styles.col}>
              <Button
                label="Message"
                onPress={() => navigateToChat({ userId: person.id })}
              />
            </View>
          </View>
        }
      />
    </SafeAreaWrapper>
  );
};

export default ProfileDetailsScreen;

const styles = StyleSheet.create({
  lockedScroll: {
    alignItems: 'center',
    paddingTop: 46,
    paddingBottom: 32,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  iconBtn: {
    position: 'absolute',
    top: 16,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    zIndex: 10,
  },
  leftBtn: { left: 20 },
  rightBtn: { right: 20 },
  ctaRow: { flexDirection: 'row', gap: 8 },
  col: { flex: 1 },
});
