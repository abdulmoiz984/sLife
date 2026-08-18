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
import { useSelector } from 'react-redux';
//------------------
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { TextField } from '../../components';
import { Avatar, TopBar } from '../../components/slife';
import { COLORS } from '../../globalStyle/Theme';
import { useCustomQuery } from '../../query/useCustomQuery';
import { getConversations } from '../../api/chatService';
import {
  CHATS_QUERY_KEY,
  formatChatTime,
  mapConversation,
  unwrapList,
} from '../../helpers/chatHelpers';

const MessagesScreen = ({ navigation }) => {
  const [q, setQ] = useState('');
  const currentUserId = useSelector(s => s.app.user?.id);

  const { data, isLoading, isFetching, isError, refetch } = useCustomQuery({
    queryKey: CHATS_QUERY_KEY,
    queryFn: () => getConversations({ per_page: 50 }),
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const rows = useMemo(() => {
    const mapped = unwrapList(data, 'conversations')
      .map(raw => mapConversation(raw, currentUserId))
      .filter(row => row?.id);
    if (!q.trim()) return mapped;
    const needle = q.trim().toLowerCase();
    return mapped.filter(row => {
      const name = row.other?.name || '';
      const preview = row.lastMessage?.body || '';
      return (
        name.toLowerCase().includes(needle) ||
        preview.toLowerCase().includes(needle)
      );
    });
  }, [data, q, currentUserId]);

  const openChat = row => {
    navigation.getParent()?.navigate('ChatScreen', {
      conversationId: row.id,
      userId: row.other?.id,
    });
  };

  const openProfile = row => {
    if (!row.other?.id) return;
    navigation.getParent()?.navigate('ProfileScreen', { id: row.other.id });
  };

  const renderItem = ({ item }) => {
    const muted = !item.canSend;
    return (
      <View style={styles.row}>
        <Pressable onPress={() => openProfile(item)}>
          <Avatar src={item.other?.avatar} size={52} tier={item.other?.tier} />
        </Pressable>
        <Pressable style={styles.copy} onPress={() => openChat(item)}>
          <View style={styles.top}>
            <Typography
              fixed
              size={14}
              fFamily="interSemiBold600"
              color={COLORS.foreground}
              numberOfLines={1}
              style={styles.name}>
              {item.other?.name || 'Member'}
            </Typography>
            <Typography fixed size={11} color={COLORS.mute}>
              {formatChatTime(item.lastMessage?.createdAt, { compact: true })}
            </Typography>
          </View>
          <View style={styles.bottom}>
            <Typography
              fixed
              size={13}
              color={muted ? COLORS.mute : COLORS.body}
              numberOfLines={1}
              style={styles.preview}>
              {muted && item.isBlocked
                ? 'Blocked'
                : item.lastMessage?.body || 'No messages yet'}
            </Typography>
            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Typography
                  fixed
                  size={11}
                  fFamily="interBold700"
                  color={COLORS.primaryForeground}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Typography>
              </View>
            )}
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <TopBar overline="Private Line" title="Messages" />
      <View style={styles.search}>
        <TextField
          placeholder="Search conversations"
          value={q}
          onChangeText={setQ}
          mB={0}
        />
      </View>
      {isLoading && rows.length === 0 ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                  ? 'Could not load conversations. Pull to retry.'
                  : q.trim()
                    ? 'No conversations match that search.'
                    : 'No conversations yet. Message someone from your connections.'}
              </Typography>
            </View>
          }
        />
      )}
    </SafeAreaWrapper>
  );
};

export default MessagesScreen;

const styles = StyleSheet.create({
  search: { padding: 20, paddingBottom: 8 },
  loader: { marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  copy: { flex: 1, minWidth: 0 },
  top: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: { flex: 1 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  preview: { flex: 1 },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { paddingHorizontal: 40, paddingTop: 48 },
});
