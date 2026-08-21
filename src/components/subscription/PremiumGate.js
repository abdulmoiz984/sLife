import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Typography} from '../../atomComponents';
import Button from '../customButtons/Button';
import {Icon, ShimmerBlock} from '../slife';
import {COLORS, RADIUS} from '../../globalStyle/Theme';

/**
 * In-context premium preview. It never receives or renders protected data;
 * shimmer blocks only demonstrate the shape of the feature being unlocked.
 */
const PremiumGate = ({
  title,
  description,
  eyebrow = 'Premium feature',
  cta = 'Unlock with Premium',
  onUnlock,
  compact = false,
}) => (
  <View style={[styles.wrap, compact && styles.compactWrap]}>
    <View style={styles.preview} pointerEvents="none">
      <ShimmerBlock height={compact ? 48 : 72} />
      <ShimmerBlock
        height={11}
        width="72%"
        style={styles.previewLine}
      />
      <ShimmerBlock height={11} width="48%" />
      <View style={styles.previewVeil}>
        <View style={styles.lock}>
          <Icon.Lock size={22} color={COLORS.primary} />
        </View>
      </View>
    </View>

    <View style={styles.badge}>
      <Icon.Lock size={12} color={COLORS.primary} />
      <Typography
        fixed
        size={10}
        fFamily="interSemiBold600"
        color={COLORS.primary}
        textTransform="uppercase"
        style={styles.badgeText}>
        {eyebrow}
      </Typography>
    </View>

    <Typography
      fixed
      size={compact ? 22 : 26}
      fFamily="spaceGroteskBold700"
      color={COLORS.foreground}
      textAlign="center"
      mT={14}
      LineHeight={compact ? 28 : 32}>
      {title}
    </Typography>
    <Typography
      fixed
      size={14}
      color={COLORS.body}
      textAlign="center"
      mT={10}
      LineHeight={21}
      style={styles.description}>
      {description}
    </Typography>

    <View style={styles.cta}>
      <Button label={cta} onPress={onUnlock} />
    </View>
    <Typography fixed size={11} color={COLORS.mute} textAlign="center" mT={10}>
      Trial and grace-period access are included.
    </Typography>
  </View>
);

export default PremiumGate;

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    alignItems: 'center',
  },
  compactWrap: {
    paddingTop: 18,
  },
  preview: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xxl,
    padding: 16,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  previewLine: {
    marginTop: 12,
    marginBottom: 8,
  },
  previewVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.56)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lock: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.primarySoft,
  },
  badgeText: {
    letterSpacing: 0.8,
  },
  description: {
    maxWidth: 330,
  },
  cta: {
    width: '100%',
    marginTop: 22,
  },
});
