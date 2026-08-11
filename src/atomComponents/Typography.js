import React from 'react';
import { Text } from 'react-native';
import { COLORS, getFontStyle } from '../globalStyle/Theme';
import Sizer from '../helpers/Sizer';

const Typography = ({
  color = COLORS.foreground,
  size = 14,
  /** When true, uses exact pt sizes (no device scaling) — prefer for auth / forms */
  fixed = false,
  pT = 0,
  pB = 0,
  pR = 0,
  pL = 0,
  mT = 0,
  mB = 0,
  mL = 0,
  mR = 0,
  fFamily = 'interRegular400',
  textAlign = 'left',
  textTransform,
  numberOfLines,
  ellipsizeMode,
  LineHeight,
  children,
  style,
  onPress,
  ...props
}) => {
  const fontSize = fixed ? size : Sizer.fS(size);
  const space = (value, scaled) => (fixed ? value : scaled(value));

  const styleObj = {
    color,
    fontSize,
    ...getFontStyle(fFamily),
    textAlign,
    ...(pT ? { paddingTop: space(pT, Sizer.hSize) } : null),
    ...(pB ? { paddingBottom: space(pB, Sizer.hSize) } : null),
    ...(pL ? { paddingLeft: space(pL, Sizer.vSize) } : null),
    ...(pR ? { paddingRight: space(pR, Sizer.vSize) } : null),
    ...(mT ? { marginTop: space(mT, Sizer.hSize) } : null),
    ...(mB ? { marginBottom: space(mB, Sizer.hSize) } : null),
    ...(mL ? { marginLeft: space(mL, Sizer.vSize) } : null),
    ...(mR ? { marginRight: space(mR, Sizer.vSize) } : null),
    ...(textTransform && { textTransform }),
    ...(LineHeight
      ? { lineHeight: fixed ? LineHeight : Sizer.hSize(LineHeight) }
      : null),
    ...style,
  };

  return (
    <Text
      style={styleObj}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      onPress={onPress}
      {...props}>
      {children}
    </Text>
  );
};

export default React.memo(Typography);
