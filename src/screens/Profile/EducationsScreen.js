import React, { useRef } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
//------------------
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { EducationsEditor, TopBar } from '../../components/slife';
import { COLORS } from '../../globalStyle/Theme';

/**
 * Profile → Education
 * Lists / adds / edits educations via EducationsEditor (Module C APIs).
 */
const EducationsScreen = ({ navigation }) => {
  const scrollRef = useRef(null);

  const scrollFormIntoView = () => {
    // Description sits at the bottom of the add/edit form — keep it above keyboard.
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    });
  };

  return (
    <SafeAreaWrapper
      edges={['top', 'bottom']}
      bgColor={COLORS.background}
      keyboardAvoid
      keyboardVerticalOffset={0}>
      <TopBar
        overline="Profile"
        title="Education"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets>
        <Typography
          fixed
          size={14}
          color={COLORS.body}
          mB={24}
          LineHeight={20}>
          Manage schools and programs on your profile. Changes sync to the
          server immediately.
        </Typography>
        <EducationsEditor onDescriptionFocus={scrollFormIntoView} />
      </ScrollView>
    </SafeAreaWrapper>
  );
};

export default EducationsScreen;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 160,
    flexGrow: 1,
  },
});
