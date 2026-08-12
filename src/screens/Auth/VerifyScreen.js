import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button, TextField, AppLogo, RegisterProgressBar } from '../../components';
import { Icon, Chip, Overline, UploadTile } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { goals, industries, interests, professionalRoles } from '../../constants/mockData';

const STEPS = [
  'Basic Information',
  'Professional Information',
  'Organization (Optional)',
  'Verification Documents',
  'Bio & Interests',
  'Networking Goals',
];

const DOCS = [
  { key: 'linkedin', label: 'LinkedIn or portfolio URL', req: true },
  { key: 'resume', label: 'Resume / CV' },
  { key: 'license', label: 'Professional license (if applicable)' },
  { key: 'degree', label: 'Educational credential' },
  { key: 'id', label: 'Government ID (Optional)' },
];

const VerifyScreen = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [f, setF] = useState({});
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [roleType, setRoleType] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [docs, setDocs] = useState({});

  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  const toggle = (arr, setArr, v) => {
    setArr(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return !!(f.name && f.phone && f.location);
      case 1:
        return !!(f.title && selectedIndustries.length && f.years && roleType);
      case 2:
        return true;
      case 3:
        return Object.values(docs).filter(Boolean).length >= 1;
      case 4:
        return !!f.bio && selectedInterests.length >= 2;
      case 5:
        return selectedGoals.length >= 1;
      default:
        return false;
    }
  }, [step, f, selectedIndustries, roleType, docs, selectedInterests, selectedGoals]);

  if (submitted) {
    return (
      <SafeAreaWrapper bgColor={COLORS.background}>
        <View style={styles.success}>
          <View style={styles.checkSquare}>
            <Icon.Check size={40} color={COLORS.primary} strokeWidth={2} />
          </View>
          <Overline textAlign="center">Submission received</Overline>
          <Typography
            fixed
            size={28}
            fFamily="spaceGroteskBold700"
            color={COLORS.foreground}
            textAlign="center"
            mT={8}>
            Your profile is under review.
          </Typography>
          <Typography
            fixed
            size={14}
            color={COLORS.body}
            textAlign="center"
            mT={16}
            LineHeight={20}
            style={styles.successBody}>
            Our verification team typically completes review within 24–48 hours. You will be
            notified as soon as your membership is approved.
          </Typography>
          <View style={styles.successBtns}>
            <Button
              label="Complete your profile"
              onPress={() => navigation.replace('ProfileSetupScreen')}
            />
            <Button
              type="secondary"
              label="Explore the network"
              onPress={() => navigation.replace('MainTabs')}
              mt={12}
            />
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper keyboardAvoid bgColor={COLORS.background}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => (step > 0 ? setStep(step - 1) : navigation.goBack())}
            hitSlop={8}
            style={styles.iconBtn}>
            <Icon.ArrowLeft size={20} color={COLORS.foreground} />
          </Pressable>
          <AppLogo size={28} />
          <View style={styles.iconBtn} />
        </View>
        <RegisterProgressBar step={step + 1} total={STEPS.length} />
        <Overline style={styles.stepKicker}>
          Step {step + 1} of {STEPS.length}
        </Overline>
        <Typography fixed size={22} fFamily="spaceGroteskBold700" color={COLORS.foreground} mT={4}>
          {STEPS[step]}
        </Typography>
        <Typography fixed size={13} color={COLORS.body} mT={8}>
          For every professional — developers, designers, doctors, lawyers, students, freelancers,
          and more.
        </Typography>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <>
            <View style={styles.photoWrap}>
              <View style={styles.photoBtn}>
                <Icon.Camera size={24} color={COLORS.primary} />
                <Typography
                  fixed
                  size={10}
                  fFamily="interSemiBold600"
                  color={COLORS.primary}
                  textTransform="uppercase"
                  mT={4}
                  style={styles.track}>
                  Add photo
                </Typography>
              </View>
            </View>
            <TextField label="Full name" placeholder="Jordan Everly" value={f.name} onChangeText={v => set('name', v)} autoCapitalize="words" />
            <TextField label="Phone" placeholder="+1 (555) 000-0000" value={f.phone} onChangeText={v => set('phone', v)} keyboardType="phone-pad" />
            <TextField label="Location" placeholder="City, State, Country" value={f.location} onChangeText={v => set('location', v)} autoCapitalize="words" />
          </>
        )}

        {step === 1 && (
          <>
            <TextField
              label="Professional title / headline"
              placeholder="e.g. Web Developer, UI/UX Designer, Physician, Student"
              value={f.title}
              onChangeText={v => set('title', v)}
            />
            <Typography
              fixed
              size={11}
              fFamily="interSemiBold600"
              color={COLORS.mute}
              textTransform="uppercase"
              mB={8}
              style={styles.track}>
              Industry
            </Typography>
            <View style={styles.chips}>
              {industries.map(i => (
                <Chip
                  key={i}
                  label={i}
                  active={selectedIndustries.includes(i)}
                  onPress={() => toggle(selectedIndustries, setSelectedIndustries, i)}
                />
              ))}
            </View>
            <TextField
              label="Years of experience"
              placeholder="5"
              value={f.years}
              onChangeText={v => set('years', v)}
              keyboardType="number-pad"
            />
            <Typography
              fixed
              size={11}
              fFamily="interSemiBold600"
              color={COLORS.mute}
              textTransform="uppercase"
              mB={8}
              style={styles.track}>
              Professional role
            </Typography>
            <View style={styles.chips}>
              {professionalRoles.map(l => (
                <Chip key={l} label={l} active={roleType === l} onPress={() => setRoleType(l)} />
              ))}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Typography fixed size={13} color={COLORS.body} mB={16} LineHeight={20}>
              Optional — add your company, clinic, firm, school, or leave blank if you are a student
              or freelancer.
            </Typography>
            <TextField
              label="Company / organization"
              placeholder="Company, clinic, firm, school, or Freelance"
              value={f.company}
              onChangeText={v => set('company', v)}
            />
            <Typography
              fixed
              size={11}
              fFamily="interSemiBold600"
              color={COLORS.mute}
              textTransform="uppercase"
              mB={8}
              style={styles.track}>
              Organization size
            </Typography>
            <View style={styles.chips}>
              {['Just me', '1–10', '11–50', '51–200', '201–1k', '1k+'].map(s => (
                <Chip key={s} label={s} active={companySize === s} onPress={() => setCompanySize(s)} />
              ))}
            </View>
            <TextField label="Website" placeholder="https://" />
            <Pressable onPress={() => setStep(step + 1)} style={styles.skip}>
              <Typography
                fixed
                size={12}
                fFamily="interSemiBold600"
                color={COLORS.mute}
                textTransform="uppercase"
                style={styles.track}>
                Skip for now
              </Typography>
            </Pressable>
          </>
        )}

        {step === 3 && (
          <>
            <Typography fixed size={13} color={COLORS.body} mB={16} LineHeight={20}>
              Upload any documents that help verify your professional identity. Requirements vary by
              profession.
            </Typography>
            {DOCS.map(d => (
              <UploadTile
                key={d.key}
                label={d.label}
                required={d.req}
                done={!!docs[d.key]}
                onToggle={() => setDocs(x => ({ ...x, [d.key]: !x[d.key] }))}
              />
            ))}
          </>
        )}

        {step === 4 && (
          <>
            <TextField
              label="Professional bio"
              placeholder="A short summary of who you are and what you do — any profession welcome."
              value={f.bio}
              onChangeText={v => set('bio', v)}
              multiline
              maxLength={500}
            />
            <Typography fixed size={11} color={COLORS.mute} mB={16}>
              {(f.bio ?? '').length}/500
            </Typography>
            <Typography
              fixed
              size={11}
              fFamily="interSemiBold600"
              color={COLORS.mute}
              textTransform="uppercase"
              mB={8}
              style={styles.track}>
              Professional interests — select at least 2
            </Typography>
            <View style={styles.chips}>
              {interests.map(i => (
                <Chip
                  key={i}
                  label={i}
                  active={selectedInterests.includes(i)}
                  onPress={() => toggle(selectedInterests, setSelectedInterests, i)}
                />
              ))}
            </View>
          </>
        )}

        {step === 5 && (
          <>
            <Typography fixed size={14} color={COLORS.body} mB={16} LineHeight={20}>
              Tell us what you are looking for. We will tailor your matches for jobs, clients,
              partnerships, mentorship, and more.
            </Typography>
            <View style={styles.chips}>
              {goals.map(g => (
                <Chip
                  key={g}
                  label={g}
                  active={selectedGoals.includes(g)}
                  onPress={() => toggle(selectedGoals, setSelectedGoals, g)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={step === STEPS.length - 1 ? 'Submit for verification' : 'Continue'}
          disabled={!canContinue}
          onPress={() => {
            if (step === STEPS.length - 1) setSubmitted(true);
            else setStep(step + 1);
          }}
        />
      </View>
    </SafeAreaWrapper>
  );
};

export default VerifyScreen;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepKicker: {
    marginTop: 12,
  },
  flex: { flex: 1 },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  photoWrap: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  photoBtn: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(241,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  skip: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: { letterSpacing: 0.88 },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  success: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  checkSquare: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  successBody: {
    maxWidth: 320,
  },
  successBtns: {
    marginTop: 40,
    width: '100%',
    maxWidth: 280,
  },
});
