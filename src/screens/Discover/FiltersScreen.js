import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
//------------------
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button, TextField } from '../../components';
import { Chip, Icon, TopBar } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { useCustomQuery } from '../../query/useCustomQuery';
import { getProfileOptions } from '../../api/profileService';
import { useSubscriptionMe } from '../../hooks/useSubscriptionMe';

const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.section}>
      <Pressable onPress={() => setOpen(!open)} style={styles.sectionHead}>
        <Typography
          fixed
          size={13}
          fFamily="interSemiBold600"
          color={COLORS.foreground}
          textTransform="uppercase"
          style={styles.track}>
          {title}
        </Typography>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <Icon.ChevronDown size={16} color={COLORS.primary} />
        </View>
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
};

const FiltersScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const {
    isSubscribed,
  } = useSubscriptionMe();
  const initial = route?.params?.filters || {};
  const [industry, setIndustry] = useState(initial.industry || '');
  const [role, setRole] = useState(initial.professional_role || '');
  const [orgSize, setOrgSize] = useState(initial.organization_size || '');
  const [location, setLocation] = useState(initial.location || '');

  const { data: optionsRes } = useCustomQuery({
    queryKey: ['profileOptions'],
    queryFn: getProfileOptions,
  });

  const options = optionsRes?.options || {};
  const industries = options.industries || [];
  const roles = options.professional_roles || [];
  const sizes = options.organization_sizes || [];

  const activeCount = useMemo(
    () =>
      [industry, role, orgSize, location.trim()].filter(Boolean).length,
    [industry, role, orgSize, location],
  );

  const apply = async () => {
    const filters = {};
    if (industry) filters.industry = industry;
    if (role) filters.professional_role = role;
    if (orgSize) filters.organization_size = orgSize;
    if (location.trim()) filters.location = location.trim();

    if (!isSubscribed && Object.keys(filters).length) return;

    navigation.navigate('MainTabs', {
      screen: 'DiscoverTab',
      params: { filters },
    });
  };

  const reset = () => {
    setIndustry('');
    setRole('');
    setOrgSize('');
    setLocation('');
  };

  return (
    <SafeAreaWrapper keyboardAvoid edges={['top']} bgColor={COLORS.background}>
      <TopBar
        overline="The Directory"
        title="Search Filters"
        right={
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Icon.Close size={20} color={COLORS.foreground} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Typography fixed size={12} color={COLORS.mute} mB={16} LineHeight={18}>
          Text search is always free. Industry, role, size, and location are
          advanced filters (subscription / trial gated on the API).
        </Typography>
        {!isSubscribed && (
          <View style={styles.premiumNote}>
            <View style={styles.premiumNoteTitle}>
              <Icon.Lock size={14} color={COLORS.primary} />
              <Typography
                fixed
                size={11}
                fFamily="interSemiBold600"
                color={COLORS.primary}
                textTransform="uppercase"
                style={styles.track}>
                Premium filters
              </Typography>
            </View>
            <Typography fixed size={13} color={COLORS.body} mT={8} LineHeight={19}>
              Explore the available filters below. Subscribe when you are ready
              to apply them to Discover.
            </Typography>
          </View>
        )}

        <FilterSection title="Industry">
          {industries.length === 0 ? (
            <Typography fixed size={13} color={COLORS.mute}>
              No industry options from server yet.
            </Typography>
          ) : (
            <View style={styles.chips}>
              {industries.map(item => (
                <Chip
                  key={item.value}
                  label={item.label}
                  active={industry === item.value}
                  onPress={() =>
                    setIndustry(industry === item.value ? '' : item.value)
                  }
                />
              ))}
            </View>
          )}
        </FilterSection>

        <FilterSection title="Professional role" defaultOpen={false}>
          {roles.length === 0 ? (
            <Typography fixed size={13} color={COLORS.mute}>
              No role options from server yet.
            </Typography>
          ) : (
            <View style={styles.chips}>
              {roles.map(item => (
                <Chip
                  key={item.value}
                  label={item.label}
                  active={role === item.value}
                  onPress={() => setRole(role === item.value ? '' : item.value)}
                />
              ))}
            </View>
          )}
        </FilterSection>

        <FilterSection title="Organization size" defaultOpen={false}>
          {sizes.length === 0 ? (
            <Typography fixed size={13} color={COLORS.mute}>
              No size options from server yet.
            </Typography>
          ) : (
            <View style={styles.chips}>
              {sizes.map(item => (
                <Chip
                  key={item.value}
                  label={item.label}
                  active={orgSize === item.value}
                  onPress={() =>
                    setOrgSize(orgSize === item.value ? '' : item.value)
                  }
                />
              ))}
            </View>
          )}
        </FilterSection>

        <FilterSection title="Location (USA & Worldwide)" defaultOpen={true}>
          <TextField
            label="Enter your location"
            placeholder="e.g. New York, Los Angeles, Chicago, Texas, Florida"
            value={location}
            onChangeText={setLocation}
            autoCapitalize="words"
          />
          <Typography fixed size={12} color={COLORS.mute} mT={6}>
            Search members across any city or state in the USA.
          </Typography>
        </FilterSection>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.col}>
          <Button
            type="outline"
            label="Reset"
            textColor={COLORS.mute}
            onPress={reset}
          />
        </View>
        <View style={styles.col}>
          <Button
            label={
              !isSubscribed
                ? 'Unlock filters'
                : activeCount
                  ? `Apply ${activeCount} filter${activeCount > 1 ? 's' : ''}`
                  : 'Show results'
            }
            onPress={
              isSubscribed
                ? apply
                : () => navigation.navigate('SubscriptionScreen')
            }
          />
        </View>
      </View>
    </SafeAreaWrapper>
  );
};

export default FiltersScreen;

const styles = StyleSheet.create({
  premiumNote: {
    marginBottom: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primarySoft,
  },
  premiumNoteTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  section: { borderTopWidth: 1, borderTopColor: COLORS.border },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  sectionBody: { paddingBottom: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  track: { letterSpacing: 0.88 },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.surface,
  },
  col: { flex: 1 },
});
