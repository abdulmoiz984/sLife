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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../../atomComponents';
import { Button, AppLogo } from '../../components';
import { Icon, Overline, ShimmerBlock } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { paywallBg } from '../../assets/images';

const PERKS = [
  'Unlimited profile views',
  'Unlimited connection requests',
  'Unlimited messaging',
  'AI-powered recommendations',
  'Advanced search filters',
  'Priority verification support',
];

const SubscriptionScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Image source={paywallBg} style={styles.bg} resizeMode="cover" />
      <LinearGradient
        pointerEvents="none"
        colors={[
          'rgba(10,10,10,0.70)',
          'rgba(10,10,10,0.60)',
          COLORS.background,
        ]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}>
        <View style={styles.top}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Icon.Close size={20} color={COLORS.foreground} />
          </Pressable>
          <AppLogo size={28} />
          <View style={styles.spacer} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {/* Locked preview card — matches v2 */}
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
            Unlock full access.
          </Typography>
          <Typography
            fixed
            size={14}
            color={COLORS.body}
            mT={12}
            LineHeight={20}
            style={styles.lead}>
            Move beyond browse-mode. Message, match, and mine the full directory of verified
            leaders.
          </Typography>

          <View style={styles.perks}>
            {PERKS.map(p => (
              <View key={p} style={styles.perk}>
                <Icon.Check size={16} color={COLORS.primary} strokeWidth={2.5} />
                <Typography fixed size={14} color={COLORS.foreground} style={styles.perkText}>
                  {p}
                </Typography>
              </View>
            ))}
          </View>

          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <View>
                <Typography
                  fixed
                  size={36}
                  fFamily="spaceGroteskBold700"
                  color={COLORS.foreground}
                  LineHeight={36}>
                  $15
                </Typography>
                <Typography
                  fixed
                  size={12}
                  color={COLORS.mute}
                  textTransform="uppercase"
                  mT={4}
                  style={styles.track}>
                  Per month
                </Typography>
              </View>
              <View style={styles.popular}>
                <Typography
                  fixed
                  size={11}
                  fFamily="interSemiBold600"
                  color={COLORS.primary}
                  textTransform="uppercase"
                  style={styles.track}>
                  Most popular
                </Typography>
              </View>
            </View>
            <Typography fixed size={12} color={COLORS.body} mT={12}>
              Billed monthly. Cancel anytime.
            </Typography>
            <View style={styles.subscribeBtn}>
              <Button label="Subscribe now" onPress={() => navigation.goBack()} />
            </View>
            <Pressable style={styles.restore} hitSlop={8}>
              <Typography
                fixed
                size={11}
                fFamily="interSemiBold600"
                color={COLORS.mute}
                textTransform="uppercase"
                textAlign="center"
                style={styles.track}>
                Restore purchase
              </Typography>
            </Pressable>
          </View>
        </ScrollView>
      </View>
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
  overlay: {
    flex: 1,
    zIndex: 2,
    ...Platform.select({
      android: { elevation: 4 },
      default: {},
    }),
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  spacer: { width: 20 },
  flex: { flex: 1 },
  body: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 40,
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
  previewShimmer: {
    marginBottom: 12,
  },
  previewLine: {
    marginBottom: 8,
  },
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
  headline: {
    letterSpacing: -0.5,
  },
  lead: {
    maxWidth: 320,
  },
  perks: {
    marginTop: 24,
  },
  perk: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  perkText: {
    marginLeft: 12,
  },
  priceCard: {
    marginTop: 32,
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
  popular: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  track: {
    letterSpacing: 0.88,
  },
  subscribeBtn: {
    marginTop: 16,
  },
  restore: {
    marginTop: 12,
    alignItems: 'center',
  },
});
