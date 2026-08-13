import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { COLORS } from '../../globalStyle/Theme';
import Icon from './Icon';

const resolveSource = src => {
  if (!src) return null;
  if (typeof src === 'string') return { uri: src };
  if (src?.uri || typeof src === 'number') return src;
  return null;
};

const Avatar = ({ src, size = 48, tier = 'Standard', style }) => {
  const verified = tier === 'Elite' || tier === 'Verified';
  const source = resolveSource(src);

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
          backgroundColor: COLORS.elevated,
        },
        style,
      ]}>
      {source ? (
        <Image source={source} style={styles.image} />
      ) : (
        <View style={styles.fallback}>
          <Icon.User size={Math.max(16, size * 0.4)} color={COLORS.mute} />
        </View>
      )}
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
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
