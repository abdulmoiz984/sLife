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
import { Button, ScreenOverlayLoader } from '../../components';
import { Avatar, TopBar } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { useCustomQuery } from '../../query/useCustomQuery';
import { useCustomMutation } from '../../query/useCustomMutation';
import {
  acceptConnection,
  cancelConnection,
  declineConnection,
  getConnections,
} from '../../api/connectionService';
import {
  invalidateConnectionQueries,
  mapConnectionRow,
} from '../../helpers/connectionHelpers';
import { showMessage } from '../../utils';

const RequestsScreen = ({ navigation }) => {
  const [tab, setTab] = useState('received');
  const [busyId, setBusyId] = useState(null);

  const incomingQuery = useCustomQuery({
    queryKey: ['connections', { filter: 'pending_incoming' }],
    queryFn: () =>
      getConnections({ filter: 'pending_incoming', per_page: 50 }),
  });

  const outgoingQuery = useCustomQuery({
    queryKey: ['connections', { filter: 'pending_outgoing' }],
    queryFn: () =>
      getConnections({ filter: 'pending_outgoing', per_page: 50 }),
  });

  const received = useMemo(
    () =>
      (incomingQuery.data?.connections || [])
        .map(mapConnectionRow)
        .filter(row => row?.other),
    [incomingQuery.data],
  );

  const sent = useMemo(
    () =>
      (outgoingQuery.data?.connections || [])
        .map(mapConnectionRow)
        .filter(row => row?.other),
    [outgoingQuery.data],
  );

  const list = tab === 'received' ? received : sent;
  const loading =
    tab === 'received' ? incomingQuery.isLoading : outgoingQuery.isLoading;

  const runAction = async (fn, id, memberId) => {
    setBusyId(id);
    try {
      const response = await fn(id);
      showMessage({
        type: 'success',
        message: response?.message || 'Updated.',
      });
      await invalidateConnectionQueries(memberId);
    } catch (err) {
      showMessage({
        type: 'danger',
        message: err?.response?.data?.message || 'Action failed.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const { mutateAsync: accept } = useCustomMutation({
    mutationFn: acceptConnection,
  });
  const { mutateAsync: decline } = useCustomMutation({
    mutationFn: declineConnection,
  });
  const { mutateAsync: cancel } = useCustomMutation({
    mutationFn: cancelConnection,
  });

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <TopBar
        overline="Your Circle"
        title="Requests"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.tabs}>
        {[
          { id: 'received', label: 'received', count: received.length },
          { id: 'sent', label: 'sent', count: sent.length },
        ].map(t => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            style={[styles.tab, tab === t.id && styles.tabOn]}>
            <Typography
              fixed
              size={12}
              fFamily="interSemiBold600"
              color={tab === t.id ? COLORS.primary : COLORS.mute}
              textTransform="uppercase"
              style={styles.track}>
              {t.label} ({t.count})
            </Typography>
          </Pressable>
        ))}
      </View>
      <ScrollView>
        {loading && (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        )}

        {!loading && list.length === 0 && (
          <View style={styles.empty}>
            <Typography fixed size={14} color={COLORS.mute} textAlign="center">
              {tab === 'received'
                ? 'No incoming requests.'
                : 'No outgoing requests.'}
            </Typography>
          </View>
        )}

        {list.map(row => (
          <View key={row.id} style={styles.row}>
            <Pressable
              onPress={() => {
                navigation.navigate('ProfileScreen', {
                  id: row.other.id,
                  preview: row.other,
                });
              }}>
              <Avatar
                src={row.other.avatar}
                size={52}
                tier={row.other.tier}
              />
            </Pressable>
            <View style={styles.copy}>
              <Typography
                fixed
                size={14}
                fFamily="interSemiBold600"
                color={COLORS.foreground}>
                {row.other.name}
              </Typography>
              <Typography fixed size={12} color={COLORS.body} numberOfLines={1}>
                {row.other.headline || 'Professional'}
              </Typography>
              {!!row.message && (
                <Typography
                  fixed
                  size={12}
                  color={COLORS.mute}
                  mT={6}
                  LineHeight={18}>
                  “{row.message}”
                </Typography>
              )}
              <View style={styles.actions}>
                {tab === 'received' ? (
                  <>
                    <View style={styles.btnSm}>
                      <Button
                        label="Accept"
                        loader={busyId === row.id}
                        onPress={() =>
                          runAction(accept, row.id, row.other.id)
                        }
                      />
                    </View>
                    <Pressable
                      style={styles.decline}
                      disabled={busyId === row.id}
                      onPress={() =>
                        runAction(decline, row.id, row.other.id)
                      }>
                      <Typography
                        fixed
                        size={11}
                        fFamily="interSemiBold600"
                        color={COLORS.foreground}
                        textTransform="uppercase"
                        style={styles.trackSmall}>
                        Decline
                      </Typography>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <View style={styles.pending}>
                      <Typography
                        fixed
                        size={11}
                        fFamily="interSemiBold600"
                        color={COLORS.mute}
                        textTransform="uppercase"
                        style={styles.trackSmall}>
                        Pending
                      </Typography>
                    </View>
                    <Pressable
                      disabled={busyId === row.id}
                      onPress={() =>
                        runAction(cancel, row.id, row.other.id)
                      }>
                      <Typography
                        fixed
                        size={11}
                        fFamily="interSemiBold600"
                        color={COLORS.primary}
                        textTransform="uppercase"
                        style={[styles.trackSmall, styles.underline]}>
                        {busyId === row.id ? '…' : 'Withdraw'}
                      </Typography>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      <ScreenOverlayLoader visible={!!busyId} />
    </SafeAreaWrapper>
  );
};

export default RequestsScreen;

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabOn: { borderBottomColor: COLORS.primary },
  track: { letterSpacing: 0.96 },
  trackSmall: { letterSpacing: 0.66 },
  loader: { marginTop: 40 },
  empty: { padding: 40 },
  row: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  copy: { flex: 1, minWidth: 0 },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnSm: { width: 100 },
  decline: {
    height: 36,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pending: {
    height: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  underline: { textDecorationLine: 'underline' },
});
