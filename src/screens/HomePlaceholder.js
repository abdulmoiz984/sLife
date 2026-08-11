import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaWrapper, Typography } from '../atomComponents';
import { Button } from '../components';
import { COLORS } from '../globalStyle/Theme';

/** Temporary post-login landing until main UI screens are built */
const HomePlaceholder = ({ navigation }) => {
  return (
    <SafeAreaWrapper bgColor={COLORS.background}>
      <View style={styles.wrap}>
        <Typography
          fixed
          fFamily="sourceSerifBold700"
          size={24}
          color={COLORS.primary}
          textAlign="center">
          sLife
        </Typography>
        <Typography
          fixed
          size={15}
          color={COLORS.mutedForeground}
          mT={8}
          textAlign="center"
          LineHeight={22}>
          App foundation is ready. Add main screens here next.
        </Typography>
        <Button
          label="Back to Sign in"
          type="secondary"
          onPress={() => navigation.replace('LoginScreen')}
          mt={28}
          fontSize={16}
        />
      </View>
    </SafeAreaWrapper>
  );
};

export default HomePlaceholder;

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
