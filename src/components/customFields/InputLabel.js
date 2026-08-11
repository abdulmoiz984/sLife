import React from 'react';
import { Typography } from '../../atomComponents';
import { COLORS } from '../../globalStyle/Theme';

const InputLabel = ({ title = '', isRequired = false, mT = 0, mB = 8, ...props }) => {
  return (
    <Typography
      fixed
      mT={mT}
      mB={mB}
      size={11}
      fFamily="interSemiBold600"
      color={COLORS.mute}
      textTransform="uppercase"
      style={{ letterSpacing: 0.88 }}
      {...props}>
      {title}
      {isRequired && (
        <Typography fixed color={COLORS.destructive} size={11}>
          {' '}
          *
        </Typography>
      )}
    </Typography>
  );
};

export default InputLabel;
