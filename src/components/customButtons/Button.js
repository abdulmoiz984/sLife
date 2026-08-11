import React, { useRef } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Sizer from '../../helpers/Sizer';
import { COLORS, RADIUS, getFontStyle } from '../../globalStyle/Theme';

/** Standard primary CTA — matches production onboarding buttons */
const BUTTON_HEIGHT = 50;

function Button({
  label = 'Custom Button',
  btnStyle = {},
  textStyle = {},
  loader = false,
  disabled = false,
  upperCase = false,
  onPress = () => {},
  icon = null,
  rightIcon = null,
  type = 'primary',
  mb = 0,
  mt = 0,
  iconGap = 8,
  fontSize = 16,
  fFamily = 'interSemiBold600',
  textColor = null,
  loadColor = null,
  customTextColor,
  outerStyle,
  ...props
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isSecondary = type === 'secondary';
  let backgroundColor = COLORS.primary;
  let textClr = COLORS.primaryForeground;

  if (isSecondary) {
    backgroundColor = COLORS.white100;
    textClr = customTextColor || COLORS.primary;
  }

  if (disabled) {
    backgroundColor = COLORS.grey200;
    textClr = COLORS.mutedForeground;
  }

  const color = textColor || textClr;
  const loaderColor = loadColor || textClr;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <TouchableOpacity
      style={[
        styles.touchable,
        { marginBottom: Sizer.vSize(mb), marginTop: Sizer.vSize(mt) },
      ]}
      activeOpacity={0.88}
      disabled={loader || disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: loader || disabled }}
      {...props}>
      <Animated.View
        style={[
          styles.button,
          { backgroundColor },
          isSecondary && styles.secondaryBorder,
          disabled && styles.disabledShadow,
          !isSecondary && !disabled && styles.primaryShadow,
          outerStyle,
          btnStyle,
          { transform: [{ scale: scaleAnim }] },
        ]}>
        {loader ? (
          <ActivityIndicator size="small" color={loaderColor} />
        ) : (
          <View style={[styles.labelRow, { gap: Sizer.hSize(iconGap) }]}>
            {!!icon && icon}
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={[
                styles.text,
                getFontStyle(fFamily),
                {
                  color,
                  fontSize,
                  textTransform: upperCase ? 'uppercase' : 'none',
                },
                textStyle,
              ]}>
              {label}
            </Text>
            {!!rightIcon && rightIcon}
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
    alignSelf: 'stretch',
  },
  button: {
    width: '100%',
    height: BUTTON_HEIGHT,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryShadow: {
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  secondaryBorder: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: COLORS.border,
  },
  disabledShadow: {
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    color: COLORS.primaryForeground,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default Button;
