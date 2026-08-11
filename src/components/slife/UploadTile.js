import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Typography } from '../../atomComponents';
import { COLORS } from '../../globalStyle/Theme';
import Icon from './Icon';

const UploadTile = ({ label, done, onToggle, required }) => {
  return (
    <Pressable onPress={onToggle} style={styles.tile}>
      <View style={styles.iconBox}>
        <Icon.Doc size={20} color={COLORS.primary} />
      </View>
      <View style={styles.copy}>
        <Typography fixed size={14} fFamily="interSemiBold600" color={COLORS.foreground}>
          {label}
        </Typography>
        <Typography fixed size={12} color={COLORS.mute} mT={2}>
          {done ? 'document.pdf' : 'Tap to upload'}
        </Typography>
      </View>
      <View style={[styles.badge, done ? styles.badgeDone : styles.badgeIdle]}>
        <Typography
          fixed
          size={10}
          fFamily="interSemiBold600"
          color={done ? COLORS.primary : COLORS.mute}
          textTransform="uppercase"
          style={styles.badgeText}>
          {done ? 'Pending' : required ? 'Required' : 'Optional'}
        </Typography>
      </View>
    </Pressable>
  );
};

export default UploadTile;

const styles = StyleSheet.create({
  tile: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeDone: {
    borderColor: COLORS.primary,
  },
  badgeIdle: {
    borderColor: COLORS.border,
  },
  badgeText: {
    letterSpacing: 0.8,
  },
});
