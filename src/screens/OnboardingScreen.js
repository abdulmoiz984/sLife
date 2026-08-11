import React, { useState } from 'react';
import { View, Image, Pressable, StyleSheet, StatusBar, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../atomComponents';
import { Button } from '../components';
import { Overline } from '../components/slife';
import { COLORS } from '../globalStyle/Theme';
import {
  onboardBoardroom,
  onboardHandshake,
  onboardCharts,
  onboardLounge,
} from '../assets/images';

const SLIDES = [
  {
    img: onboardBoardroom,
    kicker: 'Chapter 01',
    title: 'Welcome to Slutlife',
    body: "It's built for the professionals looking to date people on their level.",
  },
  {
    img: onboardHandshake,
    kicker: 'Chapter 02',
    title: 'Connect with Leaders',
    body: 'Attend business networking events to engage with peers and possibly meet and date the person of your dreams.',
  },
  {
    img: onboardCharts,
    kicker: 'Chapter 03',
    title: 'Grow your Career',
    body: 'Meet driven people who share your goals and values, find your partner, and open doors to elevate your career or business.',
  },
  {
    img: onboardLounge,
    kicker: 'Chapter 04',
    title: 'Private. Professional. Powerful.',
    body: 'Your business circle, elevated.',
  },
];

const OnboardingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

  const goLogin = () => navigation.replace('LoginScreen');

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <Image key={`bg-${i}`} source={slide.img} style={styles.bg} resizeMode="cover" />

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.92)', '#000000']}
        locations={[0, 0.35, 0.72, 1]}
        style={styles.scrim}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable
          onPress={goLogin}
          hitSlop={12}
          style={[styles.skip, { top: insets.top + 24 }]}>
          <Typography
            fixed
            size={12}
            fFamily="interSemiBold600"
            color="rgba(255,255,255,0.85)"
            textTransform="uppercase"
            style={styles.skipText}>
            Skip
          </Typography>
        </Pressable>

        <View
          style={[
            styles.copy,
            { paddingBottom: Math.max(insets.bottom, 16) + 24 },
          ]}>
          <Overline style={styles.kicker}>{slide.kicker}</Overline>

          <Typography
            fixed
            size={32}
            fFamily="spaceGroteskBold700"
            color={COLORS.foreground}
            LineHeight={36}
            style={styles.title}>
            {slide.title}
          </Typography>

          <Typography
            fixed
            size={15}
            color={COLORS.body}
            mT={16}
            LineHeight={23}
            style={styles.body}>
            {slide.body}
          </Typography>

          <View style={styles.dots}>
            {SLIDES.map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, idx === i ? styles.dotActive : styles.dotIdle]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            {i > 0 ? (
              <Button
                full={false}
                type="secondary"
                label="Back"
                onPress={() => setI(i - 1)}
              />
            ) : null}
            <View style={[styles.nextBtn, i > 0 && styles.nextBtnWithBack]}>
              <Button
                label={last ? 'Get started' : 'Next'}
                onPress={() => (last ? goLogin() : setI(i + 1))}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.black100,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    ...Platform.select({
      android: { elevation: 10 },
      default: {},
    }),
  },
  skip: {
    position: 'absolute',
    right: 20,
    zIndex: 11,
  },
  skipText: {
    letterSpacing: 1.2,
  },
  copy: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
  },
  kicker: {
    marginBottom: 12,
  },
  title: {
    maxWidth: 340,
    letterSpacing: -0.64,
  },
  body: {
    maxWidth: 340,
  },
  dots: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 3,
    marginRight: 8,
  },
  dotActive: {
    width: 32,
    backgroundColor: COLORS.primary,
  },
  dotIdle: {
    width: 16,
    backgroundColor: COLORS.border,
  },
  actions: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextBtn: {
    flex: 1,
  },
  nextBtnWithBack: {
    marginLeft: 12,
  },
});
