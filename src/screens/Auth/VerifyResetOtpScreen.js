import React from 'react';
import { ScrollView, StyleSheet, View, Keyboard, Pressable } from 'react-native';
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
import { forgotPassword, verifyResetOtp } from '../../api/authService';
import { useCustomMutation } from '../../query/useCustomMutation';
import { useResendCooldown } from '../../hooks/useResendCooldown';
import { formatBackendErrors, showMessage } from '../../utils';

const OtpOnlySchema = Yup.object().shape({
  otp: Yup.string()
    .required('OTP is required')
    .matches(/^\d{6}$/, 'Enter the 6-digit code from your email'),
});

const VerifyResetOtpScreen = ({ navigation, route }) => {
  const email = route?.params?.email || '';
  const { secondsLeft, isCoolingDown, startCooldown } = useResendCooldown(60, {
    startOnMount: false,
  });

  const { mutateAsync: requestVerify, isPending } = useCustomMutation({
    mutationFn: verifyResetOtp,
    onSuccess: (response, values) => {
      showMessage({
        type: 'success',
        message: response?.message || 'OTP verified successfully.',
      });
      navigation.replace('ResetPasswordScreen', {
        email,
        otp: values.otp,
      });
    },
    onError: response => {
      if (response?.status === 422 && response?.data?.message) {
        showMessage({ type: 'danger', message: response.data.message });
      }
    },
  });

  const { mutateAsync: requestResend, isPending: resending } = useCustomMutation({
    mutationFn: forgotPassword,
    onSuccess: response => {
      startCooldown();
      showMessage({
        type: 'success',
        message:
          response?.message ||
          'If an account exists with that email, a password reset OTP has been sent.',
      });
    },
  });

  const handleVerify = (values, { setErrors }) => {
    Keyboard.dismiss();
    if (!email) {
      showMessage({
        type: 'danger',
        message: 'Email is missing. Go back and request an OTP again.',
      });
      return;
    }
    requestVerify({ email, otp: values.otp }).catch(err => {
      const parsedErrors = formatBackendErrors(err?.response?.data?.errors);
      if (Object.keys(parsedErrors).length) {
        setErrors(parsedErrors);
      }
    });
  };

  const handleResend = () => {
    if (isCoolingDown || resending) {
      return;
    }
    if (!email) {
      showMessage({ type: 'danger', message: 'Email is required to resend OTP.' });
      return;
    }
    requestResend({ email }).catch(err => {
      const message = err?.response?.data?.message;
      if (message) {
        showMessage({ type: 'danger', message });
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
          Enter OTP.
        </Typography>
        <Typography
          fixed
          size={14}
          color={COLORS.body}
          textAlign="center"
          mT={12}
          LineHeight={20}
          style={styles.sub}>
          Enter the 6-digit code sent to {email || 'your email'}. It expires in
          10 minutes.
        </Typography>

        <FormController
          initialValues={{ otp: '' }}
          validationSchema={OtpOnlySchema}
          onSubmit={handleVerify}>
          {({ handleSubmit, handleChange, handleBlur, values, errors }) => (
            <View style={styles.form}>
              <TextField
                label="OTP"
                value={values.otp}
                onChangeText={text =>
                  handleChange('otp')(String(text).replace(/\D/g, '').slice(0, 6))
                }
                onBlur={handleBlur('otp')}
                error={errors.otp}
                placeholder="6-digit code"
                keyboardType="number-pad"
                maxLength={6}
                autoCapitalize="none"
              />
              <Button
                label="Verify OTP"
                onPress={handleSubmit}
              />
              <Pressable
                onPress={handleResend}
                disabled={isCoolingDown || resending}
                style={styles.resend}>
                <Typography
                  fixed
                  size={12}
                  fFamily="interSemiBold600"
                  color={
                    isCoolingDown || resending ? COLORS.mute : COLORS.primary
                  }
                  textAlign="center"
                  textTransform="uppercase"
                  style={styles.track}>
                  {resending
                    ? 'Sending…'
                    : isCoolingDown
                      ? `Resend in ${secondsLeft}s`
                      : 'Resend OTP'}
                </Typography>
              </Pressable>
            </View>
          )}
        </FormController>
      </ScrollView>
      <ScreenOverlayLoader visible={isPending || resending} />
    </SafeAreaWrapper>
  );
};

export default VerifyResetOtpScreen;

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
  resend: {
    marginTop: 20,
    paddingVertical: 8,
  },
  track: {
    letterSpacing: 0.72,
  },
});
