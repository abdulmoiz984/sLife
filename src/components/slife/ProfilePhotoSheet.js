import React from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
//------------------
import { Typography } from '../../atomComponents';
import Icon from './Icon';
import { COLORS, RADIUS } from '../../globalStyle/Theme';

/**
 * ClayMaster-style profile photo options sheet.
 * Avatar press → sheet → Choose from gallery (fullScreen) / Remove.
 */
const ProfilePhotoSheet = ({
  visible,
  onClose,
  onChooseGallery,
  onRemove,
  canRemove = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
          onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <Typography
            fixed
            size={11}
            fFamily="interSemiBold600"
            color={COLORS.mute}
            textAlign="center"
            textTransform="uppercase"
            mB={12}
            style={styles.track}>
            Update photo
          </Typography>

          <Pressable
            style={styles.option}
            onPress={onChooseGallery}
            accessibilityRole="button"
            accessibilityLabel="Choose from gallery">
            <View style={styles.optionIcon}>
              <Icon.Camera size={18} color={COLORS.primary} />
            </View>
            <Typography
              fixed
              size={15}
              fFamily="interSemiBold600"
              color={COLORS.foreground}
              style={styles.optionLabel}>
              Choose from gallery
            </Typography>
            <Icon.Chevron size={18} color={COLORS.mute} />
          </Pressable>

          {canRemove ? (
            <Pressable
              style={[styles.option, styles.optionDanger]}
              onPress={onRemove}
              accessibilityRole="button"
              accessibilityLabel="Remove selected photo">
              <View style={[styles.optionIcon, styles.optionIconDanger]}>
                <Icon.Close size={18} color={COLORS.destructive} />
              </View>
              <Typography
                fixed
                size={15}
                fFamily="interSemiBold600"
                color={COLORS.destructive}
                style={styles.optionLabel}>
                Remove selected photo
              </Typography>
            </Pressable>
          ) : null}

          <Pressable style={styles.cancel} onPress={onClose}>
            <Typography
              fixed
              size={15}
              fFamily="interSemiBold600"
              color={COLORS.mute}
              textAlign="center">
              Cancel
            </Typography>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ProfilePhotoSheet;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.elevated,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 48,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  track: { letterSpacing: 0.88 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  optionDanger: {
    borderColor: 'rgba(229,72,77,0.35)',
    backgroundColor: 'rgba(229,72,77,0.06)',
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconDanger: {
    backgroundColor: 'rgba(229,72,77,0.12)',
  },
  optionLabel: { flex: 1 },
  cancel: {
    marginTop: 4,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
