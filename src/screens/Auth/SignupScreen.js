import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable, Keyboard } from 'react-native';
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import {
  Button,
  AppLogo,
  TextField,
  DividerOr,
  SocialAuthButton,
} from '../../components';
import { Icon, Overline } from '../../components/slife';
import { COLORS } from '../../globalStyle/Theme';

const SignupScreen = ({ navigation }) => {
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirm: '',
  });

  const set = key => value => setForm(prev => ({ ...prev, [key]: value }));

  const submit = () => {
    Keyboard.dismiss();
    if (!agreed) return;
    navigation.navigate('VerifyScreen');
  };

  const goHome = () => navigation.replace('MainTabs');

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

        <View style={styles.form}>
          <TextField
            label="Full name"
            value={form.fullName}
            onChangeText={set('fullName')}
            placeholder="e.g. Jordan Everly"
            autoCapitalize="words"
          />
          <TextField
            label="Business email"
            value={form.email}
            onChangeText={set('email')}
            placeholder="you@company.com"
            keyboardType="email-address"
          />
          <TextField
            label="Password"
            value={form.password}
            onChangeText={set('password')}
            placeholder="Minimum 10 characters"
            secureTextEntry
          />
          <TextField
            label="Confirm password"
            value={form.confirm}
            onChangeText={set('confirm')}
            placeholder="Re-enter password"
            secureTextEntry
          />

          <Pressable onPress={() => setAgreed(v => !v)} style={styles.checkRow}>
            <View style={[styles.box, agreed && styles.boxOn]}>
              {agreed && <Icon.Check size={16} color={COLORS.primaryForeground} strokeWidth={3} />}
            </View>
            <Typography fixed size={13} color={COLORS.body} LineHeight={20} style={styles.checkCopy}>
              I agree to the{' '}
              <Typography fixed size={13} color={COLORS.primary} style={styles.underline}>
                Terms
              </Typography>{' '}
              and{' '}
              <Typography fixed size={13} color={COLORS.primary} style={styles.underline}>
                Privacy Policy
              </Typography>
              , and consent to identity verification.
            </Typography>
          </Pressable>

          <Button label="Create account" onPress={submit} disabled={!agreed} />
        </View>

        <DividerOr />

        <SocialAuthButton label="Continue with LinkedIn" icon={<Icon.LinkedIn />} onPress={goHome} />
        <SocialAuthButton label="Continue with Facebook" icon={<Icon.Facebook />} onPress={goHome} />

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
    marginBottom: 16,
  },
  box: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
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
