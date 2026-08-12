import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Flex, Typography } from '../../atomComponents';
import { COLORS, RADIUS } from '../../globalStyle/Theme';

const SocialAuthButton = ({ label, icon, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
      <Flex direction="row" algItems="center" jusContent="center" gap={12}>
        {!!icon && <View style={styles.icon}>{icon}</View>}
        <Typography
          fixed
          size={13}
          fFamily="interSemiBold600"
          color={COLORS.foreground}
          textTransform="uppercase"
          style={styles.label}>
          {label}
        </Typography>
      </Flex>
    </Pressable>
  );
};

export default SocialAuthButton;

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    marginBottom: 12,
    backgroundColor: 'transparent',
    minHeight: 48,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
    borderColor: 'rgba(241,0,0,0.6)',
  },
  icon: {
    width: 20,
    alignItems: 'center',
  },
  label: {
    letterSpacing: 0.78,
  },
});
