import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaWrapper, Typography } from '../atomComponents';
import { Button, TextField, RegisterProgressBar } from '../components';
import { Icon, Chip, Overline, UploadTile } from '../components/slife';
import { COLORS } from '../globalStyle/Theme';
import {
  availabilityOptions,
  contactMethods,
  goals,
  industries,
  interests,
  lookingForOptions,
  people,
  professionalRoles,
} from '../constants/mockData';

const STEPS = [
  'Basic Information',
  'Professional Information',
  'Skills & Expertise',
  'Portfolio & Documents',
  'Contact & Online Presence',
  'Business Information',
  'Preferences & Goals',
];

const ProfileSetupScreen = ({ navigation }) => {
  const me = people[1];
  const [step, setStep] = useState(0);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    name: me.name,
    headline: me.headline,
    bio: me.bio,
    shortIntro: me.shortIntro ?? '',
    videoIntro: !!me.videoIntro,
    coverPhoto: !!me.cover,
    profilePhoto: !!me.avatar,
    currentPosition: me.currentPosition,
    company: me.company,
    industry: me.industry,
    yearsExperience: String(me.yearsExperience ?? ''),
    roleType: '',
    experienceRole: me.experience?.[0]?.role ?? '',
    experienceCompany: me.experience?.[0]?.company ?? '',
    experiencePeriod: me.experience?.[0]?.period ?? '',
    educationSchool: me.education?.[0]?.school ?? '',
    educationDegree: me.education?.[0]?.degree ?? '',
    educationField: me.education?.[0]?.field ?? '',
    educationPeriod: me.education?.[0]?.period ?? '',
    certification: me.certifications?.[0]?.name ?? '',
    license: me.licenses?.[0]?.name ?? '',
    highlight: me.highlights?.[0] ?? '',
    award: me.awards?.[0] ?? '',
    skills: me.skills ?? [],
    specializations: (me.specializations ?? []).join(', '),
    interests: me.interests ?? [],
    networkingGoals: me.networkingGoals ?? [],
    languages: (me.languages ?? []).join(', '),
    portfolioLabel: me.portfolioLinks?.[0]?.label ?? '',
    portfolioUrl: me.portfolioLinks?.[0]?.url ?? '',
    projectTitle: me.projects?.[0]?.title ?? '',
    projectDescription: me.projects?.[0]?.description ?? '',
    resumeUploaded: me.documents?.some(d => d.category === 'resume') ?? false,
    certificateUploaded: me.documents?.some(d => d.category === 'certificate') ?? false,
    businessDocUploaded: me.documents?.some(d => d.category === 'business') ?? false,
    educationDocUploaded: me.documents?.some(d => d.category === 'education') ?? false,
    website: me.website ?? '',
    linkedin: me.linkedin ?? '',
    facebook: '',
    instagram: me.instagram ?? '',
    youtube: '',
    businessName: me.business?.name ?? '',
    businessCategory: me.business?.category ?? '',
    businessAddress: me.business?.address ?? '',
    businessPhone: me.business?.phone ?? '',
    businessEmail: me.business?.email ?? '',
    availability: me.availability ?? '',
    lookingFor: me.lookingFor ?? [],
    preferredContact: me.preferredContact ?? '',
    city: me.city ?? '',
    state: me.state ?? '',
    country: me.country ?? '',
    timezone: me.timezone ?? '',
  });

  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));
  const toggleIn = (k, v) => {
    const arr = form[k] || [];
    set(k, arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };
  const addSkill = () => {
    const value = skillInput.trim();
    if (!value || form.skills.includes(value)) return;
    set('skills', [...form.skills, value]);
    setSkillInput('');
  };

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return !!(form.name && form.headline);
      case 1:
        return !!(form.currentPosition && form.industry);
      case 2:
        return form.skills.length > 0;
      default:
        return true;
    }
  }, [step, form]);

  const finish = () => navigation.replace('MainTabs', { screen: 'ProfileTab' });

  return (
    <SafeAreaWrapper keyboardAvoid bgColor={COLORS.background}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => (step > 0 ? setStep(step - 1) : navigation.goBack())}
            hitSlop={8}
            style={styles.iconBtn}>
            {step > 0 ? (
              <Icon.ArrowLeft size={20} color={COLORS.foreground} />
            ) : (
              <Icon.Close size={20} color={COLORS.foreground} />
            )}
          </Pressable>
          <Typography
            fixed
            size={12}
            fFamily="interSemiBold600"
            color={COLORS.mute}
            textTransform="uppercase"
            style={styles.track}>
            Profile setup
          </Typography>
          <Pressable onPress={finish} hitSlop={8}>
            <Typography
              fixed
              size={11}
              fFamily="interSemiBold600"
              color={COLORS.primary}
              textTransform="uppercase"
              style={styles.trackSmall}>
              Save
            </Typography>
          </Pressable>
        </View>
        <RegisterProgressBar step={step + 1} total={STEPS.length} />
        <Overline style={styles.kicker}>
          Step {step + 1} of {STEPS.length}
        </Overline>
        <Typography fixed size={22} fFamily="spaceGroteskBold700" color={COLORS.foreground} mT={4}>
          {STEPS[step]}
        </Typography>
        <Typography fixed size={13} color={COLORS.body} mT={8}>
          Built for every professional — developers, designers, doctors, lawyers, students,
          freelancers, and more.
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
              <Pressable
                onPress={() => set('profilePhoto', !form.profilePhoto)}
                style={styles.photoBtn}>
                <Icon.Camera size={24} color={COLORS.primary} />
                <Typography
                  fixed
                  size={10}
                  fFamily="interSemiBold600"
                  color={COLORS.primary}
                  textTransform="uppercase"
                  textAlign="center"
                  mT={4}
                  style={styles.track}>
                  {form.profilePhoto ? 'Photo added' : 'Profile photo'}
                </Typography>
              </Pressable>
            </View>
            <UploadTile
              label="Cover photo / banner"
              done={form.coverPhoto}
              onToggle={() => set('coverPhoto', !form.coverPhoto)}
            />
            <TextField label="Full name" value={form.name} onChangeText={v => set('name', v)} placeholder="Your full name" />
            <TextField
              label="Professional headline / title"
              value={form.headline}
              onChangeText={v => set('headline', v)}
              placeholder="e.g. Web Developer · React & Node.js"
            />
            <TextField
              label="Professional biography"
              value={form.bio}
              onChangeText={v => set('bio', v)}
              placeholder="Share your background, strengths, and what you do professionally."
              multiline
              maxLength={800}
            />
            <TextField
              label="Short introduction"
              value={form.shortIntro}
              onChangeText={v => set('shortIntro', v)}
              placeholder="A one-line intro shown under your name"
              multiline
            />
            <UploadTile
              label="Video introduction"
              done={form.videoIntro}
              onToggle={() => set('videoIntro', !form.videoIntro)}
            />
          </>
        )}

        {step === 1 && (
          <>
            <TextField
              label="Current position"
              value={form.currentPosition}
              onChangeText={v => set('currentPosition', v)}
              placeholder="e.g. Software Engineer, Pharmacist, Student"
            />
            <TextField
              label="Company / organization"
              value={form.company}
              onChangeText={v => set('company', v)}
              placeholder="Company, clinic, firm, school, or Freelance"
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
                  active={form.industry === i}
                  onPress={() => set('industry', i)}
                />
              ))}
            </View>
            <TextField
              label="Years of experience"
              value={form.yearsExperience}
              onChangeText={v => set('yearsExperience', v)}
              keyboardType="number-pad"
              placeholder="e.g. 5"
            />
            <Typography
              fixed
              size={11}
              fFamily="interSemiBold600"
              color={COLORS.mute}
              textTransform="uppercase"
              mB={8}
              style={styles.track}>
              Professional role type
            </Typography>
            <View style={styles.chips}>
              {professionalRoles.map(r => (
                <Chip
                  key={r}
                  label={r}
                  active={form.roleType === r}
                  onPress={() => set('roleType', r)}
                />
              ))}
            </View>

            <View style={styles.block}>
              <Typography
                fixed
                size={12}
                fFamily="interSemiBold600"
                color={COLORS.mute}
                textTransform="uppercase"
                mB={16}
                style={styles.track}>
                Professional experience (add entries)
              </Typography>
              <TextField
                label="Role / title"
                value={form.experienceRole}
                onChangeText={v => set('experienceRole', v)}
                placeholder="Role title"
              />
              <TextField
                label="Company / organization"
                value={form.experienceCompany}
                onChangeText={v => set('experienceCompany', v)}
                placeholder="Organization"
              />
              <TextField
                label="Period"
                value={form.experiencePeriod}
                onChangeText={v => set('experiencePeriod', v)}
                placeholder="2021 — Present"
              />
            </View>

            <View style={styles.block}>
              <Typography
                fixed
                size={12}
                fFamily="interSemiBold600"
                color={COLORS.mute}
                textTransform="uppercase"
                mB={16}
                style={styles.track}>
                Education (add entries)
              </Typography>
              <TextField
                label="School / university"
                value={form.educationSchool}
                onChangeText={v => set('educationSchool', v)}
              />
              <TextField
                label="Degree"
                value={form.educationDegree}
                onChangeText={v => set('educationDegree', v)}
                placeholder="B.S., M.D., Diploma…"
              />
              <TextField
                label="Field of study"
                value={form.educationField}
                onChangeText={v => set('educationField', v)}
              />
              <TextField
                label="Period"
                value={form.educationPeriod}
                onChangeText={v => set('educationPeriod', v)}
                placeholder="2018 — 2022"
              />
            </View>

            <TextField
              label="Certification"
              value={form.certification}
              onChangeText={v => set('certification', v)}
              placeholder="Add a certification"
            />
            <TextField
              label="License (optional)"
              value={form.license}
              onChangeText={v => set('license', v)}
              placeholder="Professional license if applicable"
            />
            <TextField
              label="Career highlight / achievement"
              value={form.highlight}
              onChangeText={v => set('highlight', v)}
            />
            <TextField
              label="Award / recognition"
              value={form.award}
              onChangeText={v => set('award', v)}
            />
          </>
        )}

        {step === 2 && (
          <>
            <TextField
              label="Skills & expertise"
              value={skillInput}
              onChangeText={setSkillInput}
              placeholder="Add a skill and press Enter"
              onSubmitEditing={addSkill}
              mB={8}
            />
            <Button label="Add" onPress={addSkill} mb={12} />
            <View style={styles.chips}>
              {form.skills.map(s => (
                <Chip key={s} label={s} active onPress={() => toggleIn('skills', s)} />
              ))}
            </View>
            <TextField
              label="Areas of specialization"
              value={form.specializations}
              onChangeText={v => set('specializations', v)}
              placeholder="Comma-separated, e.g. Mobile UX, Tax Law"
            />
            <Typography fixed size={11} fFamily="interSemiBold600" color={COLORS.mute} textTransform="uppercase" mB={8} style={styles.track}>
              Professional interests
            </Typography>
            <View style={styles.chips}>
              {interests.map(i => (
                <Chip key={i} label={i} active={form.interests.includes(i)} onPress={() => toggleIn('interests', i)} />
              ))}
            </View>
            <Typography fixed size={11} fFamily="interSemiBold600" color={COLORS.mute} textTransform="uppercase" mB={8} style={styles.track}>
              Networking goals
            </Typography>
            <View style={styles.chips}>
              {goals.map(g => (
                <Chip key={g} label={g} active={form.networkingGoals.includes(g)} onPress={() => toggleIn('networkingGoals', g)} />
              ))}
            </View>
            <TextField label="Languages" value={form.languages} onChangeText={v => set('languages', v)} />
          </>
        )}

        {step === 3 && (
          <>
            <TextField label="Portfolio link label" value={form.portfolioLabel} onChangeText={v => set('portfolioLabel', v)} placeholder="GitHub, Behance, Portfolio…" />
            <TextField label="Portfolio URL" value={form.portfolioUrl} onChangeText={v => set('portfolioUrl', v)} placeholder="https://" />
            <TextField label="Featured project title" value={form.projectTitle} onChangeText={v => set('projectTitle', v)} />
            <TextField label="Project showcase description" value={form.projectDescription} onChangeText={v => set('projectDescription', v)} multiline />
            <UploadTile label="Resume / CV" done={form.resumeUploaded} onToggle={() => set('resumeUploaded', !form.resumeUploaded)} />
            <UploadTile label="Certificates" done={form.certificateUploaded} onToggle={() => set('certificateUploaded', !form.certificateUploaded)} />
            <UploadTile label="Business documents" done={form.businessDocUploaded} onToggle={() => set('businessDocUploaded', !form.businessDocUploaded)} />
            <UploadTile label="Educational documents" done={form.educationDocUploaded} onToggle={() => set('educationDocUploaded', !form.educationDocUploaded)} />
          </>
        )}

        {step === 4 && (
          <>
            <TextField label="Website" value={form.website} onChangeText={v => set('website', v)} placeholder="https://" />
            <TextField label="LinkedIn profile" value={form.linkedin} onChangeText={v => set('linkedin', v)} />
            <TextField label="Facebook profile" value={form.facebook} onChangeText={v => set('facebook', v)} />
            <TextField label="Instagram profile" value={form.instagram} onChangeText={v => set('instagram', v)} />
            <TextField label="YouTube channel" value={form.youtube} onChangeText={v => set('youtube', v)} />
          </>
        )}

        {step === 5 && (
          <>
            <Typography fixed size={13} color={COLORS.body} mB={16}>
              Optional — add business details if you own or represent an organization.
            </Typography>
            <TextField label="Business name" value={form.businessName} onChangeText={v => set('businessName', v)} />
            <TextField label="Business category" value={form.businessCategory} onChangeText={v => set('businessCategory', v)} />
            <TextField label="Business address" value={form.businessAddress} onChangeText={v => set('businessAddress', v)} />
            <TextField label="Business phone" value={form.businessPhone} onChangeText={v => set('businessPhone', v)} />
            <TextField label="Business email" value={form.businessEmail} onChangeText={v => set('businessEmail', v)} keyboardType="email-address" />
            <Pressable onPress={() => setStep(step + 1)} style={styles.skip}>
              <Typography fixed size={12} fFamily="interSemiBold600" color={COLORS.mute} textTransform="uppercase" style={styles.trackSmall}>
                Skip for now
              </Typography>
            </Pressable>
          </>
        )}

        {step === 6 && (
          <>
            <Typography fixed size={11} fFamily="interSemiBold600" color={COLORS.mute} textTransform="uppercase" mB={8} style={styles.track}>
              Availability status
            </Typography>
            <View style={styles.chips}>
              {availabilityOptions.map(o => (
                <Chip key={o.value} label={o.label} active={form.availability === o.value} onPress={() => set('availability', o.value)} />
              ))}
            </View>
            <Typography fixed size={11} fFamily="interSemiBold600" color={COLORS.mute} textTransform="uppercase" mB={8} style={styles.track}>
              Looking for
            </Typography>
            <View style={styles.chips}>
              {lookingForOptions.map(o => (
                <Chip key={o} label={o} active={form.lookingFor.includes(o)} onPress={() => toggleIn('lookingFor', o)} />
              ))}
            </View>
            <Typography fixed size={11} fFamily="interSemiBold600" color={COLORS.mute} textTransform="uppercase" mB={8} style={styles.track}>
              Preferred contact method
            </Typography>
            <View style={styles.chips}>
              {contactMethods.map(m => (
                <Chip key={m} label={m} active={form.preferredContact === m} onPress={() => set('preferredContact', m)} />
              ))}
            </View>
            <TextField label="City" value={form.city} onChangeText={v => set('city', v)} />
            <TextField label="State / region" value={form.state} onChangeText={v => set('state', v)} />
            <TextField label="Country" value={form.country} onChangeText={v => set('country', v)} />
            <TextField label="Time zone" value={form.timezone} onChangeText={v => set('timezone', v)} />
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={step === STEPS.length - 1 ? 'Save profile' : 'Continue'}
          disabled={!canContinue}
          onPress={() => {
            if (step === STEPS.length - 1) finish();
            else setStep(step + 1);
          }}
        />
      </View>
    </SafeAreaWrapper>
  );
};

export default ProfileSetupScreen;

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
  kicker: { marginTop: 12 },
  flex: { flex: 1 },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  photoWrap: { alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
  photoBtn: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(241,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  block: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  skip: { height: 44, alignItems: 'center', justifyContent: 'center' },
  track: { letterSpacing: 0.88 },
  trackSmall: { letterSpacing: 0.66 },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
});
