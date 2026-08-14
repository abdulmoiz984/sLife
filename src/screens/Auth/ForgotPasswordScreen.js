import React from 'react';
import { ScrollView, StyleSheet, View, Keyboard } from 'react-native';
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
import { forgotPassword } from '../../api/authService';
import { useCustomMutation } from '../../query/useCustomMutation';
import validatoinSchema from '../../validations';
import { formatBackendErrors, showMessage } from '../../utils';

const ForgotPasswordScreen = ({ navigation }) => {
  const { mutateAsync: requestForgot, isPending } = useCustomMutation({
    mutationFn: forgotPassword,
    onSuccess: (response, values) => {
      showMessage({
        type: 'success',
        message:
          response?.message ||
          'If an account exists with that email, a password reset OTP has been sent.',
      });
      navigation.replace('VerifyResetOtpScreen', { email: values?.email });
    },
    onError: response => {
      if (response?.status === 422 && response?.data?.message && !response?.data?.errors) {
        showMessage({ type: 'danger', message: response.data.message });
      }
    },
  });

  const handleForgotPassword = (values, { setErrors }) => {
    Keyboard.dismiss();
    requestForgot(values).catch(err => {
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
          Reset password.
        </Typography>
        <Typography
          fixed
          size={14}
          color={COLORS.body}
          textAlign="center"
          mT={12}
          LineHeight={20}
          style={styles.sub}>
          Enter your email and we'll send a 6-digit OTP. Codes expire in 10
          minutes.
        </Typography>

        <FormController
          initialValues={{ email: '' }}
          validationSchema={validatoinSchema.authValidations.ForgotPasswordSchema}
          onSubmit={handleForgotPassword}>
          {({ handleSubmit, handleChange, handleBlur, values, errors }) => (
            <View style={styles.form}>
              <TextField
                label="Email"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                error={errors.email}
                placeholder="you@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Button
                label="Send OTP"
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

export default ForgotPasswordScreen;

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
