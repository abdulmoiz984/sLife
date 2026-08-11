import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Keyboard,
} from 'react-native';
//-----
import { Flex, SafeAreaWrapper, Typography } from '../../atomComponents';
import {
  Button,
  AppLogo,
  TextField,
  AuthBackLink,
  RegisterProgressBar,
  InterestChip,
} from '../../components';
import { COLORS } from '../../globalStyle/Theme';
import { interestTags, registerStepTitles } from '../../constants/registerData';

const SignupScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [newsletter, setNewsletter] = useState(true);
  const [selectedInterests, setSelectedInterests] = useState([]);

  const [form, setForm] = useState({
    fullName: '',
    workEmail: '',
    password: '',
    jobTitle: '',
    company: '',
    location: '',
    yearsInIndustry: '',
  });

  const updateField = key => value => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleInterest = tag => {
    setSelectedInterests(prev =>
      prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag],
    );
  };

  const handleContinue = () => {
    Keyboard.dismiss();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    navigation.replace('HomePlaceholder');
  };

  const renderStepFields = () => {
    if (step === 1) {
      return (
        <>
          <TextField
            label="Full name"
            value={form.fullName}
            onChangeText={updateField('fullName')}
            placeholder="Jessica Carter"
            autoCapitalize="words"
          />
          <TextField
            label="Work email"
            value={form.workEmail}
            onChangeText={updateField('workEmail')}
            placeholder="you@example.com"
            keyboardType="email-address"
            mT={16}
          />
          <TextField
            label="Password"
            value={form.password}
            onChangeText={updateField('password')}
            placeholder="At least 8 characters"
            secureTextEntry
            mT={16}
          />
          <Pressable
            onPress={() => setNewsletter(!newsletter)}
            style={styles.checkboxRow}>
            <View style={[styles.checkbox, newsletter && styles.checkboxOn]}>
              {newsletter && (
                <Typography fixed size={11} color={COLORS.primaryForeground}>
                  ✓
                </Typography>
              )}
            </View>
            <Typography
              fixed
              size={13}
              color={COLORS.mutedForeground}
              LineHeight={18}
              style={styles.checkboxText}>
              Subscribe to the sLife weekly newsletter.
            </Typography>
          </Pressable>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <TextField
            label="Job title"
            value={form.jobTitle}
            onChangeText={updateField('jobTitle')}
            placeholder="VP, Underwriting"
          />
          <TextField
            label="Company"
            value={form.company}
            onChangeText={updateField('company')}
            placeholder="Company name"
            mT={16}
          />
          <TextField
            label="Location"
            value={form.location}
            onChangeText={updateField('location')}
            placeholder="City, State"
            mT={16}
          />
          <TextField
            label="Years in industry"
            value={form.yearsInIndustry}
            onChangeText={updateField('yearsInIndustry')}
            placeholder="8"
            keyboardType="number-pad"
            mT={16}
          />
        </>
      );
    }

    return (
      <Flex extraStyle={styles.chipWrap} flexWrap="wrap" direction="row">
        {interestTags.map(tag => (
          <InterestChip
            key={tag}
            label={tag}
            selected={selectedInterests.includes(tag)}
            onPress={() => toggleInterest(tag)}
          />
        ))}
      </Flex>
    );
  };

  return (
    <SafeAreaWrapper keyboardAvoid isPadding={false} bgColor={COLORS.background}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <AuthBackLink onPress={() => navigation.goBack()} />

        <AppLogo height={40} style={styles.logo} />

        <RegisterProgressBar step={step} />

        <Typography
          fixed
          fFamily="sourceSerifBold700"
          size={24}
          color={COLORS.primary}
          mT={24}>
          {registerStepTitles[step]}
        </Typography>
        <Typography fixed size={13} color={COLORS.mutedForeground} mT={4}>
          Step {step} of 3
        </Typography>

        <View style={styles.fields}>{renderStepFields()}</View>

        <Button
          label={step < 3 ? 'Continue' : 'Enter sLife'}
          onPress={handleContinue}
          mt={24}
          fontSize={16}
        />
      </ScrollView>
    </SafeAreaWrapper>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
  },
  logo: {
    alignSelf: 'center',
    marginTop: 16,
  },
  fields: {
    marginTop: 24,
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxText: {
    flex: 1,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
