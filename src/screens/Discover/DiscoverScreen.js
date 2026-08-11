import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button, TextField } from '../../components';
import { Avatar, Chip, Icon, TopBar, VerifiedBadge } from '../../components/slife';
import { COLORS } from '../../globalStyle/Theme';
import { people } from '../../constants/mockData';

const DiscoverScreen = ({ navigation }) => {
  const [q, setQ] = useState('');
  const [view, setView] = useState('list');

  const filtered = people.filter(
    p =>
      !q ||
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.headline.toLowerCase().includes(q.toLowerCase()) ||
      p.industry.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <TopBar
        overline="The Directory"
        title="Discover Professionals"
        right={
          <Pressable onPress={() => navigation.getParent()?.navigate('FiltersScreen')} hitSlop={8}>
            <Icon.Filter size={20} color={COLORS.foreground} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <TextField placeholder="Search by name, title or industry" value={q} onChangeText={setQ} mB={16} />
        <View style={styles.metaRow}>
          <Typography
            fixed
            size={12}
            color={COLORS.mute}
            textTransform="uppercase"
            style={styles.track}>
            {filtered.length} verified professionals
          </Typography>
          <View style={styles.seg}>
            {['list', 'grid'].map(v => (
              <Pressable
                key={v}
                onPress={() => setView(v)}
                style={[styles.segBtn, view === v && styles.segOn]}>
                <Typography
                  fixed
                  size={11}
                  fFamily="interSemiBold600"
                  color={view === v ? COLORS.primaryForeground : COLORS.mute}
                  textTransform="uppercase"
                  style={styles.trackSmall}>
                  {v}
                </Typography>
              </Pressable>
            ))}
          </View>
        </View>

        {view === 'list'
          ? filtered.map(p => (
              <View key={p.id} style={styles.listCard}>
                <Pressable
                  onPress={() => navigation.getParent()?.navigate('ProfileScreen', { id: p.id })}>
                  <Avatar src={p.avatar} size={56} tier={p.tier} />
                </Pressable>
                <View style={styles.listCopy}>
                  <Typography
                    fixed
                    size={15}
                    fFamily="interSemiBold600"
                    color={COLORS.foreground}
                    numberOfLines={1}
                    onPress={() => navigation.getParent()?.navigate('ProfileScreen', { id: p.id })}>
                    {p.name}
                  </Typography>
                  <Typography fixed size={12} color={COLORS.body} numberOfLines={1}>
                    {p.headline}
                  </Typography>
                  <Typography fixed size={11} color={COLORS.mute} mT={4}>
                    {p.location} · {p.mutual} mutual
                  </Typography>
                </View>
                <View style={styles.connectBtn}>
                  <Button label="Connect" onPress={() => {}} />
                </View>
              </View>
            ))
          : (
            <View style={styles.grid}>
              {filtered.map(p => (
                <Pressable
                  key={p.id}
                  style={styles.gridCard}
                  onPress={() => navigation.getParent()?.navigate('ProfileScreen', { id: p.id })}>
                  <Avatar src={p.avatar} size={72} tier={p.tier} />
                  <Typography
                    fixed
                    size={13}
                    fFamily="interSemiBold600"
                    color={COLORS.foreground}
                    numberOfLines={1}
                    mT={12}
                    textAlign="center">
                    {p.name}
                  </Typography>
                  <Typography
                    fixed
                    size={11}
                    color={COLORS.body}
                    numberOfLines={2}
                    textAlign="center">
                    {p.headline}
                  </Typography>
                  <View style={styles.badge}>
                    <VerifiedBadge tier={p.tier} />
                  </View>
                  <Chip label={p.industry} />
                </Pressable>
              ))}
            </View>
          )}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

export default DiscoverScreen;

const styles = StyleSheet.create({
  body: { padding: 20, paddingBottom: 40 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  track: { letterSpacing: 0.88 },
  trackSmall: { letterSpacing: 0.66 },
  seg: { flexDirection: 'row', borderWidth: 1, borderColor: COLORS.border },
  segBtn: { paddingHorizontal: 12, height: 32, justifyContent: 'center' },
  segOn: { backgroundColor: COLORS.primary },
  listCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  listCopy: { flex: 1, minWidth: 0 },
  connectBtn: { width: 110 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: 'center',
  },
  badge: { marginVertical: 8 },
});
