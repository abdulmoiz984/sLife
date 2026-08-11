import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
//-----
import { Typography } from '../../atomComponents';
import { COLORS, RADIUS } from '../../globalStyle/Theme';

const AuthBackLink = ({ onPress, label = 'Back' }) => {
  return (
    <Pressable onPress={onPress} style={styles.backBtn} hitSlop={8}>
      <ArrowLeft size={16} color={COLORS.mutedForeground} strokeWidth={1.8} />
      <Typography fixed size={14} color={COLORS.mutedForeground}>
        {label}
      </Typography>
    </Pressable>
  );
};

export default AuthBackLink;

const styles = StyleSheet.create({
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: -4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
});
