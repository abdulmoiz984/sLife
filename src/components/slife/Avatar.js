import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { COLORS } from '../../globalStyle/Theme';

const Avatar = ({ src, size = 48, tier = 'Standard', style }) => {
  const verified = tier === 'Elite' || tier === 'Verified';
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: verified ? 2 : 1,
          borderColor: verified ? COLORS.primary : 'rgba(255,255,255,0.6)',
        },
        style,
      ]}>
      <Image source={src} style={styles.image} />
    </View>
  );
};

export default Avatar;

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
