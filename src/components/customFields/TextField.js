import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
//-------
import Sizer from '../../helpers/Sizer';
import { COLORS, RADIUS, getFontStyle } from '../../globalStyle/Theme';
import Typography from '../../atomComponents/Typography';
import InputLabel from './InputLabel';

const TextField = ({
  label,
  value = '',
  onChangeText,
  onBlur,
  placeholder = '',
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  containerStyle = {},
  inputStyle = {},
  mT = 0,
  mB = 0,
  error = '',
  isRequired = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hidePassword, setHidePassword] = useState(secureTextEntry);

  return (
    <View style={[{ marginTop: Sizer.vSize(mT), marginBottom: Sizer.vSize(mB) }, containerStyle]}>
      {!!label && (
        <InputLabel title={label} isRequired={isRequired} mT={0} mB={4} />
      )}
      <View
        style={[
          styles.inputWrap,
          isFocused && styles.inputWrapFocused,
          !!error && styles.inputWrapError,
        ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={e => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={COLORS.mutedForeground}
          secureTextEntry={hidePassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[styles.input, inputStyle]}
          {...props}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setHidePassword(!hidePassword)}
            hitSlop={8}
            style={styles.toggleBtn}>
            <Typography fixed size={13} color={COLORS.primary} fFamily="interSemiBold600">
              {hidePassword ? 'Show' : 'Hide'}
            </Typography>
          </Pressable>
        )}
      </View>
      {!!error && (
        <Typography fixed size={12} color={COLORS.destructive} mT={4}>
          {error}
        </Typography>
      )}
    </View>
  );
};

export default TextField;

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.input,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputWrapFocused: {
    borderColor: COLORS.primary,
  },
  inputWrapError: {
    borderColor: COLORS.destructive,
  },
  input: {
    flex: 1,
    fontSize: 16,
    ...getFontStyle('interRegular400'),
    color: COLORS.foreground,
    paddingVertical: 12,
  },
  toggleBtn: {
    paddingLeft: Sizer.hSize(8),
  },
});
