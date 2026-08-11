import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Typography } from '../../atomComponents';
import { COLORS } from '../../globalStyle/Theme';
import { Icon } from '../slife';

const AuthBackLink = ({ onPress, label = 'Back' }) => {
  return (
    <Pressable onPress={onPress} style={styles.backBtn} hitSlop={8}>
      <Icon.ArrowLeft size={16} color={COLORS.mute} />
      <Typography fixed size={12} color={COLORS.mute} fFamily="interSemiBold600" textTransform="uppercase">
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
  },
});
