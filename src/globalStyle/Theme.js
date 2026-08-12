import { Dimensions, Platform, StatusBar } from 'react-native';
import Sizer from '../helpers/Sizer';

const COLORS = {
  mainBg: '#0A0A0A',
  background: '#0A0A0A',
  surface: '#141414',
  elevated: '#1C1C1C',
  foreground: '#FFFFFF',
  card: '#141414',
  cardForeground: '#FFFFFF',

  primary: '#F10000',
  primary1: '#C40000',
  primaryForeground: '#FFFFFF',
  primarySoft: 'rgba(241, 0, 0, 0.12)',

  body: '#B8B8B8',
  mute: '#6E6E6E',
  muted: '#141414',
  mutedForeground: '#B8B8B8',

  secondary: '#141414',
  secondaryForeground: '#FFFFFF',

  border: '#2A2A2A',
  input: '#141414',

  destructive: '#E5484D',
  success: '#3DDC84',
  verified: '#4A9EFF',

  white100: '#FFFFFF',
  black100: '#000000',
  black700: '#0A0A0A',
  grey100: '#2A2A2A',
  grey200: '#1C1C1C',

  actionSky: '#4A9EFF',
  actionEmerald: '#3DDC84',
  actionOrange: '#EA580C',
  rose: '#F43F5E',
  violet: '#7C3AED',
  primaryMuted: 'rgba(241, 0, 0, 0.15)',
  accentGold: '#EAC37E',
  accentGoldForeground: '#3D3220',
  accentGoldMuted: 'rgba(234, 195, 126, 0.3)',
  cardOverlay: 'rgba(10, 10, 10, 0.95)',
};

const RADIUS = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  full: 999,
};

const GRADIENTS = {
  splash: ['#1A1A1A', '#000000', '#0A0A0A'],
  scrim: ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.4)', '#000000'],
  cover: ['rgba(0,0,0,0.4)', '#0A0A0A'],
  paywall: ['rgba(10,10,10,0.7)', 'rgba(10,10,10,0.6)', '#0A0A0A'],
};

/**
 * Inter (body) + Space Grotesk (display).
 * iOS uses PostScript names; Android uses the file name (no extension).
 */
const FONTS = {
  interRegular400: Platform.select({
    ios: 'Inter-Regular',
    android: 'Inter_400Regular',
  }),
  interMedium500: Platform.select({
    ios: 'Inter-Medium',
    android: 'Inter_500Medium',
  }),
  interSemiBold600: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter_600SemiBold',
  }),
  interBold700: Platform.select({
    ios: 'Inter-Bold',
    android: 'Inter_700Bold',
  }),
  spaceGroteskRegular400: Platform.select({
    ios: 'SpaceGrotesk-Regular',
    android: 'SpaceGrotesk_400Regular',
  }),
  spaceGroteskMedium500: Platform.select({
    ios: 'SpaceGrotesk-Medium',
    android: 'SpaceGrotesk_500Medium',
  }),
  spaceGroteskSemiBold600: Platform.select({
    ios: 'SpaceGrotesk-SemiBold',
    android: 'SpaceGrotesk_600SemiBold',
  }),
  spaceGroteskBold700: Platform.select({
    ios: 'SpaceGrotesk-Bold',
    android: 'SpaceGrotesk_700Bold',
  }),
  sourceSerifSemiBold600: Platform.select({
    ios: 'SpaceGrotesk-SemiBold',
    android: 'SpaceGrotesk_600SemiBold',
  }),
  sourceSerifBold700: Platform.select({
    ios: 'SpaceGrotesk-Bold',
    android: 'SpaceGrotesk_700Bold',
  }),
  sourceSerifItalic: Platform.select({
    ios: 'Inter-Regular',
    android: 'Inter_400Regular',
  }),
};

const getFontStyle = (familyKey = 'interRegular400') => {
  const fontFamily = FONTS[familyKey] || FONTS.interRegular400;
  return { fontFamily };
};

const WINDOW = {
  height: Dimensions.get('window').height,
  width: Dimensions.get('window').width,
  fixPadding: 20,
};

const GLOBALSTYLE = {
  wrap: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  paddingHor: {
    paddingHorizontal: Sizer.hSize(20),
  },
  marginHor: {
    marginHorizontal: Sizer.hSize(20),
  },
  bgWithOpacity: (opacity = 0.3) => `rgba(0, 0, 0, ${opacity})`,
  overline: {
    ...getFontStyle('spaceGroteskSemiBold600'),
    fontSize: 11,
    letterSpacing: 0.88,
    textTransform: 'uppercase',
    color: COLORS.primary,
  },
};

const statusBarHeight =
  Platform.OS === 'ios'
    ? Sizer.hSize(70)
    : StatusBar.currentHeight >= 34
      ? Sizer.hSize(10)
      : Sizer.hSize(60);

export {
  COLORS,
  WINDOW,
  FONTS,
  getFontStyle,
  RADIUS,
  GRADIENTS,
  GLOBALSTYLE,
  statusBarHeight,
};
