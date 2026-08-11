import { Dimensions, Platform, StatusBar } from 'react-native';
import Sizer from '../helpers/Sizer';

const COLORS = {
  mainBg: '#FDFCFE',
  background: '#FDFCFE',
  foreground: '#2A1F35',
  card: '#FFFFFF',
  cardForeground: '#2A1F35',

  primary: '#51346D',
  primary1: '#3D2654',
  primaryForeground: '#FFFFFF',
  primarySoft: '#F3EDF7',

  accentGold: '#EAC37E',
  accentGoldForeground: '#3D3220',

  secondary: '#F5F4F6',
  secondaryForeground: '#3D3248',

  muted: '#F5F4F6',
  mutedForeground: '#7A7580',

  border: '#EBE9ED',
  input: '#F0EEF2',

  destructive: '#E05252',
  success: '#3D9E6A',

  white100: '#FFFFFF',
  black100: '#000000',
  black700: '#2A1F35',
  grey100: '#EBE9ED',
  grey200: '#DEDEDE',

  actionSky: '#0284C7',
  actionEmerald: '#059669',
  actionOrange: '#EA580C',
  rose: '#F43F5E',
  violet: '#7C3AED',
  primaryMuted: 'rgba(81, 52, 109, 0.15)',
  accentGoldMuted: 'rgba(234, 195, 126, 0.3)',
  cardOverlay: 'rgba(255, 255, 255, 0.95)',
};

const RADIUS = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 999,
};

const GRADIENTS = {
  brand: ['#51346D', '#3D2654'],
  brandShadow: 'rgba(81, 52, 109, 0.2)',
};

/**
 * Real Inter + Source Serif 4 (src/assets/fonts).
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
  sourceSerifSemiBold600: Platform.select({
    ios: 'SourceSerif4-SemiBold',
    android: 'SourceSerif4_600SemiBold',
  }),
  sourceSerifBold700: Platform.select({
    ios: 'SourceSerif4-Bold',
    android: 'SourceSerif4_700Bold',
  }),
  sourceSerifItalic: Platform.select({
    ios: 'SourceSerif4-Italic',
    android: 'SourceSerif4_400Regular_Italic',
  }),
};

const getFontStyle = (familyKey = 'interRegular400') => {
  const fontFamily = FONTS[familyKey] || FONTS.interRegular400;
  // Weight is baked into each file — do not also set fontWeight
  return { fontFamily };
};

const WINDOW = {
  height: Dimensions.get('window').height,
  width: Dimensions.get('window').width,
  fixPadding: 24,
};

const GLOBALSTYLE = {
  wrap: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  paddingHor: {
    paddingHorizontal: Sizer.hSize(16),
  },
  marginHor: {
    marginHorizontal: Sizer.hSize(18),
  },
  bgWithOpacity: (opacity = 0.3) => `rgba(0, 0, 0, ${opacity})`,
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
