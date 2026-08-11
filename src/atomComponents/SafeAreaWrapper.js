import { KeyboardAvoidingView, Platform } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
//----
import { COLORS, GLOBALSTYLE } from '../globalStyle/Theme';

const SafeAreaWrapper = ({
  children,
  edges,
  contentStyle = {},
  bgColor = COLORS.mainBg,
  keyboardAvoid = false,
  isPadding = true,
}) => {
  const Wrapper = keyboardAvoid ? KeyboardAvoidingView : React.Fragment;

  return (
    <SafeAreaView
      style={[
        {
          flex: 1,
          backgroundColor: bgColor,
          ...contentStyle,
        },
        isPadding && GLOBALSTYLE.paddingHor,
      ]}
      edges={edges}>
      <Wrapper
        {...(keyboardAvoid
          ? {
              behavior: Platform.OS === 'ios' ? 'padding' : 'height',
              style: { flex: 1 },
              keyboardVerticalOffset: -100,
            }
          : {})}>
        {children}
      </Wrapper>
    </SafeAreaView>
  );
};

export default SafeAreaWrapper;
