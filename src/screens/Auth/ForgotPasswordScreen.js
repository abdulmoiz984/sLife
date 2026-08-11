import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Keyboard } from 'react-native';
//-----
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button, AppLogo, TextField, AuthBackLink } from '../../components';
import { COLORS } from '../../globalStyle/Theme';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    Keyboard.dismiss();
    navigation.navigate('LoginScreen');
  };

  return (
    <SafeAreaWrapper keyboardAvoid isPadding={false} bgColor={COLORS.background}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <AuthBackLink onPress={() => navigation.goBack()} />

        <AppLogo height={40} style={styles.logo} />

        <Typography
          fixed
          fFamily="sourceSerifBold700"
          size={24}
          color={COLORS.primary}
          mT={28}>
          Reset password
        </Typography>
        <Typography fixed size={15} color={COLORS.mutedForeground} mT={6} LineHeight={20}>
          Enter your email and we'll send a reset link.
        </Typography>

        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
          />

          <Button label="Send reset link" onPress={handleSubmit} mt={24} fontSize={16} />
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
  },
  logo: {
    alignSelf: 'center',
    marginTop: 20,
  },
  form: {
    marginTop: 24,
  },
});
