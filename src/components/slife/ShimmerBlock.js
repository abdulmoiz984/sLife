import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../../globalStyle/Theme';

/** Animated shimmer block matching v2 `.shimmer` utility */
const ShimmerBlock = ({ height = 24, width = '100%', style, borderRadius = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={[styles.track, { height, width, borderRadius }, style]}>
      <Animated.View style={[styles.shine, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={[COLORS.surface, COLORS.elevated, COLORS.surface]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

export default ShimmerBlock;

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  shine: {
    width: '200%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
});
