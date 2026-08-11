import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../../atomComponents';
import { COLORS } from '../../globalStyle/Theme';
import Icon from './Icon';

const VerifiedBadge = ({ tier }) => {
  if (!tier || tier === 'Standard') return null;
  const elite = tier === 'Elite';
  const color = elite ? COLORS.primary : COLORS.verified;
  return (
    <View style={styles.row}>
      <Icon.Shield size={12} color={color} strokeWidth={2.5} />
      <Typography
        fixed
        size={11}
        fFamily="interSemiBold600"
        color={color}
        textTransform="uppercase"
        style={styles.label}>
        {elite ? 'Elite Verified' : 'Verified'}
      </Typography>
    </View>
  );
};

export default VerifiedBadge;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    letterSpacing: 0.88,
  },
});
