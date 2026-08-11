import React from 'react';
import { Typography } from '../../atomComponents';
import { COLORS } from '../../globalStyle/Theme';

const InputLabel = ({ title = '', isRequired = false, mT = 0, mB = 8, ...props }) => {
  return (
    <Typography
      fixed
      mT={mT}
      mB={mB}
      size={14}
      fFamily="interMedium500"
      color={COLORS.foreground}
      {...props}>
      {title}
      {isRequired && (
        <Typography fixed color={COLORS.destructive}>
          {' '}
          *
        </Typography>
      )}
    </Typography>
  );
};

export default InputLabel;
