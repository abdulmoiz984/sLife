import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
//------------------
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button, AppLogo } from '../../components';
import {
  Avatar,
  ConnectRequestModal,
  Icon,
  Overline,
} from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { useCustomQuery } from '../../query/useCustomQuery';
import { getMemberMatches, getMembers } from '../../api/memberService';
import {
  connectionCtaLabel,
  mapMemberCard,
} from '../../helpers/memberMapper';
import { showMessage } from '../../utils';
import { getNotifications } from '../../api/notificationService';
import { NOTIFICATIONS_QUERY_KEY } from '../../helpers/notificationHelpers';

const HomeScreen = ({ navigation }) => {
  const [requestFor, setRequestFor] = useState(null);
  const {
    data: matchesRes,
    isLoading: matchesLoading,
  } = useCustomQuery({
    queryKey: ['memberMatches', { limit: 8 }],
    queryFn: () => getMemberMatches({ limit: 8 }),
  });

  const {
    data: membersRes,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = useCustomQuery({
    queryKey: ['members', { per_page: 20, page: 1 }],
    queryFn: () => getMembers({ per_page: 20, page: 1 }),
  });

  const { data: notificationsRes } = useCustomQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => getNotifications({ per_page: 1 }),
  });
  const unreadNotifications = notificationsRes?.meta?.unread_count ?? 0;

  const matches = useMemo(
    () =>
      (matchesRes?.matches || [])
        .map(row => {
          const card = mapMemberCard(row.member);
          if (!card) return null;
          return { ...card, score: row.score, sameRole: row.same_role };
        })
        .filter(Boolean),
    [matchesRes],
  );

  const members = useMemo(
    () => (membersRes?.members || []).map(mapMemberCard).filter(Boolean),
    [membersRes],
  );

  const openProfile = person => {
    navigation.getParent()?.navigate('ProfileScreen', {
      id: person.id,
      preview: person,
    });
  };

  const onConnectPress = person => {
    if (person.connection?.status === 'pending') {
      showMessage({ type: 'default', message: 'Connection request pending.' });
      return;
    }
    if (person.connection?.status === 'accepted') {
      openProfile(person);
      return;
    }
    setRequestFor(person);
  };

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <AppLogo size={32} />
          <Typography
            fixed
            size={16}
            fFamily="spaceGroteskBold700"
            color={COLORS.foreground}>
            S-Life
          </Typography>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate('DiscoverTab')} hitSlop={8}>
            <Icon.Search size={20} color={COLORS.foreground} />
          </Pressable>
          <Pressable
            onPress={() =>
              navigation.getParent()?.navigate('NotificationsScreen')
            }
            hitSlop={8}
            style={styles.bell}>
            <Icon.Bell size={20} color={COLORS.foreground} />
            {unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Typography
                  fixed
                  size={9}
                  fFamily="interBold700"
                  color={COLORS.primaryForeground}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Typography>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        <View style={styles.sectionHead}>
          <View>
            <Overline>Recommended for you</Overline>
            <View style={styles.titleRow}>
              <Icon.Sparkle size={20} color={COLORS.primary} />
              <Typography
                fixed
                size={20}
                fFamily="spaceGroteskBold700"
                color={COLORS.foreground}>
                Curated Matches
              </Typography>
            </View>
          </View>
          <Pressable onPress={() => navigation.navigate('DiscoverTab')}>
            <Typography
              fixed
              size={11}
              fFamily="interSemiBold600"
              color={COLORS.primary}
              textTransform="uppercase"
              style={styles.track}>
              See all
            </Typography>
          </Pressable>
        </View>

        {matchesLoading ? (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        ) : matches.length === 0 ? (
          <View style={styles.emptyMatch}>
            <Typography fixed size={13} color={COLORS.mute} LineHeight={20}>
              No recommended matches yet. Complete your professional role and
              interests in onboarding to improve matching.
            </Typography>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}>
            {matches.map(p => (
              <Pressable
                key={p.id}
                style={styles.matchCard}
                onPress={() => openProfile(p)}>
                <View style={styles.matchInner}>
                  <Avatar src={p.avatar} size={56} tier={p.tier} />
                  <View style={styles.matchCopy}>
                    <Typography
                      fixed
                      size={15}
                      fFamily="interSemiBold600"
                      color={COLORS.foreground}
                      numberOfLines={1}>
                      {p.name}
                    </Typography>
                    <Typography
                      fixed
                      size={12}
                      color={COLORS.body}
                      numberOfLines={1}>
                      {p.headline || 'Professional'}
                    </Typography>
                    {p.score != null && (
                      <Typography fixed size={11} color={COLORS.mute} mT={4}>
                        Match score {p.score}
                      </Typography>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.feedHead}>
          <Overline>The Circle</Overline>
          <Typography
            fixed
            size={20}
            fFamily="spaceGroteskBold700"
            color={COLORS.foreground}
            mT={4}>
            Members you should know
          </Typography>
        </View>

        {membersLoading ? (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        ) : members.length === 0 ? (
          <View style={styles.emptyMatch}>
            <Typography fixed size={13} color={COLORS.mute}>
              No members available yet.
            </Typography>
            <Button label="Refresh" onPress={() => refetchMembers()} mt={12} />
          </View>
        ) : (
          members.map(p => {
            const label = connectionCtaLabel(p.connection);
            const pendingOrConnected =
              p.connection?.status === 'pending' ||
              p.connection?.status === 'accepted';
            return (
              <View key={p.id} style={styles.feedCard}>
                <View style={styles.matchInner}>
                  <Avatar src={p.avatar} size={56} tier={p.tier} />
                  <View style={styles.matchCopy}>
                    <Typography
                      fixed
                      size={15}
                      fFamily="interSemiBold600"
                      color={COLORS.foreground}
                      numberOfLines={1}>
                      {p.name}
                    </Typography>
                    <Typography
                      fixed
                      size={13}
                      color={COLORS.body}
                      numberOfLines={1}>
                      {p.headline || p.location || 'Professional'}
                    </Typography>
                  </View>
                </View>
                <View style={styles.ctaRow}>
                  <View style={styles.ctaCol}>
                    <Button
                      type="outline"
                      label="View Profile"
                      onPress={() => openProfile(p)}
                    />
                  </View>
                  <View style={styles.ctaCol}>
                    <Button
                      label={label === 'Connect' ? 'Send request' : label}
                      disabled={pendingOrConnected}
                      onPress={() => onConnectPress(p)}
                    />
                  </View>
                </View>
              </View>
            );
          })
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

export default HomeScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bell: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingBottom: 32 },
  sectionHead: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  track: { letterSpacing: 0.88 },
  loader: { marginVertical: 20 },
  emptyMatch: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  carousel: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 8,
  },
  matchCard: {
    width: 260,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 16,
  },
  matchInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  matchCopy: { flex: 1, minWidth: 0 },
  feedHead: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  feedCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 16,
  },
  ctaRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  ctaCol: { flex: 1 },
});
