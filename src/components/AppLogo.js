import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { logo } from '../assets/images';

/** Brand mark aspect from SLifeLogo.png (1024×1015). */
const LOGO_ASPECT = 1024 / 1015;

/**
 * App logo — uses SLifeLogo.png everywhere via assets/images `logo`.
 * `size` is height; width follows the source aspect ratio.
 */
const AppLogo = ({ size = 56, style }) => {
  const height = size;
  const width = Math.round(size * LOGO_ASPECT);

  return (
    <Image
      source={logo}
      style={[styles.logo, { height, width }, style]}
      resizeMode="contain"
    />
  );
};

export default AppLogo;

const styles = StyleSheet.create({
  logo: {},
});
