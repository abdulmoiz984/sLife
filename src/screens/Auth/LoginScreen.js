import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable, Keyboard } from 'react-native';
//-----
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import {
  Button,
  AppLogo,
  TextField,
  DividerOr,
  SocialAuthButton,
} from '../../components';
import { COLORS } from '../../globalStyle/Theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const goToApp = () => {
    Keyboard.dismiss();
    navigation.replace('HomePlaceholder');
  };

  return (
    <SafeAreaWrapper keyboardAvoid isPadding={false} bgColor={COLORS.background}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <AppLogo height={44} style={styles.logo} />

        <Typography
          fixed
          fFamily="sourceSerifBold700"
          size={28}
          color={COLORS.primary}
          mT={28}>
          Sign in
        </Typography>
        <Typography fixed size={15} color={COLORS.mutedForeground} mT={6} LineHeight={20}>
          Welcome back to sLife
        </Typography>

        <View style={styles.form}>
          <TextField
            label="Email or phone"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            mT={16}
          />

          <Pressable
            onPress={() => navigation.navigate('ForgotPasswordScreen')}
            style={styles.forgotLink}>
            <Typography fixed size={14} fFamily="interSemiBold600" color={COLORS.primary}>
              Forgot password?
            </Typography>
          </Pressable>

          <Button label="Sign in" onPress={goToApp} mt={8} fontSize={16} />
        </View>

        <DividerOr />

        <SocialAuthButton
          label="Continue with LinkedIn"
          icon="in"
          iconColor="#0A66C2"
          onPress={goToApp}
        />
        <SocialAuthButton label="Continue with Apple" icon="" onPress={goToApp} />
        <SocialAuthButton label="Continue with Email" icon="@" onPress={goToApp} />

        <Typography
          fixed
          size={14}
          color={COLORS.mutedForeground}
          textAlign="center"
          mT={28}
          LineHeight={20}>
          New to sLife?{' '}
          <Typography
            fixed
            size={14}
            fFamily="interSemiBold600"
            color={COLORS.primary}
            onPress={() => navigation.navigate('SignupScreen')}>
            Join now
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
    paddingTop: 40,
    paddingBottom: 32,
  },
  logo: {
    alignSelf: 'center',
  },
  form: {
    marginTop: 28,
  },
  forgotLink: {
    alignSelf: 'flex-start',
    marginTop: 14,
    marginBottom: 8,
  },
});
