import React, { useMemo, useState } from 'react';
import {
  View,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
//------------------
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button, ScreenOverlayLoader } from '../../components';
import {
  Avatar,
  Chip,
  ConnectRequestModal,
  Icon,
  ReportMemberModal,
  SectionLabel,
  VerifiedBadge,
} from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { onboardBoardroom } from '../../assets/images';
import { useCustomQuery } from '../../query/useCustomQuery';
import { useCustomMutation } from '../../query/useCustomMutation';
import { getMember } from '../../api/memberService';
import {
  cancelConnection,
  removeConnection,
} from '../../api/connectionService';
import {
  connectionCtaLabel,
  mapMemberDetail,
} from '../../helpers/memberMapper';
import { invalidateConnectionQueries } from '../../helpers/connectionHelpers';
import { showMessage } from '../../utils';

const ProfileScreen = ({ navigation, route }) => {
  const memberId = route.params?.id;
  const [showConnect, setShowConnect] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const { data, isLoading, isError, error, refetch } = useCustomQuery({
    queryKey: ['member', memberId],
    queryFn: () => getMember(memberId),
    enabled: !!memberId,
  });

  const person = useMemo(
    () => mapMemberDetail(data?.member),
    [data?.member],
  );

  const connection = person?.connection;
  const cta = connectionCtaLabel(connection);
  const connected = connection?.status === 'accepted';
  const pending = connection?.status === 'pending';
  const outgoingPending =
    pending && connection?.direction === 'outgoing';

  const { mutateAsync: cancelReq, isPending: cancelling } = useCustomMutation({
    mutationFn: cancelConnection,
  });
  const { mutateAsync: disconnect, isPending: removing } = useCustomMutation({
    mutationFn: removeConnection,
  });

  const onPrimaryCta = () => {
    if (connected && connection?.id) {
      Alert.alert(
        'Remove connection',
        `Disconnect from ${person.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                const res = await disconnect(connection.id);
                showMessage({
                  type: 'success',
                  message: res?.message || 'Connection removed.',
                });
                await invalidateConnectionQueries(memberId);
              } catch (err) {
                showMessage({
                  type: 'danger',
                  message:
                    err?.response?.data?.message ||
                    'Could not remove connection.',
                });
              }
            },
          },
        ],
      );
      return;
    }
    if (outgoingPending && connection?.id) {
      Alert.alert('Withdraw request', 'Cancel this connection request?', [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await cancelReq(connection.id);
              showMessage({
                type: 'success',
                message: res?.message || 'Request cancelled.',
              });
              await invalidateConnectionQueries(memberId);
            } catch (err) {
              showMessage({
                type: 'danger',
                message:
                  err?.response?.data?.message || 'Could not cancel request.',
              });
            }
          },
        },
      ]);
      return;
    }
    if (pending && connection?.direction === 'incoming') {
      navigation.navigate('RequestsScreen');
      return;
    }
    setShowConnect(true);
  };

  if (!memberId) {
    return (
      <SafeAreaWrapper bgColor={COLORS.background}>
        <View style={styles.empty}>
          <Typography
            fixed
            size={24}
            fFamily="spaceGroteskBold700"
            color={COLORS.foreground}>
            Profile unavailable
          </Typography>
          <Button label="Back" onPress={() => navigation.goBack()} mt={24} />
        </View>
      </SafeAreaWrapper>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaWrapper bgColor={COLORS.background}>
        <View style={styles.empty}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </SafeAreaWrapper>
    );
  }

  if (isError || !person) {
    const message =
      error?.response?.data?.message || 'Profile unavailable';
    return (
      <SafeAreaWrapper bgColor={COLORS.background}>
        <View style={styles.empty}>
          <Typography
            fixed
            size={11}
            fFamily="spaceGroteskSemiBold600"
            color={COLORS.primary}
            textTransform="uppercase">
            Not found
          </Typography>
          <Typography
            fixed
            size={24}
            fFamily="spaceGroteskBold700"
            color={COLORS.foreground}
            mT={8}
            textAlign="center">
            {message}
          </Typography>
          <Button label="Retry" onPress={() => refetch()} mt={16} />
          <Button
            type="outline"
            label="Back to Discover"
            onPress={() => navigation.goBack()}
            mt={12}
          />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        <View>
          <View style={styles.coverWrap}>
            <Image
              source={onboardBoardroom}
              style={styles.cover}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.5)', COLORS.background]}
              style={StyleSheet.absoluteFill}
            />
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.iconBtn, styles.leftBtn]}
              hitSlop={8}>
              <Icon.ArrowLeft size={20} color={COLORS.foreground} />
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert(person.name, undefined, [
                  {
                    text: 'Report member',
                    style: 'destructive',
                    onPress: () => setShowReport(true),
                  },
                  { text: 'Cancel', style: 'cancel' },
                ])
              }
              style={[styles.iconBtn, styles.rightBtn]}
              hitSlop={8}>
              <Icon.DotsV size={20} color={COLORS.foreground} />
            </Pressable>
          </View>
          <View style={styles.avatarWrap}>
            <Avatar src={person.avatar} size={96} tier={person.tier} />
          </View>
        </View>

        <View style={styles.intro}>
          <Typography
            fixed
            size={24}
            fFamily="spaceGroteskBold700"
            color={COLORS.foreground}>
            {person.name}
          </Typography>
          {!!person.headline && (
            <Typography fixed size={14} color={COLORS.body} mT={4}>
              {person.headline}
            </Typography>
          )}
          <View style={styles.badge}>
            <VerifiedBadge tier={person.tier} />
          </View>
          <View style={styles.meta}>
            {(person.company || person.roleLabel) && (
              <View style={styles.metaItem}>
                <Icon.Building size={16} color={COLORS.mute} />
                <Typography
                  fixed
                  size={13}
                  color={COLORS.mute}
                  style={styles.metaText}>
                  {[person.roleLabel || person.headline, person.company]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
              </View>
            )}
            {!!person.location && (
              <View style={styles.metaItem}>
                <Icon.Pin size={16} color={COLORS.mute} />
                <Typography fixed size={13} color={COLORS.mute}>
                  {person.location}
                </Typography>
              </View>
            )}
            {person.yearsExperience != null && (
              <View style={styles.metaItem}>
                <Icon.Sparkle size={16} color={COLORS.mute} />
                <Typography fixed size={13} color={COLORS.mute}>
                  {person.yearsExperience} years experience
                </Typography>
              </View>
            )}
          </View>

          <View style={styles.ctaRow}>
            <View style={styles.col}>
              <Button
                label={
                  connected
                    ? 'Disconnect'
                    : outgoingPending
                      ? 'Withdraw'
                      : cta
                }
                type={connected || outgoingPending ? 'outline' : 'primary'}
                loader={cancelling || removing}
                onPress={onPrimaryCta}
              />
            </View>
            <View style={styles.col}>
              <Pressable
                disabled={!connected}
                style={[styles.messageBtn, !connected && styles.messageDisabled]}
                onPress={() =>
                  navigation.navigate('ChatScreen', { userId: person.id })
                }>
                {!connected && <Icon.Lock size={16} color={COLORS.mute} />}
                <Typography
                  fixed
                  size={12}
                  fFamily="interSemiBold600"
                  color={connected ? COLORS.foreground : COLORS.mute}
                  textTransform="uppercase"
                  style={styles.messageLabel}>
                  Message
                </Typography>
              </Pressable>
            </View>
          </View>
        </View>

        {!!person.bio && (
          <View style={styles.section}>
            <SectionLabel>About</SectionLabel>
            <Typography fixed size={14} color={COLORS.body} LineHeight={22}>
              {person.bio}
            </Typography>
          </View>
        )}

        {person.interests?.length > 0 && (
          <View style={styles.section}>
            <SectionLabel>Interests</SectionLabel>
            <View style={styles.chips}>
              {person.interests.map(i => (
                <Chip key={i} label={i} />
              ))}
            </View>
          </View>
        )}

        {person.networkingGoals?.length > 0 && (
          <View style={styles.section}>
            <SectionLabel>Networking goals</SectionLabel>
            <View style={styles.chips}>
              {person.networkingGoals.map(g => (
                <Chip key={g} label={g} />
              ))}
            </View>
          </View>
        )}

        {person.education?.length > 0 && (
          <View style={styles.section}>
            <SectionLabel>Education</SectionLabel>
            {person.education.map((e, idx) => (
              <View key={`${e.school}-${idx}`} style={styles.eduCard}>
                <Typography
                  fixed
                  size={14}
                  fFamily="interSemiBold600"
                  color={COLORS.foreground}>
                  {e.school}
                </Typography>
                <Typography fixed size={13} color={COLORS.body} mT={4}>
                  {[e.degree, e.field].filter(Boolean).join(' · ')}
                </Typography>
                {!!e.period && (
                  <Typography fixed size={12} color={COLORS.mute} mT={4}>
                    {e.period}
                  </Typography>
                )}
              </View>
            ))}
          </View>
        )}

        {(person.linkedin || person.website) && (
          <View style={styles.section}>
            <SectionLabel>Links</SectionLabel>
            {!!person.linkedin && (
              <Typography fixed size={13} color={COLORS.primary} mB={8}>
                {person.linkedin}
              </Typography>
            )}
            {!!person.website && (
              <Typography fixed size={13} color={COLORS.primary}>
                {person.website}
              </Typography>
            )}
          </View>
        )}

        {connected && (person.email || person.phone) && (
          <View style={styles.section}>
            <SectionLabel>Contact</SectionLabel>
            {!!person.email && (
              <Typography fixed size={13} color={COLORS.body}>
                {person.email}
              </Typography>
            )}
            {!!person.phone && (
              <Typography fixed size={13} color={COLORS.body} mT={4}>
                {person.phone}
              </Typography>
            )}
          </View>
        )}
      </ScrollView>

      <ConnectRequestModal
        visible={showConnect}
        target={person}
        onClose={() => setShowConnect(false)}
      />
      <ReportMemberModal
        visible={showReport}
        target={person}
        onClose={() => setShowReport(false)}
      />
      <ScreenOverlayLoader visible={cancelling || removing} />
    </SafeAreaWrapper>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 40,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  coverWrap: {
    height: 160,
    overflow: 'hidden',
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  iconBtn: {
    position: 'absolute',
    top: 16,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    zIndex: 2,
    ...Platform.select({
      android: { elevation: 4 },
      default: {},
    }),
  },
  leftBtn: { left: 20 },
  rightBtn: { right: 20 },
  avatarWrap: {
    paddingHorizontal: 20,
    marginTop: -48,
    zIndex: 3,
  },
  intro: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  badge: {
    marginTop: 8,
  },
  meta: {
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  metaText: {
    flexShrink: 1,
  },
  ctaRow: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
  },
  messageBtn: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageDisabled: {
    opacity: 0.7,
  },
  messageLabel: {
    marginLeft: 8,
    letterSpacing: 0.72,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  eduCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    padding: 14,
    marginBottom: 10,
  },
});
