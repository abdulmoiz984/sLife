import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
//------------------
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { TopBar } from '../../components/slife';
import { COLORS } from '../../globalStyle/Theme';
import { useCustomQuery } from '../../query/useCustomQuery';
import { useCustomMutation } from '../../query/useCustomMutation';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../api/notificationService';
import {
  NOTIFICATIONS_QUERY_KEY,
  groupNotifications,
  invalidateNotificationQueries,
  mapNotification,
  openNotificationDestination,
  unwrapNotifications,
} from '../../helpers/notificationHelpers';
import { showMessage } from '../../utils';

const NotificationsScreen = ({ navigation }) => {
  const [markingAll, setMarkingAll] = useState(false);

  const { data, isLoading, isFetching, isError, refetch } = useCustomQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => getNotifications({ per_page: 50 }),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const rows = useMemo(
    () =>
      unwrapNotifications(data)
        .map(mapNotification)
        .filter(Boolean),
    [data],
  );

  const groups = useMemo(() => groupNotifications(rows), [rows]);
  const unreadCount = data?.meta?.unread_count ?? rows.filter(n => !n.isRead).length;

  const { mutateAsync: markOne } = useCustomMutation({
    mutationFn: markNotificationRead,
  });

  const onPressItem = async item => {
    try {
      if (!item.isRead) {
        await markOne(item.id);
        await invalidateNotificationQueries();
      }
    } catch (_) {
      /* still navigate */
    }
    openNotificationDestination({
      type: item.type,
      data: item.data,
      ...item.data,
    });
  };

  const onMarkAll = async () => {
    if (markingAll || unreadCount < 1) return;
    setMarkingAll(true);
    try {
      const res = await markAllNotificationsRead();
      await invalidateNotificationQueries();
      showMessage({
        type: 'success',
        message: res?.message || 'All notifications marked as read.',
      });
    } catch (err) {
      showMessage({
        type: 'danger',
        message:
          err?.response?.data?.message || 'Could not mark notifications read.',
      });
    } finally {
      setMarkingAll(false);
    }
  };

  const listData = useMemo(() => {
    const out = [];
    groups.forEach(g => {
      out.push({ kind: 'header', id: `h-${g.label}`, label: g.label });
      g.items.forEach(item => {
        out.push({ kind: 'item', id: `n-${item.id}`, item });
      });
    });
    return out;
  }, [groups]);

  const renderRow = ({ item: row }) => {
    if (row.kind === 'header') {
      return (
        <Typography
          fixed
          size={11}
          fFamily="interSemiBold600"
          color={COLORS.mute}
          textTransform="uppercase"
          style={styles.group}>
          {row.label}
        </Typography>
      );
    }

    const n = row.item;
    return (
      <Pressable
        onPress={() => onPressItem(n)}
        style={[styles.row, !n.isRead && styles.rowUnread]}>
        {!n.isRead && <View style={styles.unread} />}
        <View style={styles.copy}>
          <Typography
            fixed
            size={14}
            fFamily="interSemiBold600"
            color={COLORS.foreground}
            numberOfLines={2}>
            {n.title || 'Notification'}
          </Typography>
          {!!n.body && (
            <Typography
              fixed
              size={13}
              color={COLORS.body}
              LineHeight={18}
              numberOfLines={3}
              style={styles.body}>
              {n.body}
            </Typography>
          )}
        </View>
        <Typography fixed size={11} color={COLORS.mute}>
          {n.timeLabel}
        </Typography>
      </Pressable>
    );
  };

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <TopBar
        overline="Signals"
        title="Notifications"
        onBack={() => navigation.goBack()}
        right={
          unreadCount > 0 ? (
            <Pressable onPress={onMarkAll} disabled={markingAll} hitSlop={8}>
              <Typography
                fixed
                size={11}
                fFamily="interSemiBold600"
                color={COLORS.primary}
                textTransform="uppercase"
                style={styles.markAll}>
                {markingAll ? '…' : 'Mark all read'}
              </Typography>
            </Pressable>
          ) : null
        }
      />
      {isLoading && rows.length === 0 ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={row => row.id}
          renderItem={renderRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Typography fixed size={14} color={COLORS.mute} textAlign="center">
                {isError
                  ? 'Could not load notifications. Pull to retry.'
                  : 'No notifications yet.'}
              </Typography>
            </View>
          }
        />
      )}
    </SafeAreaWrapper>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  list: { paddingBottom: 32, flexGrow: 1 },
  loader: { marginTop: 40 },
  markAll: { letterSpacing: 0.66 },
  group: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    letterSpacing: 1.54,
  },
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rowUnread: {
    backgroundColor: 'rgba(241, 0, 0, 0.04)',
  },
  unread: {
    position: 'absolute',
    left: 8,
    top: 22,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  copy: { flex: 1, minWidth: 0, paddingLeft: 8 },
  body: { marginTop: 4 },
  empty: { paddingHorizontal: 40, paddingTop: 48 },
});
