import React from 'react';
import { ScrollView, StyleSheet, View, Keyboard } from 'react-native';
import * as Yup from 'yup';
//------------------
import { FormController, SafeAreaWrapper, Typography } from '../../atomComponents';
import {
  Button,
  AppLogo,
  TextField,
  AuthBackLink,
  ScreenOverlayLoader,
} from '../../components';
import { Overline } from '../../components/slife';
import { COLORS } from '../../globalStyle/Theme';
import { resetPassword } from '../../api/authService';
import { useCustomMutation } from '../../query/useCustomMutation';
import { passwordRegex } from '../../validations/customValidations';
import { formatBackendErrors, showMessage } from '../../utils';

const NewPasswordOnlySchema = Yup.object().shape({
  password: Yup.string()
    .required('Password is required')
    .min(10, 'Password must be at least 10 characters')
    .matches(
      passwordRegex,
      'Password must contain at least one letter, one number, and one special character.',
    ),
  password_confirmation: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords do not match'),
});

const ResetPasswordScreen = ({ navigation, route }) => {
  const email = route?.params?.email || '';
  const otp = route?.params?.otp || '';

  const { mutateAsync: requestReset, isPending } = useCustomMutation({
    mutationFn: resetPassword,
    onSuccess: response => {
      showMessage({
        type: 'success',
        message: response?.message || 'Password has been reset successfully.',
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    },
    onError: response => {
      if (response?.status === 422 && response?.data?.message) {
        showMessage({ type: 'danger', message: response.data.message });
      }
    },
  });

  const handleReset = (values, { setErrors }) => {
    Keyboard.dismiss();
    if (!email || !otp) {
      showMessage({
        type: 'danger',
        message: 'Session expired. Please request a new OTP.',
      });
      navigation.replace('ForgotPasswordScreen');
      return;
    }
    requestReset({
      email,
      otp,
      password: values.password,
      password_confirmation: values.password_confirmation,
    }).catch(err => {
      const parsedErrors = formatBackendErrors(err?.response?.data?.errors);
      if (Object.keys(parsedErrors).length) {
        setErrors(parsedErrors);
      }
    });
  };

  return (
    <SafeAreaWrapper keyboardAvoid bgColor={COLORS.background}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <AuthBackLink onPress={() => navigation.goBack()} />

        <View style={styles.logoWrap}>
          <AppLogo size={72} />
        </View>

        <Overline textAlign="center">Account recovery</Overline>
        <Typography
          fixed
          fFamily="spaceGroteskBold700"
          size={28}
          color={COLORS.foreground}
          textAlign="center"
          mT={8}>
          Set new password.
        </Typography>
        <Typography
          fixed
          size={14}
          color={COLORS.body}
          textAlign="center"
          mT={12}
          LineHeight={20}
          style={styles.sub}>
          Choose a new password for your account.
        </Typography>

        <FormController
          initialValues={{
            password: '',
            password_confirmation: '',
          }}
          validationSchema={NewPasswordOnlySchema}
          onSubmit={handleReset}>
          {({ handleSubmit, handleChange, handleBlur, values, errors }) => (
            <View style={styles.form}>
              <TextField
                label="New password"
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                error={errors.password}
                placeholder="Minimum 10 characters"
                secureTextEntry
              />
              <TextField
                label="Confirm new password"
                value={values.password_confirmation}
                onChangeText={handleChange('password_confirmation')}
                onBlur={handleBlur('password_confirmation')}
                error={errors.password_confirmation}
                placeholder="Re-enter password"
                secureTextEntry
              />
              <Button
                label="Reset password"
                onPress={handleSubmit}
              />
            </View>
          )}
        </FormController>
      </ScrollView>
      <ScreenOverlayLoader visible={isPending} />
    </SafeAreaWrapper>
  );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  logoWrap: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  sub: {
    maxWidth: 320,
    alignSelf: 'center',
  },
  form: {
    marginTop: 40,
  },
});
