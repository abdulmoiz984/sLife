import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable, Keyboard } from 'react-native';
import { useDispatch } from 'react-redux';
//------------------
import { FormController, SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button, AppLogo, TextField, ScreenOverlayLoader } from '../../components';
import { Overline } from '../../components/slife';
import { COLORS } from '../../globalStyle/Theme';
import { login } from '../../api/authService';
import { useCustomMutation } from '../../query/useCustomMutation';
import { onLoginSuccess } from '../../query/partials/responseManager';
import validatoinSchema from '../../validations';
import { formatBackendErrors, showMessage } from '../../utils';

const DEV_EMAIL = 'david@mailinator.com';
const DEV_PASSWORD = 'Admin@1234';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const { mutateAsync: requestLogin, isPending } = useCustomMutation({
    mutationFn: data => login(data, setIsLoading),
    onSuccess: (response, reqData) => {
      onLoginSuccess(response, navigation, dispatch, reqData, setIsLoading);
    },
    onError: response => {
      setIsLoading(false);
      if (response?.status === 422 && response?.data?.message && !response?.data?.errors) {
        showMessage({ type: 'danger', message: response.data.message });
      }
    },
  });

  const handleLogin = (values, { setErrors }) => {
    Keyboard.dismiss();
    requestLogin(values).catch(err => {
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
        <View style={styles.logoWrap}>
          <AppLogo size={72} />
        </View>

        <Overline textAlign="center">Members only</Overline>
        <Typography
          fixed
          fFamily="spaceGroteskBold700"
          size={28}
          color={COLORS.foreground}
          textAlign="center"
          mT={8}>
          Welcome back.
        </Typography>
        <Typography
          fixed
          size={14}
          color={COLORS.body}
          textAlign="center"
          mT={12}
          LineHeight={20}
          style={styles.sub}>
          Sign in to your private network of verified professionals.
        </Typography>

        <FormController
          initialValues={{
            email: __DEV__ ? DEV_EMAIL : '',
            password: __DEV__ ? DEV_PASSWORD : '',
          }}
          validationSchema={validatoinSchema.authValidations.SignInSchema}
          onSubmit={handleLogin}>
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
                label="Password"
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                error={errors.password}
                placeholder="••••••••"
                secureTextEntry
              />
              <Pressable
                onPress={() => navigation.navigate('ForgotPasswordScreen')}
                style={styles.forgotLink}>
                <Typography
                  fixed
                  size={12}
                  fFamily="interSemiBold600"
                  color={COLORS.primary}
                  textTransform="uppercase"
                  style={styles.track}>
                  Forgot password?
                </Typography>
              </Pressable>
              <Button
                label="Log in"
                onPress={handleSubmit}
              />
            </View>
          )}
        </FormController>

        <Typography
          fixed
          size={13}
          color={COLORS.body}
          textAlign="center"
          mT={40}
          mB={8}
          LineHeight={20}>
          Don't have an account?{' '}
          <Typography
            fixed
            size={12}
            fFamily="interSemiBold600"
            color={COLORS.primary}
            textTransform="uppercase"
            style={styles.track}
            onPress={() => navigation.navigate('SignupScreen')}>
            Sign up
          </Typography>
        </Typography>
      </ScrollView>
      <ScreenOverlayLoader visible={isPending || isLoading} />
    </SafeAreaWrapper>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  logoWrap: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
  },
  sub: {
    maxWidth: 320,
    alignSelf: 'center',
  },
  form: {
    marginTop: 40,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 16,
  },
  track: {
    letterSpacing: 0.72,
  },
});
