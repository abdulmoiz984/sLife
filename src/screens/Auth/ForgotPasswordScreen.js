import React from 'react';
import { ScrollView, StyleSheet, View, Keyboard, Pressable } from 'react-native';
//------------------
import { FormController, SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button, AppLogo, TextField, AuthBackLink } from '../../components';
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
          'If an account exists with that email, a password reset link has been sent.',
      });
      navigation.navigate('ResetPasswordScreen', { email: values?.email });
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
          Enter your email and we'll send a reset link.
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
                label="Send reset link"
                onPress={handleSubmit}
                loader={isPending}
              />
              <Pressable
                onPress={() =>
                  navigation.navigate('ResetPasswordScreen', {
                    email: values.email,
                  })
                }
                style={styles.tokenLink}>
                <Typography
                  fixed
                  size={12}
                  fFamily="interSemiBold600"
                  color={COLORS.primary}
                  textAlign="center"
                  textTransform="uppercase"
                  style={styles.track}>
                  Already have a reset token?
                </Typography>
              </Pressable>
            </View>
          )}
        </FormController>
      </ScrollView>
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
  tokenLink: {
    marginTop: 20,
    paddingVertical: 8,
  },
  track: {
    letterSpacing: 0.72,
  },
});
