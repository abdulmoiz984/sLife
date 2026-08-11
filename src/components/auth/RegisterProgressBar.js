import React from 'react';
import { View, StyleSheet } from 'react-native';
//-----
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import Sizer from '../../helpers/Sizer';

const RegisterProgressBar = ({ step, total = 3 }) => {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber <= step;
        return (
          <View
            key={stepNumber}
            style={[styles.segment, isActive ? styles.active : styles.inactive]}
          />
        );
      })}
    </View>
  );
};

export default RegisterProgressBar;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Sizer.hSize(8),
    marginTop: Sizer.vSize(24),
  },
  segment: {
    flex: 1,
    height: Sizer.vSize(4),
    borderRadius: RADIUS.full,
  },
  active: {
    backgroundColor: COLORS.primary,
  },
  inactive: {
    backgroundColor: COLORS.border,
  },
});
