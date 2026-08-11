import React from 'react';
import { Typography } from '../../atomComponents';
import { COLORS } from '../../globalStyle/Theme';

const SectionLabel = ({ children, style }) => {
  return (
    <Typography
      fixed
      size={11}
      fFamily="interSemiBold600"
      color={COLORS.mute}
      textTransform="uppercase"
      mB={12}
      style={[{ letterSpacing: 1.54 }, style]}>
      {children}
    </Typography>
  );
};

export default SectionLabel;
