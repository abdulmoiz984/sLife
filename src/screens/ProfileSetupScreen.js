import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
//------------------
import { SafeAreaWrapper, Typography } from '../atomComponents';
import {
  Button,
  TextField,
  RegisterProgressBar,
  ScreenOverlayLoader,
} from '../components';
import {
  Icon,
  Chip,
  Overline,
  UploadTile,
  EducationsEditor,
  ProfilePhotoSheet,
} from '../components/slife';
import { COLORS, RADIUS } from '../globalStyle/Theme';
import { useCustomQuery } from '../query/useCustomQuery';
import { useCustomMutation } from '../query/useCustomMutation';
import {
  getProfile,
  getProfileOptions,
  updateBasicInfo,
  updateProfessionalInfo,
  updateOrganization,
  updateVerificationDocuments,
  updateBioInterests,
  updateNetworkingGoals,
} from '../api/profileService';
import {
  mergeProfile,
  mergeProfileData,
  setProfile,
} from '../redux/slices/appSlice';
import {
  digitsOnly,
  formatBackendErrors,
  maskUsPhoneWithCode,
  showMessage,
} from '../utils';
import { pickUploadAsset, pickPdfDocument } from '../helpers/pickMedia';

const STEPS = [
  'Basic Information',
  'Professional Information',
  'Organization',
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

/**
 * Edit Profile — same Module B endpoints as onboarding VerifyScreen,
 * for users who already completed profile.
 */
const ProfileSetupScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const reduxUser = useSelector(state => state.app.user);
  const reduxProfile = useSelector(state => state.app.profile);

  const cachedBasic = reduxProfile?.basic_info || {};
  const cachedProfessional = reduxProfile?.professional_info || {};
  const cachedOrganization = reduxProfile?.organization || {};
  const cachedVerification = reduxProfile?.verification || {};
  const cachedBioInterests = reduxProfile?.bio_interests || {};

  const [step, setStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const formDirtyRef = useRef(false);

  const [fullName, setFullName] = useState(
    cachedBasic.full_name || reduxUser?.full_name || '',
  );
  const [phone, setPhone] = useState(
    digitsOnly(cachedBasic.phone_number || ''),
  );
  const [location, setLocation] = useState(cachedBasic.location || '');
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(
    cachedBasic.profile_photo_url || null,
  );
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);

  const [title, setTitle] = useState(
    cachedProfessional.professional_title || '',
  );
  const [industry, setIndustry] = useState(
    cachedProfessional.industry || '',
  );
  const [years, setYears] = useState(
    cachedProfessional.years_of_experience != null
      ? String(cachedProfessional.years_of_experience)
      : '',
  );
  const [role, setRole] = useState(
    cachedProfessional.professional_role || '',
  );

  const [company, setCompany] = useState(
    cachedOrganization.company_name || '',
  );
  const [orgSize, setOrgSize] = useState(
    cachedOrganization.organization_size || '',
  );
  const [website, setWebsite] = useState(cachedOrganization.website || '');

  const [linkedin, setLinkedin] = useState(
    cachedVerification.linkedin_or_portfolio_url || '',
  );
  const [docFiles, setDocFiles] = useState({});

  const [bio, setBio] = useState(cachedBioInterests.bio || '');
  const [selectedInterests, setSelectedInterests] = useState(
    (cachedBioInterests.interests || []).map(i =>
      typeof i === 'string' ? i : i.value,
    ),
  );
  const [selectedGoals, setSelectedGoals] = useState(
    (reduxProfile?.networking_goals || []).map(g =>
      typeof g === 'string' ? g : g.value,
    ),
  );

  const {
    data: optionsRes,
    isLoading: optionsLoading,
    isError: optionsError,
  } = useCustomQuery({
    queryKey: ['profileOptions'],
    queryFn: getProfileOptions,
  });

  const {
    data: profileRes,
    isLoading: profileLoading,
    isPlaceholderData: profileIsPlaceholder,
  } = useCustomQuery({
    queryKey: ['profile', 'me'],
    queryFn: getProfile,
    placeholderData: reduxProfile
      ? { success: true, profile: reduxProfile }
      : undefined,
    staleTime: 60_000,
  });

  const options = optionsRes?.options || emptyOptions;

  const applyProfile = useCallback(profile => {
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
  }, [dispatch, reduxUser?.full_name]);

  useEffect(() => {
    if (
      hydrated ||
      profileIsPlaceholder ||
      formDirtyRef.current ||
      !profileRes?.success ||
      !profileRes?.profile
    ) return;
    applyProfile(profileRes.profile);
    setHydrated(true);
  }, [profileRes, profileIsPlaceholder, hydrated, applyProfile]);

  const toggleValue = (arr, setArr, value) => {
    formDirtyRef.current = true;
    setArr(arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]);
  };

  const changeField = setter => value => {
    formDirtyRef.current = true;
    setter(value);
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
        return !!(fullName.trim() && phone.trim() && location.trim());
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

  const afterSave = async (response, nextStepIndex, { finish } = {}) => {
    if (response?.profile) {
      dispatch(mergeProfile(response.profile));
      queryClient.setQueryData(['profile', 'me'], current => ({
        ...(current || {}),
        success: true,
        profile: mergeProfileData(current?.profile, response.profile),
      }));
    }
    await queryClient.invalidateQueries({ queryKey: ['profile'] });

    showMessage({
      type: 'success',
      message: response?.message || 'Saved.',
    });

    if (finish) {
      navigation.goBack();
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
    setTimeout(async () => {
      const asset = await pickUploadAsset({ mediaType: 'photo' });
      if (asset) {
        formDirtyRef.current = true;
        setPhoto(asset);
        setPhotoUrl(asset.uri);
      }
    }, 250);
  };

  const removePhoto = () => {
    formDirtyRef.current = true;
    setPhoto(null);
    // Keep remote URL cleared only for newly picked local photo;
    // if user had server photo, clearing means don't re-upload — revert display to remote on next load.
    setPhotoUrl(null);
    closePhotoSheet();
  };

  const pickDoc = async docValue => {
    try {
      const asset = await pickPdfDocument();
      if (asset) {
        formDirtyRef.current = true;
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
    if (!optionsReadyForStep && step !== 0 && step !== 2 && step !== 3) {
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
        await afterSave(res, 1);
      } else if (step === 1) {
        const res = await saveProfessional({
          professional_title: title.trim(),
          industry,
          years_of_experience: Number(years),
          professional_role: role,
        });
        await afterSave(res, 2);
      } else if (step === 2) {
        const res = await saveOrganization({
          company_name: company.trim(),
          organization_size: orgSize || undefined,
          website: website.trim() || undefined,
        });
        await afterSave(res, 3);
      } else if (step === 3) {
        const body = {
          linkedin_or_portfolio_url: linkedin.trim(),
          ...docFiles,
        };
        const res = await saveVerification(body);
        await afterSave(res, 4);
      } else if (step === 4) {
        const res = await saveBio({
          bio: bio.trim(),
          interests: selectedInterests,
        });
        await afterSave(res, 5);
      } else if (step === 5) {
        const res = await saveGoals({
          networking_goals: selectedGoals,
        });
        await afterSave(res, 5, { finish: true });
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
      await afterSave(res, 3);
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const bootLoading = optionsLoading || profileLoading;

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
            Edit profile
          </Typography>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            disabled={saving}>
            <Typography
              fixed
              size={11}
              fFamily="interSemiBold600"
              color={COLORS.primary}
              textTransform="uppercase"
              style={styles.trackSmall}>
              Done
            </Typography>
          </Pressable>
        </View>
        <RegisterProgressBar step={step + 1} total={STEPS.length} />
        <Overline style={styles.kicker}>
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
          Updates sync to your live profile. Only fields supported by the API
          are editable here.
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
              step !== 2 &&
              !optionsReadyForStep)) && (
            <View style={styles.warnBox}>
              <Typography
                fixed
                size={13}
                color={COLORS.destructive}
                LineHeight={18}>
                Server returned empty profile options for this step. See
                docs/api-issues.md.
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
                      Profile photo
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
                value={fullName}
                onChangeText={changeField(setFullName)}
                placeholder="Your full name"
                isRequired
              />
              <TextField
                label="Phone"
                value={maskUsPhoneWithCode(phone)}
                onChangeText={text => {
                  formDirtyRef.current = true;
                  setPhone(digitsOnly(text));
                }}
                placeholder="+1 555-123-4567"
                keyboardType="phone-pad"
                isRequired
              />
              <TextField
                label="Location"
                value={location}
                onChangeText={changeField(setLocation)}
                placeholder="e.g. New York, NY or Los Angeles, CA"
                isRequired
              />
            </>
          )}

          {step === 1 && (
            <>
              <TextField
                label="Professional title"
                value={title}
                onChangeText={changeField(setTitle)}
                placeholder="e.g. Software Engineer"
                isRequired
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
                    onPress={() => {
                      formDirtyRef.current = true;
                      setIndustry(item.value);
                    }}
                  />
                ))}
              </View>
              <TextField
                label="Years of experience"
                value={years}
                onChangeText={changeField(setYears)}
                keyboardType="number-pad"
                placeholder="e.g. 5"
                isRequired
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
                    onPress={() => {
                      formDirtyRef.current = true;
                      setRole(item.value);
                    }}
                  />
                ))}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <TextField
                label="Company / organization"
                placeholder="Company, clinic, firm, school, or Freelance"
                value={company}
                onChangeText={changeField(setCompany)}
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
                    onPress={() => {
                      formDirtyRef.current = true;
                      setOrgSize(item.value);
                    }}
                  />
                ))}
              </View>
              <TextField
                label="Website"
                placeholder="https://"
                value={website}
                onChangeText={changeField(setWebsite)}
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
                  style={styles.trackSmall}>
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
              <TextField
                label="LinkedIn or portfolio URL"
                placeholder="https://linkedin.com/in/you"
                value={linkedin}
                onChangeText={changeField(setLinkedin)}
                autoCapitalize="none"
                keyboardType="url"
                isRequired
              />
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
                onChangeText={changeField(setBio)}
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
              <Typography
                fixed
                size={14}
                color={COLORS.body}
                mB={16}
                LineHeight={20}>
                Tell us what you are looking for. We will tailor your matches.
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
          label={step === STEPS.length - 1 ? 'Save profile' : 'Continue'}
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
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnBox: {
    borderWidth: 1,
    borderColor: COLORS.destructive,
    backgroundColor: 'rgba(229,72,77,0.08)',
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  eduBlock: {
    marginTop: 16,
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
