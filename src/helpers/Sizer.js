import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

const hSize = (size, factor = 1) => {
  return moderateScale(size, factor);
};

const vSize = (size, factor = 1) => {
  return verticalScale(size);
};

const fS = size => {
  return scale(size);
};

export default {
  fS,
  vSize,
  hSize,
};
