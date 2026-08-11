import React from 'react';
import {
  View,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button } from '../../components';
import { Avatar, Icon, SectionLabel, VerifiedBadge, ShimmerBlock } from '../../components/slife';
import { COLORS } from '../../globalStyle/Theme';
import { getPersonById } from '../../constants/mockData';
import { onboardBoardroom } from '../../assets/images';

const ProfileScreen = ({ navigation, route }) => {
  const person = getPersonById(route.params?.id);

  if (!person) {
    return (
      <SafeAreaWrapper bgColor={COLORS.background}>
        <View style={styles.empty}>
          <Typography
            fixed
            size={11}
            fFamily="spaceGroteskSemiBold600"
            color={COLORS.primary}
            textTransform="uppercase">
            Not found
          </Typography>
          <Typography
            fixed
            size={24}
            fFamily="spaceGroteskBold700"
            color={COLORS.foreground}
            mT={8}>
            Profile unavailable
          </Typography>
          <Button label="Back to Discover" onPress={() => navigation.goBack()} mt={24} />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View>
          <View style={styles.coverWrap}>
            <Image
              source={onboardBoardroom}
              style={styles.cover}
              resizeMode="cover"
              blurRadius={Platform.OS === 'ios' ? 1 : 1}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.5)', COLORS.background]}
              style={StyleSheet.absoluteFill}
            />
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.iconBtn, styles.leftBtn]}
              hitSlop={8}>
              <Icon.ArrowLeft size={20} color={COLORS.foreground} />
            </Pressable>
            <Pressable style={[styles.iconBtn, styles.rightBtn]} hitSlop={8}>
              <Icon.DotsV size={20} color={COLORS.foreground} />
            </Pressable>
          </View>
          <View style={styles.avatarWrap}>
            <Avatar src={person.avatar} size={96} tier={person.tier} />
          </View>
        </View>

        <View style={styles.intro}>
          <Typography fixed size={24} fFamily="spaceGroteskBold700" color={COLORS.foreground}>
            {person.name}
          </Typography>
          <Typography fixed size={14} color={COLORS.body} mT={4}>
            {person.headline}
          </Typography>
          <View style={styles.badge}>
            <VerifiedBadge tier={person.tier} />
          </View>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Icon.Building size={16} color={COLORS.mute} />
              <Typography fixed size={13} color={COLORS.mute} style={styles.metaText}>
                {person.currentPosition} · {person.company}
              </Typography>
            </View>
            <View style={styles.metaItem}>
              <Icon.Pin size={16} color={COLORS.mute} />
              <Typography fixed size={13} color={COLORS.mute}>
                {person.location}
              </Typography>
            </View>
          </View>

          <View style={styles.ctaRow}>
            <View style={styles.col}>
              <Button label="Connect" disabled />
            </View>
            <View style={styles.col}>
              <Pressable disabled style={styles.messageBtn}>
                <Icon.Lock size={16} color={COLORS.mute} />
                <Typography
                  fixed
                  size={12}
                  fFamily="interSemiBold600"
                  color={COLORS.mute}
                  textTransform="uppercase"
                  style={styles.messageLabel}>
                  Message
                </Typography>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionLabel>Documents & Portfolio</SectionLabel>

          <View style={styles.lockedCard}>
            {/* shimmer placeholder behind overlay */}
            <View style={styles.shimmerWrap}>
              <ShimmerBlock height={96} width="100%" />
            </View>

            {/* locked overlay — matches v2 backdrop-blur + bg-black/30 */}
            <View style={styles.lockOverlay} pointerEvents="box-none">
              <Icon.Lock size={24} color={COLORS.primary} />
              <Typography
                fixed
                size={14}
                fFamily="interSemiBold600"
                color={COLORS.foreground}
                mT={12}
                textAlign="center">
                Subscribe to view
              </Typography>
              <Typography
                fixed
                size={12}
                color={COLORS.body}
                mT={4}
                textAlign="center">
                Portfolio, decks and vetted references.
              </Typography>
              <View style={styles.unlockWrap}>
                <Button
                  full={false}
                  label="Unlock full access"
                  onPress={() => navigation.navigate('SubscriptionScreen')}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 40,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  coverWrap: {
    height: 160,
    overflow: 'hidden',
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  iconBtn: {
    position: 'absolute',
    top: 16,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 2,
    ...Platform.select({
      android: { elevation: 4 },
      default: {},
    }),
  },
  leftBtn: { left: 20 },
  rightBtn: { right: 20 },
  avatarWrap: {
    paddingHorizontal: 20,
    marginTop: -48,
    zIndex: 3,
  },
  intro: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  badge: {
    marginTop: 8,
  },
  meta: {
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  metaText: {
    flexShrink: 1,
  },
  ctaRow: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
  },
  messageBtn: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  messageLabel: {
    marginLeft: 8,
    letterSpacing: 0.72,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  lockedCard: {
    position: 'relative',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 160,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shimmerWrap: {
    width: '100%',
    height: 96,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 2,
    ...Platform.select({
      android: { elevation: 2 },
      default: {},
    }),
  },
  unlockWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
});
