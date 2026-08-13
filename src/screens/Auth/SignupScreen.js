import React from 'react';
import { ScrollView, StyleSheet, View, Pressable, Keyboard } from 'react-native';
import { useDispatch } from 'react-redux';
//------------------
import { FormController, SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button, AppLogo, TextField, ScreenOverlayLoader } from '../../components';
import { Icon, Overline } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { register } from '../../api/authService';
import { useCustomMutation } from '../../query/useCustomMutation';
import { onRegisterSuccess } from '../../query/partials/responseManager';
import validatoinSchema from '../../validations';
import { formatBackendErrors } from '../../utils';

const SignupScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const { mutateAsync: requestRegister, isPending } = useCustomMutation({
    mutationFn: register,
    onSuccess: (response, values) => {
      onRegisterSuccess(response, values?.email, navigation, dispatch);
    },
  });

  const handleRegister = (values, { setErrors }) => {
    Keyboard.dismiss();
    requestRegister(values).catch(err => {
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

        <Overline textAlign="center">Request Membership</Overline>
        <Typography
          fixed
          fFamily="spaceGroteskBold700"
          size={28}
          color={COLORS.foreground}
          textAlign="center"
          mT={8}>
          Join the network.
        </Typography>
        <Typography
          fixed
          size={14}
          color={COLORS.body}
          textAlign="center"
          mT={12}
          LineHeight={20}
          style={styles.sub}>
          Every application is reviewed. Only verified professionals are admitted.
        </Typography>

        <FormController
          initialValues={{
            full_name: '',
            email: '',
            password: '',
            password_confirmation: '',
            terms_accepted: false,
          }}
          validationSchema={validatoinSchema.authValidations.SignUpSchema}
          onSubmit={handleRegister}>
          {({
            handleSubmit,
            handleChange,
            handleBlur,
            values,
            errors,
            setFieldValue,
          }) => (
            <View style={styles.form}>
              <TextField
                label="Full name"
                value={values.full_name}
                onChangeText={handleChange('full_name')}
                onBlur={handleBlur('full_name')}
                error={errors.full_name}
                placeholder="e.g. Jordan Everly"
                autoCapitalize="words"
              />
              <TextField
                label="Business email"
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
                placeholder="Minimum 10 characters"
                secureTextEntry
              />
              <TextField
                label="Confirm password"
                value={values.password_confirmation}
                onChangeText={handleChange('password_confirmation')}
                onBlur={handleBlur('password_confirmation')}
                error={errors.password_confirmation}
                placeholder="Re-enter password"
                secureTextEntry
              />

              <Pressable
                onPress={() =>
                  setFieldValue('terms_accepted', !values.terms_accepted)
                }
                style={styles.checkRow}>
                <View
                  style={[styles.box, values.terms_accepted && styles.boxOn]}>
                  {values.terms_accepted && (
                    <Icon.Check
                      size={16}
                      color={COLORS.primaryForeground}
                      strokeWidth={3}
                    />
                  )}
                </View>
                <Typography
                  fixed
                  size={13}
                  color={COLORS.body}
                  LineHeight={20}
                  style={styles.checkCopy}>
                  I agree to the{' '}
                  <Typography
                    fixed
                    size={13}
                    color={COLORS.primary}
                    style={styles.underline}>
                    Terms
                  </Typography>{' '}
                  and{' '}
                  <Typography
                    fixed
                    size={13}
                    color={COLORS.primary}
                    style={styles.underline}>
                    Privacy Policy
                  </Typography>
                  , and consent to identity verification.
                </Typography>
              </Pressable>
              {!!errors.terms_accepted && (
                <Typography fixed size={12} color={COLORS.destructive} mB={12}>
                  {errors.terms_accepted}
                </Typography>
              )}

              <Button
                label="Create account"
                onPress={handleSubmit}
                disabled={!values.terms_accepted}
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
          Already a member?{' '}
          <Typography
            fixed
            size={12}
            fFamily="interSemiBold600"
            color={COLORS.primary}
            textTransform="uppercase"
            style={styles.track}
            onPress={() => navigation.navigate('LoginScreen')}>
            Log in
          </Typography>
        </Typography>
      </ScrollView>
      <ScreenOverlayLoader visible={isPending} />
    </SafeAreaWrapper>
  );
};

export default SignupScreen;

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
    paddingBottom: 24,
  },
  sub: {
    maxWidth: 320,
    alignSelf: 'center',
  },
  form: {
    marginTop: 32,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 8,
    marginBottom: 8,
  },
  box: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkCopy: {
    flex: 1,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  track: {
    letterSpacing: 0.72,
  },
});
