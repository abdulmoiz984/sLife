import React, { useMemo } from 'react';
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
import { Avatar, Icon, Overline } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { useCustomQuery } from '../../query/useCustomQuery';
import { getMemberMatches, getMembers } from '../../api/memberService';
import {
  connectionCtaLabel,
  mapMemberCard,
} from '../../helpers/memberMapper';
import { showMessage } from '../../utils';

const HomeScreen = ({ navigation }) => {
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

  const openProfile = id => {
    navigation.getParent()?.navigate('ProfileScreen', { id });
  };

  const onConnectPress = person => {
    // Module E will wire POST /connections — open profile for now
    if (person.connection?.status === 'pending') {
      showMessage({ type: 'default', message: 'Connection request pending.' });
      return;
    }
    if (person.connection?.status === 'accepted') {
      openProfile(person.id);
      return;
    }
    openProfile(person.id);
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
                onPress={() => openProfile(p.id)}>
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
                      onPress={() => openProfile(p.id)}
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
