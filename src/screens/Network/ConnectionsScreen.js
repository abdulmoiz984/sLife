import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { TextField } from '../../components';
import { Avatar, Icon, TopBar } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { people } from '../../constants/mockData';

const ConnectionsScreen = ({ navigation }) => {
  const [sort, setSort] = useState('recent');
  const [q, setQ] = useState('');
  const list = [...people]
    .filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === 'alpha' ? a.name.localeCompare(b.name) : 0));

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <TopBar
        overline="Your Circle"
        title="Connections"
        right={
          <Pressable onPress={() => navigation.getParent()?.navigate('RequestsScreen')}>
            <Typography
              fixed
              size={11}
              fFamily="interSemiBold600"
              color={COLORS.primary}
              textTransform="uppercase"
              style={styles.track}>
              Requests
            </Typography>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <TextField placeholder="Search your connections" value={q} onChangeText={setQ} mB={16} />
        <View style={styles.seg}>
          {[
            { id: 'recent', label: 'Recently connected' },
            { id: 'alpha', label: 'A – Z' },
          ].map(s => (
            <Pressable
              key={s.id}
              onPress={() => setSort(s.id)}
              style={[styles.segBtn, sort === s.id && styles.segOn]}>
              <Typography
                fixed
                size={11}
                fFamily="interSemiBold600"
                color={sort === s.id ? COLORS.primaryForeground : COLORS.mute}
                textTransform="uppercase"
                style={styles.trackSmall}>
                {s.label}
              </Typography>
            </Pressable>
          ))}
        </View>

        <View style={styles.list}>
          {list.map(p => (
            <View key={p.id} style={styles.row}>
              <Pressable
                onPress={() =>
                  navigation.getParent()?.navigate('ProfileDetailsScreen', { id: p.id })
                }>
                <Avatar src={p.avatar} size={48} tier={p.tier} />
              </Pressable>
              <Pressable
                style={styles.copy}
                onPress={() =>
                  navigation.getParent()?.navigate('ProfileDetailsScreen', { id: p.id })
                }>
                <Typography
                  fixed
                  size={14}
                  fFamily="interSemiBold600"
                  color={COLORS.foreground}
                  numberOfLines={1}>
                  {p.name}
                </Typography>
                <Typography fixed size={12} color={COLORS.body} numberOfLines={1}>
                  {p.headline}
                </Typography>
              </Pressable>
              <Pressable
                style={styles.msgBtn}
                onPress={() => navigation.getParent()?.navigate('ChatScreen', { id: p.id })}>
                <Icon.Message size={16} color={COLORS.primary} />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

export default ConnectionsScreen;

const styles = StyleSheet.create({
  body: { padding: 20, paddingBottom: 40 },
  track: { letterSpacing: 0.88 },
  trackSmall: { letterSpacing: 0.66 },
  seg: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  segBtn: { paddingHorizontal: 12, height: 32, justifyContent: 'center' },
  segOn: { backgroundColor: COLORS.primary },
  list: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  copy: { flex: 1, minWidth: 0 },
  msgBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
