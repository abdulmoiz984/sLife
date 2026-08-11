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

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const goToApp = () => {
    Keyboard.dismiss();
    navigation.replace('MainTabs');
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

        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            keyboardType="email-address"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
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
          <Button label="Log in" onPress={goToApp} />
        </View>

        <DividerOr />

        <SocialAuthButton
          label="Continue with LinkedIn"
          icon={<Icon.LinkedIn />}
          onPress={goToApp}
        />
        <SocialAuthButton
          label="Continue with Facebook"
          icon={<Icon.Facebook />}
          onPress={goToApp}
        />

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
