import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { COLORS, RADIUS } from '../globalStyle/Theme';
import AppLoader from '../atomComponents/AppLoader';

/**
 * Full-screen dim overlay with a centered spinner card.
 * Content behind stays visible; touches are blocked while `visible`.
 */
const ScreenOverlayLoader = ({ visible = false, color }) => {
  const spinnerColor = color || COLORS.primary;

  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}>
      <View style={styles.overlay} pointerEvents="auto">
        <View style={styles.spinnerCard}>
          <AppLoader compact size="large" color={spinnerColor} />
        </View>
      </View>
    </Modal>
  );
};

export default ScreenOverlayLoader;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerCard: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.xxl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
});
