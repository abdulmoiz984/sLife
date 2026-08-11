import React, { useRef } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import Sizer from '../../helpers/Sizer';
import { COLORS, getFontStyle } from '../../globalStyle/Theme';

const BUTTON_HEIGHT = 44;

function Button({
  label = 'Custom Button',
  btnStyle = {},
  textStyle = {},
  loader = false,
  disabled = false,
  upperCase = true,
  full = true,
  onPress = () => {},
  icon = null,
  rightIcon = null,
  type = 'primary',
  mb = 0,
  mt = 0,
  iconGap = 8,
  fontSize = 13,
  fFamily = 'interSemiBold600',
  textColor = null,
  loadColor = null,
  customTextColor,
  outerStyle,
  ...props
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  let backgroundColor = COLORS.primary;
  let borderColor = COLORS.primary;
  let borderWidth = 0;
  let textClr = COLORS.primaryForeground;

  if (type === 'secondary') {
    backgroundColor = 'transparent';
    borderColor = COLORS.primary;
    borderWidth = 1;
    textClr = customTextColor || COLORS.primary;
  } else if (type === 'ghost') {
    backgroundColor = 'transparent';
    borderColor = 'transparent';
    borderWidth = 0;
    textClr = customTextColor || COLORS.foreground;
  } else if (type === 'destructive') {
    backgroundColor = 'transparent';
    borderColor = COLORS.destructive;
    borderWidth = 1;
    textClr = COLORS.destructive;
  } else if (type === 'outline') {
    backgroundColor = 'transparent';
    borderColor = COLORS.border;
    borderWidth = 1;
    textClr = customTextColor || COLORS.foreground;
  }

  if (disabled) {
    backgroundColor = type === 'primary' ? COLORS.border : 'transparent';
    textClr = COLORS.mute;
    borderColor = COLORS.border;
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
        full ? styles.touchable : styles.touchableAuto,
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
          !full && styles.buttonAuto,
          { backgroundColor, borderColor, borderWidth },
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
                  letterSpacing: 0.52,
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
  touchableAuto: {
    alignSelf: 'flex-start',
  },
  button: {
    width: '100%',
    height: BUTTON_HEIGHT,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonAuto: {
    width: undefined,
    minWidth: 96,
    paddingHorizontal: 20,
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
