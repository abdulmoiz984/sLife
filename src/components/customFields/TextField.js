import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import Sizer from '../../helpers/Sizer';
import { COLORS, getFontStyle, RADIUS } from '../../globalStyle/Theme';
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
  mB = 16,
  error = '',
  isRequired = false,
  multiline = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hidePassword, setHidePassword] = useState(secureTextEntry);

  return (
    <View style={[{ marginTop: Sizer.vSize(mT), marginBottom: Sizer.vSize(mB) }, containerStyle]}>
      {!!label && <InputLabel title={label} isRequired={isRequired} mT={0} mB={8} />}
      <View
        style={[
          styles.inputWrap,
          multiline && styles.areaWrap,
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
          placeholderTextColor={COLORS.mute}
          secureTextEntry={hidePassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[styles.input, multiline && styles.area, inputStyle]}
          {...props}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setHidePassword(!hidePassword)}
            hitSlop={8}
            style={styles.toggleBtn}>
            <Typography fixed size={12} color={COLORS.primary} fFamily="interSemiBold600" textTransform="uppercase">
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
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  areaWrap: {
    alignItems: 'flex-start',
    minHeight: 112,
    paddingVertical: 12,
  },
  inputWrapFocused: {
    borderColor: COLORS.primary,
  },
  inputWrapError: {
    borderColor: COLORS.destructive,
  },
  input: {
    flex: 1,
    fontSize: 15,
    ...getFontStyle('interRegular400'),
    color: COLORS.foreground,
    paddingVertical: 12,
  },
  area: {
    minHeight: 88,
  },
  toggleBtn: {
    paddingLeft: Sizer.hSize(8),
  },
});
