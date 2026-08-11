import React from 'react';
import { Typography } from '../../atomComponents';
import { COLORS, GLOBALSTYLE } from '../../globalStyle/Theme';

const Overline = ({ children, style, textAlign = 'left' }) => {
  return (
    <Typography
      fixed
      size={11}
      fFamily="spaceGroteskSemiBold600"
      color={COLORS.primary}
      textTransform="uppercase"
      textAlign={textAlign}
      style={[GLOBALSTYLE.overline, { letterSpacing: 0.88 }, style]}>
      {children}
    </Typography>
  );
};

export default Overline;
