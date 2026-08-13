import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
//------------------
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { TextField, ScreenOverlayLoader } from '../../components';
import { Avatar, Icon, TopBar } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { useCustomQuery } from '../../query/useCustomQuery';
import { useCustomMutation } from '../../query/useCustomMutation';
import {
  getConnections,
  removeConnection,
} from '../../api/connectionService';
import {
  invalidateConnectionQueries,
  mapConnectionRow,
} from '../../helpers/connectionHelpers';
import { showMessage } from '../../utils';

const ConnectionsScreen = ({ navigation }) => {
  const [sort, setSort] = useState('recent');
  const [q, setQ] = useState('');

  const { data, isLoading, isFetching, refetch } = useCustomQuery({
    queryKey: ['connections', { filter: 'accepted' }],
    queryFn: () => getConnections({ filter: 'accepted', per_page: 50 }),
  });

  const { data: incomingRes } = useCustomQuery({
    queryKey: ['connections', { filter: 'pending_incoming' }],
    queryFn: () => getConnections({ filter: 'pending_incoming', per_page: 1 }),
  });

  const incomingCount = incomingRes?.meta?.total ?? 0;

  const rows = useMemo(() => {
    let list = (data?.connections || [])
      .map(mapConnectionRow)
      .filter(row => row?.other);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        row =>
          row.other.name.toLowerCase().includes(needle) ||
          row.other.headline.toLowerCase().includes(needle),
      );
    }
    if (sort === 'alpha') {
      list = [...list].sort((a, b) =>
        a.other.name.localeCompare(b.other.name),
      );
    }
    return list;
  }, [data, q, sort]);

  const { mutateAsync: disconnect, isPending: removing } = useCustomMutation({
    mutationFn: removeConnection,
    onSuccess: async (response, id) => {
      showMessage({
        type: 'success',
        message: response?.message || 'Connection removed.',
      });
      await invalidateConnectionQueries();
    },
  });

  const confirmDisconnect = row => {
    Alert.alert(
      'Remove connection',
      `Disconnect from ${row.other.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnect(row.id);
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
  };

  const openProfile = id => {
    navigation.getParent()?.navigate('ProfileScreen', { id });
  };

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <TopBar
        overline="Your Circle"
        title="Connections"
        right={
          <Pressable
            onPress={() => navigation.getParent()?.navigate('RequestsScreen')}>
            <Typography
              fixed
              size={11}
              fFamily="interSemiBold600"
              color={COLORS.primary}
              textTransform="uppercase"
              style={styles.track}>
              Requests{incomingCount ? ` (${incomingCount})` : ''}
            </Typography>
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <TextField
          placeholder="Search your connections"
          value={q}
          onChangeText={setQ}
          mB={16}
        />
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

        {(isLoading || isFetching) && (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        )}

        {!isLoading && rows.length === 0 && (
          <View style={styles.empty}>
            <Typography fixed size={14} color={COLORS.mute} textAlign="center">
              No accepted connections yet. Discover professionals and send a
              request.
            </Typography>
            <Pressable
              onPress={() => navigation.navigate('DiscoverTab')}
              style={styles.emptyLink}>
              <Typography
                fixed
                size={12}
                fFamily="interSemiBold600"
                color={COLORS.primary}
                textTransform="uppercase">
                Go to Discover
              </Typography>
            </Pressable>
          </View>
        )}

        {rows.length > 0 && (
          <View style={styles.list}>
            {rows.map(row => (
              <View key={row.id} style={styles.row}>
                <Pressable onPress={() => openProfile(row.other.id)}>
                  <Avatar
                    src={row.other.avatar}
                    size={48}
                    tier={row.other.tier}
                  />
                </Pressable>
                <Pressable
                  style={styles.copy}
                  onPress={() => openProfile(row.other.id)}
                  onLongPress={() => confirmDisconnect(row)}>
                  <Typography
                    fixed
                    size={14}
                    fFamily="interSemiBold600"
                    color={COLORS.foreground}
                    numberOfLines={1}>
                    {row.other.name}
                  </Typography>
                  <Typography
                    fixed
                    size={12}
                    color={COLORS.body}
                    numberOfLines={1}>
                    {row.other.headline || 'Connected'}
                  </Typography>
                </Pressable>
                <Pressable
                  style={styles.msgBtn}
                  onPress={() =>
                    navigation
                      .getParent()
                      ?.navigate('ChatScreen', { id: row.other.id })
                  }>
                  <Icon.Message size={16} color={COLORS.primary} />
                </Pressable>
                <Pressable
                  style={styles.moreBtn}
                  disabled={removing}
                  onPress={() => confirmDisconnect(row)}>
                  <Icon.Close size={14} color={COLORS.mute} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {!isLoading && rows.length > 0 && (
          <Pressable onPress={() => refetch()} style={styles.refresh}>
            <Typography
              fixed
              size={11}
              fFamily="interSemiBold600"
              color={COLORS.mute}
              textAlign="center"
              textTransform="uppercase">
              Refresh
            </Typography>
          </Pressable>
        )}
      </ScrollView>
      <ScreenOverlayLoader visible={removing} />
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
  loader: { marginVertical: 24 },
  empty: {
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  emptyLink: { marginTop: 16, alignItems: 'center' },
  list: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  moreBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refresh: { marginTop: 16, paddingVertical: 8 },
});
