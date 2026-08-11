import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaWrapper } from '../atomComponents';
import { AppLogo } from '../components';
import { Overline } from '../components/slife';
import { COLORS, GRADIENTS } from '../globalStyle/Theme';

const SplashScreen = ({ navigation }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      }),
    );
    loop.start();
    const t = setTimeout(() => navigation.replace('OnboardingScreen'), 2200);
    return () => {
      loop.stop();
      clearTimeout(t);
    };
  }, [navigation, shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-48, 48],
  });

  return (
    <SafeAreaWrapper edges={[]} bgColor={COLORS.black100}>
      <LinearGradient colors={GRADIENTS.splash} style={styles.fill}>
        <View style={styles.center}>
          <AppLogo size={220} />
          <View style={styles.tag}>
            <Overline textAlign="center">Where Influence Connects</Overline>
          </View>
        </View>
        <View style={styles.barWrap}>
          <View style={styles.barTrack}>
            <Animated.View style={[styles.barFill, { transform: [{ translateX }] }]} />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaWrapper>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  tag: {
    marginTop: 24,
  },
  barWrap: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  barTrack: {
    height: 2,
    width: 96,
    backgroundColor: 'rgba(241,0,0,0.4)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    width: '50%',
    backgroundColor: COLORS.primary,
  },
});
