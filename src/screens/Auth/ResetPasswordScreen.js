import React from 'react';
import { ScrollView, StyleSheet, View, Keyboard } from 'react-native';
//------------------
import { FormController, SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button, AppLogo, TextField, AuthBackLink } from '../../components';
import { Overline } from '../../components/slife';
import { COLORS } from '../../globalStyle/Theme';
import { resetPassword } from '../../api/authService';
import { useCustomMutation } from '../../query/useCustomMutation';
import validatoinSchema from '../../validations';
import { formatBackendErrors, showMessage } from '../../utils';

const ResetPasswordScreen = ({ navigation, route }) => {
  const emailFromRoute = route?.params?.email || '';

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
      if (response?.status === 422 && response?.data?.message && !response?.data?.errors) {
        showMessage({ type: 'danger', message: response.data.message });
      }
    },
  });

  const handleReset = (values, { setErrors }) => {
    Keyboard.dismiss();
    requestReset(values).catch(err => {
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
          Paste the email and reset token from your email, then choose a new password.
        </Typography>

        <FormController
          initialValues={{
            email: emailFromRoute,
            token: '',
            password: '',
            password_confirmation: '',
          }}
          enableReinitialize
          validationSchema={validatoinSchema.authValidations.ResetPasswordSchema}
          onSubmit={handleReset}>
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
              <TextField
                label="Reset token"
                value={values.token}
                onChangeText={handleChange('token')}
                onBlur={handleBlur('token')}
                error={errors.token}
                placeholder="Paste token from email"
                autoCapitalize="none"
              />
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
                loader={isPending}
              />
            </View>
          )}
        </FormController>
      </ScrollView>
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
