import React from 'react';
import { View } from 'react-native';
import Sizer from '../helpers/Sizer';

const Flex = ({
  children = '',
  direction,
  flex,
  jusContent,
  algItems,
  flexWrap,
  mT,
  mB,
  gap,
  flexStyle = '',
  extraStyle = {},
}) => {
  return (
    <View
      style={[
        {
          flexDirection: direction || 'row',
          justifyContent: jusContent || 'flex-start',
          alignItems: algItems || 'flex-start',
          flexWrap: flexWrap || 'nowrap',
          ...(flex != null ? { flex } : null),
          ...(gap != null ? { gap } : null),
          ...(mT != null ? { marginTop: Sizer.vSize(mT) } : null),
          ...(mB != null ? { marginBottom: Sizer.vSize(mB) } : null),
          ...(typeof flexStyle === 'object' ? flexStyle : null),
        },
        extraStyle,
      ]}>
      {children}
    </View>
  );
};

export default React.memo(Flex);
