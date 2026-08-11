import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
//-----
import { Flex, Typography } from '../../atomComponents';
import { COLORS, RADIUS } from '../../globalStyle/Theme';

const SocialAuthButton = ({ label, icon, onPress, iconColor }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
      <Flex direction="row" algItems="center" jusContent="center" gap={10}>
        {!!icon && (
          <Typography
            fixed
            size={16}
            color={iconColor || COLORS.foreground}
            style={styles.icon}>
            {icon}
          </Typography>
        )}
        <Typography fixed size={15} fFamily="interSemiBold600" color={COLORS.foreground}>
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
    borderRadius: RADIUS.full,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: COLORS.white100,
    minHeight: 48,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
  icon: {
    width: 20,
    textAlign: 'center',
  },
});
