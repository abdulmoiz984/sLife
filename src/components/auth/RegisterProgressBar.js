import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../../globalStyle/Theme';

const RegisterProgressBar = ({ step, total = 3 }) => {
  const pct = Math.min(100, Math.max(0, (step / total) * 100));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
};

export default RegisterProgressBar;

const styles = StyleSheet.create({
  track: {
    height: 3,
    width: '100%',
    backgroundColor: COLORS.border,
    overflow: 'hidden',
    borderRadius: RADIUS.full,
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
});
