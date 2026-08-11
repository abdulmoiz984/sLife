import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Typography } from '../../atomComponents';
import { COLORS } from '../../globalStyle/Theme';

const Chip = ({ label, active = false, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.active : styles.idle]}>
      <Typography
        fixed
        size={12}
        fFamily="interMedium500"
        color={active ? COLORS.primaryForeground : COLORS.foreground}
        textTransform="uppercase"
        style={styles.label}>
        {label}
      </Typography>
    </Pressable>
  );
};

export default Chip;

const styles = StyleSheet.create({
  chip: {
    height: 32,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  idle: {
    backgroundColor: 'transparent',
    borderColor: COLORS.border,
  },
  active: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  label: {
    letterSpacing: 0.72,
  },
});
