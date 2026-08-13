import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
//------------------
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { EducationsEditor, TopBar } from '../../components/slife';
import { COLORS } from '../../globalStyle/Theme';

const EducationsScreen = ({ navigation }) => {
  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <TopBar
        overline="Profile"
        title="Education"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Typography
          fixed
          size={14}
          color={COLORS.body}
          mB={24}
          LineHeight={20}>
          Manage schools and programs on your profile. Changes sync to the
          server immediately.
        </Typography>
        <EducationsEditor />
      </ScrollView>
    </SafeAreaWrapper>
  );
};

export default EducationsScreen;

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
});
