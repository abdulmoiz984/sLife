import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { logoColor, logoWhite } from '../assets/images';
import Sizer from '../helpers/Sizer';

const AppLogo = ({ variant = 'color', height = 32, style }) => {
  const source = variant === 'white' ? logoWhite : logoColor;
  const logoHeight = Sizer.vSize(height);
  const logoWidth = Sizer.hSize(height * 3.75);

  return (
    <Image
      source={source}
      style={[styles.logo, { height: logoHeight, width: logoWidth }, style]}
      resizeMode="contain"
    />
  );
};

export default AppLogo;

const styles = StyleSheet.create({
  logo: {},
});
