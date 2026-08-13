import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS } from '../globalStyle/Theme';

const AppLoader = ({
  size = 'large',
  color,
  fill = false,
  compact = false,
  style,
}) => {
  const spinnerColor = color || COLORS.primary;
  const spinner = <ActivityIndicator size={size} color={spinnerColor} />;

  if (compact) {
    return spinner;
  }

  return (
    <View style={[fill ? styles.fill : styles.block, style]}>{spinner}</View>
  );
};

export default AppLoader;

const styles = StyleSheet.create({
  block: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  fill: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
