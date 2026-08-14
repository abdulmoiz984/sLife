import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
//------------------
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import {
  Button,
  TextField,
  AppLogo,
  RegisterProgressBar,
  ScreenOverlayLoader,
} from '../../components';
import {
  Icon,
  Chip,
  Overline,
  UploadTile,
  EducationsEditor,
  ProfilePhotoSheet,
} from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { useCustomQuery } from '../../query/useCustomQuery';
import { useCustomMutation } from '../../query/useCustomMutation';
import {
  getProfile,
  getProfileOptions,
  updateBasicInfo,
  updateProfessionalInfo,
  updateOrganization,
  updateVerificationDocuments,
  updateBioInterests,
  updateNetworkingGoals,
} from '../../api/profileService';
import { setProfile, setUser } from '../../redux/slices/appSlice';
import {
  digitsOnly,
  formatBackendErrors,
  maskUsPhoneWithCode,
  showMessage,
} from '../../utils';
import { pickUploadAsset, pickPdfDocument } from '../../helpers/pickMedia';
import { getMe } from '../../api/authService';

const STEPS = [
  'Basic Information',
  'Professional Information',
  'Organization (Optional)',
  'Verification Documents',
  'Bio & Interests',
  'Networking Goals',
];

const emptyOptions = {
  industries: [],
  professional_roles: [],
  organization_sizes: [],
  interests: [],
  networking_goals: [],
  verification_document_types: [],
};

const VerifyScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const reduxUser = useSelector(state => state.app.user);

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(reduxUser?.full_name || '');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);

  const [title, setTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [years, setYears] = useState('');
  const [role, setRole] = useState('');

  const [company, setCompany] = useState('');
  const [orgSize, setOrgSize] = useState('');
  const [website, setWebsite] = useState('');

  const [linkedin, setLinkedin] = useState('');
  const [docFiles, setDocFiles] = useState({});

  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);

  const {
    data: optionsRes,
    isLoading: optionsLoading,
    isError: optionsError,
  } = useCustomQuery({
    queryKey: ['profileOptions'],
    queryFn: getProfileOptions,
  });

  const { data: profileRes, isLoading: profileLoading } = useCustomQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const options = optionsRes?.options || emptyOptions;

  const applyProfile = profile => {
    if (!profile) return;
    dispatch(setProfile(profile));

    const b = profile.basic_info || {};
    setFullName(b.full_name || reduxUser?.full_name || '');
    setPhone(digitsOnly(b.phone_number || ''));
    setLocation(b.location || '');
    setPhotoUrl(b.profile_photo_url || null);

    const p = profile.professional_info || {};
    setTitle(p.professional_title || '');
    setIndustry(p.industry || '');
    setYears(
      p.years_of_experience != null ? String(p.years_of_experience) : '',
    );
    setRole(p.professional_role || '');

    const o = profile.organization || {};
    setCompany(o.company_name || '');
    setOrgSize(o.organization_size || '');
    setWebsite(o.website || '');

    const v = profile.verification || {};
    setLinkedin(v.linkedin_or_portfolio_url || '');

    const bi = profile.bio_interests || {};
    setBio(bi.bio || '');
    setSelectedInterests(
      (bi.interests || []).map(i => (typeof i === 'string' ? i : i.value)),
    );
    setSelectedGoals(
      (profile.networking_goals || []).map(g =>
        typeof g === 'string' ? g : g.value,
      ),
    );

    const nextStep = Math.min(Number(profile.onboarding_step) || 0, 5);
    if (profile.profile_completed || profile.verification_submitted_at) {
      setSubmitted(true);
    } else {
      setStep(nextStep);
    }
  };

  useEffect(() => {
    if (hydrated || !profileRes?.success || !profileRes?.profile) return;
    applyProfile(profileRes.profile);
    setHydrated(true);
  }, [profileRes, hydrated]);

  const toggleValue = (arr, setArr, value) => {
    setArr(arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]);
  };

  const optionsReadyForStep = useMemo(() => {
    switch (step) {
      case 1:
        return (
          options.industries.length > 0 &&
          options.professional_roles.length > 0
        );
      case 2:
        return true;
      case 4:
        return options.interests.length > 0;
      case 5:
        return options.networking_goals.length > 0;
      default:
        return true;
    }
  }, [step, options]);

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return !!(
          fullName.trim() &&
          digitsOnly(phone).length === 10 &&
          location.trim()
        );
      case 1:
        return !!(
          title.trim() &&
          industry &&
          years !== '' &&
          !Number.isNaN(Number(years)) &&
          role
        );
      case 2:
        return true;
      case 3:
        return !!linkedin.trim();
      case 4:
        return selectedInterests.length >= 2;
      case 5:
        return selectedGoals.length >= 1;
      default:
        return false;
    }
  }, [
    step,
    fullName,
    phone,
    location,
    title,
    industry,
    years,
    role,
    linkedin,
    selectedInterests,
    selectedGoals,
  ]);

  const handleApiError = err => {
    const response = err?.response;
    const parsed = formatBackendErrors(response?.data?.errors);
    const firstFieldError = Object.values(parsed)[0];
    showMessage({
      type: 'danger',
      message:
        firstFieldError ||
        response?.data?.message ||
        'Could not save this step. Please try again.',
    });
  };

  const afterStepSuccess = async (response, nextStepIndex, { finish } = {}) => {
    if (response?.profile) {
      dispatch(setProfile(response.profile));
    }
    showMessage({
      type: 'success',
      message: response?.message || 'Saved.',
    });

    if (finish) {
      try {
        const me = await getMe();
        if (me?.user) dispatch(setUser(me.user));
      } catch (_) {
        // non-blocking
      }
      setSubmitted(true);
      return;
    }

    setStep(nextStepIndex);
  };

  const { mutateAsync: saveBasic } = useCustomMutation({
    mutationFn: updateBasicInfo,
  });
  const { mutateAsync: saveProfessional } = useCustomMutation({
    mutationFn: updateProfessionalInfo,
  });
  const { mutateAsync: saveOrganization } = useCustomMutation({
    mutationFn: updateOrganization,
  });
  const { mutateAsync: saveVerification } = useCustomMutation({
    mutationFn: updateVerificationDocuments,
  });
  const { mutateAsync: saveBio } = useCustomMutation({
    mutationFn: updateBioInterests,
  });
  const { mutateAsync: saveGoals } = useCustomMutation({
    mutationFn: updateNetworkingGoals,
  });

  const openPhotoSheet = () => setPhotoSheetVisible(true);
  const closePhotoSheet = () => setPhotoSheetVisible(false);

  const pickPhoto = () => {
    closePhotoSheet();
    // Wait for sheet dismiss so the system picker presents cleanly (ClayMaster)
    setTimeout(async () => {
      const asset = await pickUploadAsset({ mediaType: 'photo' });
      if (asset) {
        setPhoto(asset);
        setPhotoUrl(asset.uri);
      }
    }, 250);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoUrl(null);
    closePhotoSheet();
  };

  const pickDoc = async docValue => {
    try {
      const asset = await pickPdfDocument();
      if (asset) {
        setDocFiles(prev => ({ ...prev, [docValue]: asset }));
      }
    } catch (_) {
      showMessage({
        type: 'danger',
        message: 'Could not open the PDF picker. Please try again.',
      });
    }
  };

  const submitStep = async () => {
    if (saving) return;
    if (!optionsReadyForStep) {
      showMessage({
        type: 'danger',
        message:
          'Profile options are not available from the server yet. Please try again later.',
      });
      return;
    }

    setSaving(true);
    try {
      if (step === 0) {
        const body = {
          full_name: fullName.trim(),
          phone_number: maskUsPhoneWithCode(phone).trim(),
          location: location.trim(),
        };
        if (photo) body.profile_photo = photo;
        const res = await saveBasic(body);
        await afterStepSuccess(res, 1);
      } else if (step === 1) {
        const res = await saveProfessional({
          professional_title: title.trim(),
          industry,
          years_of_experience: Number(years),
          professional_role: role,
        });
        await afterStepSuccess(res, 2);
      } else if (step === 2) {
        const res = await saveOrganization({
          company_name: company.trim(),
          organization_size: orgSize || undefined,
          website: website.trim() || undefined,
        });
        await afterStepSuccess(res, 3);
      } else if (step === 3) {
        const body = {
          linkedin_or_portfolio_url: linkedin.trim(),
          ...docFiles,
        };
        const res = await saveVerification(body);
        await afterStepSuccess(res, 4);
      } else if (step === 4) {
        const res = await saveBio({
          bio: bio.trim(),
          interests: selectedInterests,
        });
        await afterStepSuccess(res, 5);
      } else if (step === 5) {
        const res = await saveGoals({
          networking_goals: selectedGoals,
          submit_for_verification: true,
        });
        await afterStepSuccess(res, 5, { finish: true });
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const skipOrganization = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await saveOrganization({});
      await afterStepSuccess(res, 3);
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const bootLoading = optionsLoading || profileLoading;

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
            Our verification team typically completes review within 24–48 hours.
            You will be notified as soon as your membership is approved.
          </Typography>
          <View style={styles.successBtns}>
            <Button
              label="Add education"
              onPress={() => navigation.navigate('EducationsScreen')}
            />
            <Button
              type="secondary"
              label="Complete your profile"
              onPress={() => navigation.replace('ProfileSetupScreen')}
              mt={12}
            />
            <Button
              type="outline"
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
        <Typography
          fixed
          size={22}
          fFamily="spaceGroteskBold700"
          color={COLORS.foreground}
          mT={4}>
          {STEPS[step]}
        </Typography>
        <Typography fixed size={13} color={COLORS.body} mT={8}>
          For every professional — developers, designers, doctors, lawyers,
          students, freelancers, and more.
        </Typography>
      </View>

      {bootLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={COLORS.primary} />
          <Typography fixed size={13} color={COLORS.body} mT={12}>
            Loading profile…
          </Typography>
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {(optionsError ||
            (step !== 0 &&
              step !== 3 &&
              !optionsReadyForStep &&
              step !== 2)) && (
            <View style={styles.warnBox}>
              <Typography fixed size={13} color={COLORS.destructive} LineHeight={18}>
                Server returned empty profile options for this step. Dropdowns
                cannot be filled until the backend seeds industries, roles,
                interests, and goals. See docs/api-issues.md.
              </Typography>
            </View>
          )}

          {step === 0 && (
            <>
              <Pressable onPress={openPhotoSheet} style={styles.photoWrap}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.photoImg} />
                ) : (
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
                )}
                {!!photoUrl && (
                  <View style={styles.cameraBadge} pointerEvents="none">
                    <Icon.Camera size={14} color={COLORS.primary} />
                  </View>
                )}
              </Pressable>
              {!!photoUrl && (
                <Pressable onPress={openPhotoSheet} style={styles.changePhoto}>
                  <Typography
                    fixed
                    size={12}
                    fFamily="interSemiBold600"
                    color={COLORS.primary}
                    textAlign="center">
                    Change photo
                  </Typography>
                </Pressable>
              )}
              <TextField
                label="Full name"
                placeholder="Jordan Everly"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
              <TextField
                label="Phone"
                placeholder="+1 555-123-4567"
                value={phone ? maskUsPhoneWithCode(phone) : ''}
                onChangeText={text => {
                  // Once typing starts, show +1 live; store only 10 local digits
                  const cleaned = text.replace(/^\+?1\s*/, '');
                  setPhone(digitsOnly(cleaned));
                }}
                keyboardType="phone-pad"
                maxLength={15}
              />
              <TextField
                label="Location"
                placeholder="City, State, Country"
                value={location}
                onChangeText={setLocation}
                autoCapitalize="words"
              />
            </>
          )}

          {step === 1 && (
            <>
              <TextField
                label="Professional title / headline"
                placeholder="e.g. Web Developer, UI/UX Designer, Physician"
                value={title}
                onChangeText={setTitle}
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
                {options.industries.map(item => (
                  <Chip
                    key={item.value}
                    label={item.label}
                    active={industry === item.value}
                    onPress={() => setIndustry(item.value)}
                  />
                ))}
              </View>
              <TextField
                label="Years of experience"
                placeholder="5"
                value={years}
                onChangeText={setYears}
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
                {options.professional_roles.map(item => (
                  <Chip
                    key={item.value}
                    label={item.label}
                    active={role === item.value}
                    onPress={() => setRole(item.value)}
                  />
                ))}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Typography fixed size={13} color={COLORS.body} mB={16} LineHeight={20}>
                Optional — add your company, clinic, firm, school, or leave blank
                if you are a student or freelancer.
              </Typography>
              <TextField
                label="Company / organization"
                placeholder="Company, clinic, firm, school, or Freelance"
                value={company}
                onChangeText={setCompany}
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
                {options.organization_sizes.map(item => (
                  <Chip
                    key={item.value}
                    label={item.label}
                    active={orgSize === item.value}
                    onPress={() => setOrgSize(item.value)}
                  />
                ))}
              </View>
              <TextField
                label="Website"
                placeholder="https://"
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Pressable onPress={skipOrganization} style={styles.skip}>
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

              <View style={styles.eduBlock}>
                <EducationsEditor compact />
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Typography fixed size={13} color={COLORS.body} mB={16} LineHeight={20}>
                Add a LinkedIn or portfolio URL. Optional documents help verify
                your professional identity.
              </Typography>
              <TextField
                label="LinkedIn or portfolio URL"
                placeholder="https://linkedin.com/in/you"
                value={linkedin}
                onChangeText={setLinkedin}
                autoCapitalize="none"
                keyboardType="url"
                isRequired
              />
              {/* Temporarily hidden — Professional License / Educational Credential / Government ID
              {(options.verification_document_types.length
                ? options.verification_document_types
                : [
                    {
                      value: 'professional_license',
                      label: 'Professional License',
                    },
                    {
                      value: 'educational_credential',
                      label: 'Educational Credential',
                    },
                    { value: 'government_id', label: 'Government ID' },
                    {
                      value: 'employee_reference_letter',
                      label: 'Employee Reference Letter',
                    },
                  ]
              ).map(d => (
                <UploadTile
                  key={d.value}
                  label={d.label}
                  required={false}
                  done={!!docFiles[d.value]}
                  fileName={docFiles[d.value]?.fileName}
                  onPress={() => pickDoc(d.value)}
                />
              ))}
              */}
              <UploadTile
                label="Employee Reference Letter"
                required={false}
                subtitle="Tap to upload PDF"
                done={!!docFiles.employee_reference_letter}
                fileName={docFiles.employee_reference_letter?.fileName}
                onPress={() => pickDoc('employee_reference_letter')}
              />
            </>
          )}

          {step === 4 && (
            <>
              <TextField
                label="Professional bio"
                placeholder="A short summary of who you are and what you do."
                value={bio}
                onChangeText={setBio}
                multiline
                maxLength={500}
              />
              <Typography fixed size={11} color={COLORS.mute} mB={16}>
                {(bio ?? '').length}/500
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
                {options.interests.map(item => (
                  <Chip
                    key={item.value}
                    label={item.label}
                    active={selectedInterests.includes(item.value)}
                    onPress={() =>
                      toggleValue(
                        selectedInterests,
                        setSelectedInterests,
                        item.value,
                      )
                    }
                  />
                ))}
              </View>
            </>
          )}

          {step === 5 && (
            <>
              <Typography fixed size={14} color={COLORS.body} mB={16} LineHeight={20}>
                Tell us what you are looking for. We will tailor your matches for
                jobs, clients, partnerships, mentorship, and more.
              </Typography>
              <View style={styles.chips}>
                {options.networking_goals.map(item => (
                  <Chip
                    key={item.value}
                    label={item.label}
                    active={selectedGoals.includes(item.value)}
                    onPress={() =>
                      toggleValue(selectedGoals, setSelectedGoals, item.value)
                    }
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Button
          label={
            step === STEPS.length - 1 ? 'Submit for verification' : 'Continue'
          }
          disabled={!canContinue || bootLoading || !optionsReadyForStep || saving}
          onPress={submitStep}
        />
      </View>
      <ProfilePhotoSheet
        visible={photoSheetVisible}
        onClose={closePhotoSheet}
        onChooseGallery={pickPhoto}
        onRemove={removePhoto}
        canRemove={!!photo || !!photoUrl}
      />
      <ScreenOverlayLoader visible={saving || bootLoading} />
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
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnBox: {
    backgroundColor: 'rgba(229,72,77,0.12)',
    borderWidth: 1,
    borderColor: COLORS.destructive,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
  },
  photoWrap: {
    alignSelf: 'center',
    marginBottom: 8,
    marginTop: 8,
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
  photoImg: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhoto: {
    marginBottom: 16,
    paddingVertical: 4,
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
  eduBlock: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
