import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { logo } from '../assets/images';

const AppLogo = ({ size = 56, style }) => {
  return (
    <Image
      source={logo}
      style={[styles.logo, { height: size, width: size }, style]}
      resizeMode="contain"
    />
  );
};

export default AppLogo;

const styles = StyleSheet.create({
  logo: {},
});
