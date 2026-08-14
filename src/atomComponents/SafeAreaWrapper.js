import { KeyboardAvoidingView, Platform } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, GLOBALSTYLE } from '../globalStyle/Theme';

const SafeAreaWrapper = ({
  children,
  edges,
  contentStyle = {},
  bgColor = COLORS.background,
  keyboardAvoid = false,
  keyboardVerticalOffset,
  isPadding = false,
}) => {
  const Wrapper = keyboardAvoid ? KeyboardAvoidingView : React.Fragment;
  const offset =
    keyboardVerticalOffset != null
      ? keyboardVerticalOffset
      : Platform.OS === 'ios'
        ? 0
        : 0;

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
              behavior: Platform.OS === 'ios' ? 'padding' : undefined,
              style: { flex: 1 },
              keyboardVerticalOffset: offset,
            }
          : {})}>
        {children}
      </Wrapper>
    </SafeAreaView>
  );
};

export default SafeAreaWrapper;
