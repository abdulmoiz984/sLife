import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
//------------------
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button, TextField } from '../../components';
import { Chip, Icon } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { useCustomQuery } from '../../query/useCustomQuery';
import { getProfileOptions } from '../../api/profileService';
import { showMessage } from '../../utils';

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

  const apply = () => {
    const filters = {};
    if (industry) filters.industry = industry;
    if (role) filters.professional_role = role;
    if (orgSize) filters.organization_size = orgSize;
    if (location.trim()) filters.location = location.trim();

    if (Object.keys(filters).length) {
      showMessage({
        type: 'default',
        message:
          'Advanced filters require subscription access. The server may reject them with 422.',
      });
    }

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
    <SafeAreaWrapper edges={['top', 'bottom']} bgColor={COLORS.surface}>
      <View style={styles.handleWrap}>
        <View style={styles.handle} />
      </View>
      <View style={styles.top}>
        <Typography
          fixed
          size={18}
          fFamily="spaceGroteskBold700"
          color={COLORS.foreground}>
          Filters
        </Typography>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon.Close size={20} color={COLORS.foreground} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}>
        <Typography fixed size={12} color={COLORS.mute} mB={16} LineHeight={18}>
          Text search is always free. Industry, role, size, and location are
          advanced filters (subscription / trial gated on the API).
        </Typography>

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

        <FilterSection title="Location" defaultOpen={false}>
          <TextField
            placeholder="City or country"
            value={location}
            onChangeText={setLocation}
            autoCapitalize="words"
          />
        </FilterSection>
      </ScrollView>
      <View style={styles.footer}>
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
              activeCount ? `Apply ${activeCount} filter${activeCount > 1 ? 's' : ''}` : 'Show results'
            }
            onPress={apply}
          />
        </View>
      </View>
    </SafeAreaWrapper>
  );
};

export default FiltersScreen;

const styles = StyleSheet.create({
  handleWrap: { paddingTop: 12, paddingBottom: 4, alignItems: 'center' },
  handle: {
    width: 48,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  body: { paddingHorizontal: 20, paddingBottom: 24 },
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
