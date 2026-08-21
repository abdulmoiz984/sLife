import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
//------------------
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button, TextField } from '../../components';
import {
  Avatar,
  Chip,
  ConnectRequestModal,
  Icon,
  TopBar,
} from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { useCustomQuery } from '../../query/useCustomQuery';
import { getMembers } from '../../api/memberService';
import {
  connectionCtaLabel,
  mapMemberCard,
} from '../../helpers/memberMapper';
import { useSubscriptionMe } from '../../hooks/useSubscriptionMe';

const DiscoverScreen = ({ navigation, route }) => {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [view, setView] = useState('list');
  const [requestFor, setRequestFor] = useState(null);
  const { isSubscribed } = useSubscriptionMe();
  const routeFilters = useMemo(
    () => route?.params?.filters || {},
    [route?.params?.filters],
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const queryParams = useMemo(() => {
    const params = { per_page: 20, page: 1 };
    if (debouncedQ) params.q = debouncedQ;
    if (routeFilters.industry) params.industry = routeFilters.industry;
    if (routeFilters.professional_role) {
      params.professional_role = routeFilters.professional_role;
    }
    if (routeFilters.organization_size) {
      params.organization_size = routeFilters.organization_size;
    }
    if (routeFilters.location) params.location = routeFilters.location;
    return params;
  }, [debouncedQ, routeFilters]);

  const hasAdvancedFilters = !!(
    routeFilters.industry ||
    routeFilters.professional_role ||
    routeFilters.organization_size ||
    routeFilters.location
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useCustomQuery({
      queryKey: ['members', queryParams],
      queryFn: () => getMembers(queryParams),
    });

  useEffect(() => {
    if (!isError) return;
    if (error?.response?.data?.code === 'SUBSCRIPTION_REQUIRED') {
      // Prevent an immediate redirect loop if the user backs out of paywall.
      navigation.setParams({ filters: undefined });
    }
  }, [isError, error, navigation]);

  const members = (data?.members || []).map(mapMemberCard).filter(Boolean);
  const total = data?.meta?.total ?? members.length;

  const openProfile = person => {
    navigation.getParent()?.navigate('ProfileScreen', {
      id: person.id,
      preview: person,
    });
  };

  const openAdvancedFilters = () => {
    navigation.getParent()?.navigate('FiltersScreen', {
      filters: routeFilters,
    });
  };

  const connectLabel = person => connectionCtaLabel(person.connection);

  const onConnectPress = person => {
    const status = person.connection?.status;
    if (status === 'pending' || status === 'accepted') {
      openProfile(person);
      return;
    }
    setRequestFor(person);
  };

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <TopBar
        overline="The Directory"
        title="Discover Professionals"
        right={
          <Pressable
            onPress={openAdvancedFilters}
            style={styles.filterAction}
            hitSlop={8}>
            {!isSubscribed && (
              <Icon.Lock size={14} color={COLORS.primary} />
            )}
            <Icon.Filter size={20} color={COLORS.foreground} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <TextField
          placeholder="Search by name, title or industry"
          value={q}
          onChangeText={setQ}
          mB={16}
        />
        {hasAdvancedFilters && (
          <View style={styles.filterNote}>
            <Typography fixed size={12} color={COLORS.body} LineHeight={18}>
              Advanced filters applied. These require subscription access on the
              server.
            </Typography>
            <Pressable
              onPress={() =>
                navigation.setParams({ filters: undefined })
              }
              style={styles.clearFilters}>
              <Typography
                fixed
                size={11}
                fFamily="interSemiBold600"
                color={COLORS.primary}
                textTransform="uppercase">
                Clear filters
              </Typography>
            </Pressable>
          </View>
        )}
        <View style={styles.metaRow}>
          <Typography
            fixed
            size={12}
            color={COLORS.mute}
            textTransform="uppercase"
            style={styles.track}>
            {isLoading ? 'Loading…' : `${total} professionals`}
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

        {(isLoading || isFetching) && (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        )}

        {!isLoading && isError && (
          <View style={styles.empty}>
            <Typography fixed size={14} color={COLORS.body} textAlign="center">
              Could not load members.
            </Typography>
            <Button label="Retry" onPress={() => refetch()} mt={16} />
          </View>
        )}

        {!isLoading && !isError && members.length === 0 && (
          <View style={styles.empty}>
            <Typography fixed size={14} color={COLORS.mute} textAlign="center">
              No members found.
            </Typography>
          </View>
        )}

        {view === 'list'
          ? members.map(p => (
              <View key={p.id} style={styles.listCard}>
                <Pressable onPress={() => openProfile(p)}>
                  <Avatar src={p.avatar} size={56} tier={p.tier} />
                </Pressable>
                <View style={styles.listCopy}>
                  <Typography
                    fixed
                    size={15}
                    fFamily="interSemiBold600"
                    color={COLORS.foreground}
                    numberOfLines={1}
                    onPress={() => openProfile(p)}>
                    {p.name}
                  </Typography>
                  <Typography fixed size={12} color={COLORS.body} numberOfLines={1}>
                    {p.headline || p.industry || 'Professional'}
                  </Typography>
                  <Typography fixed size={11} color={COLORS.mute} mT={4}>
                    {[p.location, p.company].filter(Boolean).join(' · ') ||
                      '—'}
                  </Typography>
                </View>
                {!isSubscribed && (
                  <View style={styles.profileLock}>
                    <Icon.Lock size={14} color={COLORS.primary} />
                  </View>
                )}
                <View style={styles.connectBtn}>
                  <Button
                    label={connectLabel(p)}
                    disabled={
                      p.connection?.status === 'accepted' ||
                      p.connection?.status === 'pending'
                    }
                    onPress={() => onConnectPress(p)}
                  />
                </View>
              </View>
            ))
          : (
            <View style={styles.grid}>
              {members.map(p => (
                <Pressable
                  key={p.id}
                  style={styles.gridCard}
                  onPress={() => openProfile(p)}>
                  {!isSubscribed && (
                    <View style={styles.gridLock}>
                      <Icon.Lock size={13} color={COLORS.primary} />
                    </View>
                  )}
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
                    {p.headline || 'Professional'}
                  </Typography>
                  {!!p.industry && (
                    <Chip
                      label={p.industry}
                      style={styles.industryChip}
                      numberOfLines={2}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          )}
      </ScrollView>

      <ConnectRequestModal
        visible={!!requestFor}
        target={requestFor}
        onClose={() => setRequestFor(null)}
      />
    </SafeAreaWrapper>
  );
};

export default DiscoverScreen;

const styles = StyleSheet.create({
  filterAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileLock: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLock: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 20, paddingBottom: 40 },
  filterNote: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
  },
  clearFilters: { marginTop: 8 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  track: { letterSpacing: 0.88 },
  trackSmall: { letterSpacing: 0.66 },
  seg: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  segBtn: { paddingHorizontal: 12, height: 32, justifyContent: 'center' },
  segOn: { backgroundColor: COLORS.primary },
  loader: { marginVertical: 24 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  listCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
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
    borderRadius: RADIUS.md,
    padding: 16,
    alignItems: 'center',
  },
  industryChip: {
    alignSelf: 'stretch',
    marginRight: 0,
    marginBottom: 0,
    marginTop: 8,
  },
});
