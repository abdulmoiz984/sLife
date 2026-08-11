import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
//-----
import { Flex, Typography } from '../../atomComponents';
import { COLORS, RADIUS } from '../../globalStyle/Theme';

const InterestChip = ({ label, selected, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSelected : styles.chipDefault]}>
      <Flex direction="row" algItems="center" gap={6}>
        {selected && (
          <Typography fixed size={13} color={COLORS.primaryForeground}>
            ✓
          </Typography>
        )}
        <Typography
          fixed
          size={13}
          fFamily="interMedium500"
          color={selected ? COLORS.primaryForeground : COLORS.foreground}>
          {label}
        </Typography>
      </Flex>
    </Pressable>
  );
};

export default InterestChip;

const styles = StyleSheet.create({
  chip: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipDefault: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  chipSelected: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
});
