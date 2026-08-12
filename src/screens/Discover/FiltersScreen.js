import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button, TextField } from '../../components';
import { Chip, Icon } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { industries, interests, leadershipLevels } from '../../constants/mockData';

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

const FiltersScreen = ({ navigation }) => {
  const [ind, setInd] = useState([]);
  const [lev, setLev] = useState([]);
  const [size, setSize] = useState([]);
  const [int, setInt] = useState([]);
  const toggle = (arr, setArr, v) => setArr(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  const count = 128 - (ind.length + lev.length + size.length + int.length) * 3;

  return (
    <SafeAreaWrapper edges={['top', 'bottom']} bgColor={COLORS.surface}>
      <View style={styles.handleWrap}>
        <View style={styles.handle} />
      </View>
      <View style={styles.top}>
        <Typography fixed size={18} fFamily="spaceGroteskBold700" color={COLORS.foreground}>
          Filters
        </Typography>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon.Close size={20} color={COLORS.foreground} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <FilterSection title="Industry">
          <View style={styles.chips}>
            {industries.map(i => (
              <Chip key={i} label={i} active={ind.includes(i)} onPress={() => toggle(ind, setInd, i)} />
            ))}
          </View>
        </FilterSection>
        <FilterSection title="Job title">
          <TextField placeholder="Search titles" mB={12} />
          <View style={styles.chips}>
            {['Founder', 'CEO', 'CFO', 'Partner', 'Director', 'Consultant'].map(t => (
              <Chip key={t} label={t} />
            ))}
          </View>
        </FilterSection>
        <FilterSection title="Experience Level">
          <View style={styles.chips}>
            {['Entry', 'Mid', 'Senior', 'Executive'].map(l => (
              <Chip key={l} label={l} active={lev.includes(l)} onPress={() => toggle(lev, setLev, l)} />
            ))}
          </View>
        </FilterSection>
        <FilterSection title="Company Size">
          <View style={styles.chips}>
            {['1–10', '11–50', '51–200', '201–1k', '1k–10k', '10k+'].map(s => (
              <Chip key={s} label={s} active={size.includes(s)} onPress={() => toggle(size, setSize, s)} />
            ))}
          </View>
        </FilterSection>
        <FilterSection title="Location" defaultOpen={false}>
          <TextField placeholder="City or country" />
        </FilterSection>
        <FilterSection title="Professional Interests" defaultOpen={false}>
          <View style={styles.chips}>
            {interests.map(i => (
              <Chip key={i} label={i} active={int.includes(i)} onPress={() => toggle(int, setInt, i)} />
            ))}
          </View>
        </FilterSection>
        <FilterSection title="Professional Role" defaultOpen={false}>
          <View style={styles.chips}>
            {leadershipLevels.map(l => (
              <Chip key={l} label={l} />
            ))}
          </View>
        </FilterSection>
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.col}>
          <Button
            type="outline"
            label="Reset"
            textColor={COLORS.mute}
            onPress={() => {
              setInd([]);
              setLev([]);
              setSize([]);
              setInt([]);
            }}
          />
        </View>
        <View style={styles.col}>
          <Button
            label={`Show ${Math.max(count, 0)} results`}
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    </SafeAreaWrapper>
  );
};

export default FiltersScreen;

const styles = StyleSheet.create({
  handleWrap: { paddingTop: 12, paddingBottom: 4, alignItems: 'center' },
  handle: { width: 48, height: 4, borderRadius: RADIUS.full, backgroundColor: COLORS.border },
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
