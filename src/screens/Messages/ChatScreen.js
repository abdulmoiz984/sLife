import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
//------------------
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Avatar, Icon } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { useCustomQuery } from '../../query/useCustomQuery';
import {
  blockUser,
  getChatMessages,
  getConversations,
  markChatRead,
  openConversation,
  sendChatMessage,
  unblockUser,
} from '../../api/chatService';
import {
  CHATS_QUERY_KEY,
  conversationDisabledCopy,
  createClientMessageId,
  formatChatTime,
  invalidateChatQueries,
  mapConversation,
  mapMessage,
  mergeMessageList,
  unwrapConversation,
  unwrapList,
  unwrapSentMessage,
} from '../../helpers/chatHelpers';
import { useChatChannel } from '../../hooks/useChatChannel';
import { showMessage } from '../../utils';
import { useSubscriptionMe } from '../../hooks/useSubscriptionMe';
import {
  isSubscriptionRequiredError,
} from '../../helpers/subscriptionHelpers';
import PremiumGate from '../../components/subscription/PremiumGate';

const MAX_BODY = 2000;

const ChatScreen = ({ navigation, route }) => {
  const currentUserId = useSelector(s => s.app.user?.id);
  const {
    isSubscribed,
    isLoading: subscriptionLoading,
  } = useSubscriptionMe();
  const paramConversationId = route.params?.conversationId ?? null;
  const paramUserId =
    route.params?.userId ??
    (paramConversationId == null ? route.params?.id : null);

  const [conversationId, setConversationId] = useState(paramConversationId);
  const [conversation, setConversation] = useState(null);
  /** Other participant's read cursor — API does not return this on GET /chats. */
  const [otherLastReadMessageId, setOtherLastReadMessageId] = useState(null);
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [opening, setOpening] = useState(!paramConversationId && !!paramUserId);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [openError, setOpenError] = useState(null);
  const [nextBeforeId, setNextBeforeId] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const markedIdRef = useRef(null);
  const openAttempted = useRef(false);
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;
  const activeRouteKey = useRef(
    `${paramConversationId ?? ''}:${paramUserId ?? ''}`,
  );

  /** Notification tap while already on ChatScreen — switch to that thread. */
  useEffect(() => {
    const nextConversationId = route.params?.conversationId ?? null;
    const nextUserId =
      route.params?.userId ??
      (nextConversationId == null ? route.params?.id : null);
    const nextKey = `${nextConversationId ?? ''}:${nextUserId ?? ''}`;

    if (nextKey === ':' || nextKey === activeRouteKey.current) {
      return;
    }

    // Same conversation already loaded
    if (
      nextConversationId != null &&
      conversationId != null &&
      String(nextConversationId) === String(conversationId)
    ) {
      activeRouteKey.current = nextKey;
      return;
    }

    activeRouteKey.current = nextKey;
    setConversationId(nextConversationId);
    setConversation(null);
    setOtherLastReadMessageId(null);
    setItems([]);
    setText('');
    setOpenError(null);
    setNextBeforeId(null);
    setHasMore(false);
    setLoading(!!nextConversationId || !!nextUserId);
    setOpening(!nextConversationId && !!nextUserId);
    markedIdRef.current = null;
    openAttempted.current = false;
  }, [
    route.params?.conversationId,
    route.params?.userId,
    route.params?.id,
    conversationId,
  ]);

  const bumpOtherLastRead = useCallback(candidate => {
    if (candidate == null || candidate === '') return;
    const next = Number(candidate);
    if (!Number.isFinite(next)) return;
    setOtherLastReadMessageId(prev =>
      prev == null || next > Number(prev) ? next : prev,
    );
  }, []);

  /** If they replied after our message, they have read everything before that reply. */
  const inferReadFromIncoming = useCallback(
    (list, incomingId) => {
      if (incomingId == null) return;
      let maxMine = null;
      list.forEach(m => {
        if (
          m.mine &&
          m.id != null &&
          Number(m.id) < Number(incomingId) &&
          (maxMine == null || Number(m.id) > maxMine)
        ) {
          maxMine = Number(m.id);
        }
      });
      if (maxMine != null) bumpOtherLastRead(maxMine);
    },
    [bumpOtherLastRead],
  );

  const { data: chatsData } = useCustomQuery({
    queryKey: CHATS_QUERY_KEY,
    queryFn: () => getConversations({ per_page: 50 }),
    enabled: isSubscribed,
  });

  const cachedConversation = useMemo(() => {
    if (conversationId == null) return null;
    const raw = unwrapList(chatsData, 'conversations').find(
      row => String(row.id) === String(conversationId),
    );
    return raw ? mapConversation(raw, currentUserId) : null;
  }, [chatsData, conversationId, currentUserId]);

  const thread = conversation || cachedConversation;
  const other = thread?.other;
  const canSend = thread ? thread.canSend : true;
  const disabledCopy = conversationDisabledCopy(thread);

  const subtitle = useMemo(() => {
    if (thread?.isBlocked) return 'Blocked';
    if (thread && !thread.canSend) return 'Disconnected';
    return other?.tier && other.tier !== 'Standard' ? other.tier : 'Connected';
  }, [thread, other]);

  const applyConversation = useCallback(
    raw => {
      const mapped = mapConversation(unwrapConversation(raw) || raw, currentUserId);
      if (mapped?.id) {
        setConversationId(mapped.id);
        setConversation(mapped);
        if (mapped.otherLastReadMessageId != null) {
          bumpOtherLastRead(mapped.otherLastReadMessageId);
        }
      }
      return mapped;
    },
    [currentUserId, bumpOtherLastRead],
  );

  useEffect(() => {
    if (cachedConversation?.otherLastReadMessageId != null) {
      bumpOtherLastRead(cachedConversation.otherLastReadMessageId);
    }
  }, [cachedConversation?.otherLastReadMessageId, bumpOtherLastRead]);

  useEffect(() => {
    if (!isSubscribed) return;
    if (conversationId != null || !paramUserId || openAttempted.current) return;
    openAttempted.current = true;
    let cancelled = false;
    (async () => {
      setOpening(true);
      setOpenError(null);
      try {
        const res = await openConversation(paramUserId);
        if (!cancelled) applyConversation(res);
      } catch (err) {
        if (!cancelled) {
          if (isSubscriptionRequiredError(err)) return;
          const message =
            err?.response?.data?.message || 'Could not open this conversation.';
          setOpenError(message);
          showMessage({ type: 'danger', message });
        }
      } finally {
        if (!cancelled) setOpening(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSubscribed, conversationId, paramUserId, applyConversation]);

  const ingestPage = useCallback(
    (data, { replace = false } = {}) => {
      const rawMessages = unwrapList(data, 'messages');
      const mapped = rawMessages
        .map(raw => mapMessage(raw, currentUserId))
        .filter(Boolean);
      setItems(prev => {
        const next = replace
          ? mergeMessageList([], mapped)
          : mergeMessageList(prev, mapped);
        const latestIncoming = next.find(m => !m.mine && m.id != null);
        if (latestIncoming) {
          inferReadFromIncoming(next, latestIncoming.id);
        }
        return next;
      });
      const meta = data?.meta || {};
      const nextId = meta.next_before_id ?? meta.nextBeforeId ?? null;
      setNextBeforeId(nextId);
      setHasMore(Boolean(meta.has_more ?? nextId));
    },
    [currentUserId, inferReadFromIncoming],
  );

  const loadLatest = useCallback(async () => {
    if (!isSubscribed || conversationId == null) return;
    const requestForId = conversationId;
    setLoading(true);
    try {
      const data = await getChatMessages(requestForId, { limit: 30 });
      // Ignore stale responses after switching chats via notification.
      if (String(conversationIdRef.current) !== String(requestForId)) {
        return;
      }
      ingestPage(data, { replace: true });
    } catch (err) {
      if (String(conversationIdRef.current) !== String(requestForId)) {
        return;
      }
      if (isSubscriptionRequiredError(err)) return;
      showMessage({
        type: 'danger',
        message: err?.response?.data?.message || 'Could not load messages.',
      });
    } finally {
      if (String(conversationIdRef.current) === String(requestForId)) {
        setLoading(false);
      }
    }
  }, [isSubscribed, conversationId, ingestPage]);

  useEffect(() => {
    if (conversationId == null) {
      if (!paramUserId) setLoading(false);
      return;
    }
    loadLatest();
  }, [conversationId, paramUserId, loadLatest]);

  const loadOlder = async () => {
    if (
      !isSubscribed ||
      !hasMore ||
      !nextBeforeId ||
      loadingMore ||
      conversationId == null
    ) return;
    const requestForId = conversationId;
    setLoadingMore(true);
    try {
      const data = await getChatMessages(requestForId, {
        limit: 30,
        before_id: nextBeforeId,
      });
      if (String(conversationIdRef.current) !== String(requestForId)) {
        return;
      }
      ingestPage(data);
    } catch (_) {
      /* keep current page */
    } finally {
      if (String(conversationIdRef.current) === String(requestForId)) {
        setLoadingMore(false);
      }
    }
  };

  const onLiveMessage = useCallback(
    mapped => {
      setItems(prev => {
        const next = mergeMessageList(prev, [mapped]);
        if (!mapped.mine && mapped.id != null) {
          inferReadFromIncoming(next, mapped.id);
        }
        return next;
      });
      invalidateChatQueries(conversationId);
    },
    [conversationId, inferReadFromIncoming],
  );

  const onLiveRead = useCallback(
    receipt => {
      if (!receipt) return;
      const payload = receipt.receipt || receipt.data || receipt;
      const userId = payload.user_id ?? payload.userId;
      const lastId =
        payload.last_read_message_id ??
        payload.lastReadMessageId ??
        payload.last_message_id;
      if (
        currentUserId != null &&
        userId != null &&
        Number(userId) === Number(currentUserId)
      ) {
        return;
      }
      if (__DEV__) {
        console.log('ChatScreen ~ conversation.read', payload);
      }
      bumpOtherLastRead(lastId);
    },
    [currentUserId, bumpOtherLastRead],
  );

  useChatChannel(isSubscribed ? conversationId : null, currentUserId, {
    onMessage: onLiveMessage,
    onRead: onLiveRead,
  });

  useEffect(() => {
    if (!isSubscribed || conversationId == null || items.length === 0) return;
    const latestId = items.find(m => m.id != null)?.id;
    if (latestId == null) return;
    const markKey = `${conversationId}:${latestId}`;
    if (markedIdRef.current === markKey) return;
    markedIdRef.current = markKey;
    // Omit message id — backend marks through latest for this conversation.
    // Avoids 404 "No query results for model [ChatMessage]" after chat switches.
    markChatRead(conversationId)
      .then(() => invalidateChatQueries(conversationId))
      .catch(() => {});
  }, [isSubscribed, conversationId, items]);

  const deliver = async (body, clientMessageId, { replaceFailed = false } = {}) => {
    if (!isSubscribed || conversationId == null) return;
    const optimistic = {
      id: null,
      clientMessageId,
      body,
      senderId: currentUserId,
      mine: true,
      createdAt: new Date().toISOString(),
      pending: true,
      failed: false,
    };
    setItems(prev => {
      const without = replaceFailed
        ? prev.filter(m => m.clientMessageId !== clientMessageId)
        : prev;
      return mergeMessageList(without, [optimistic]);
    });
    setSending(true);
    try {
      const res = await sendChatMessage(conversationId, {
        client_message_id: clientMessageId,
        body,
      });
      const mapped = mapMessage(
        unwrapSentMessage(res) || {
          client_message_id: clientMessageId,
          body,
          sender_id: currentUserId,
          created_at: optimistic.createdAt,
        },
        currentUserId,
      );
      setItems(prev =>
        mergeMessageList(prev, [
          { ...(mapped || optimistic), pending: false, failed: false, mine: true },
        ]),
      );
      await invalidateChatQueries(conversationId);
    } catch (err) {
      if (isSubscriptionRequiredError(err)) return;
      setItems(prev =>
        prev.map(m =>
          m.clientMessageId === clientMessageId
            ? { ...m, pending: false, failed: true }
            : m,
        ),
      );
      showMessage({
        type: 'danger',
        message: err?.response?.data?.message || 'Message not sent.',
      });
    } finally {
      setSending(false);
    }
  };

  const onSend = () => {
    const body = text.trim();
    if (!body || !canSend || conversationId == null || sending) return;
    if (body.length > MAX_BODY) {
      showMessage({
        type: 'danger',
        message: 'Messages can be up to 2,000 characters.',
      });
      return;
    }
    setText('');
    deliver(body, createClientMessageId());
  };

  const retryFailed = msg => {
    if (!msg?.failed || !msg.body) return;
    deliver(msg.body, msg.clientMessageId || createClientMessageId(), {
      replaceFailed: true,
    });
  };

  const openProfile = () => {
    if (!other?.id) return;
    navigation.navigate('ProfileScreen', { id: other.id });
  };

  const confirmBlockToggle = () => {
    if (!other?.id) return;
    const blocked = !!thread?.isBlocked;
    Alert.alert(
      blocked ? 'Unblock member' : 'Block member',
      blocked
        ? `Unblock ${other.name}? You will be able to message again if you are still connected.`
        : `Block ${other.name}? Messaging will be disabled in both directions. History stays visible.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: blocked ? 'Unblock' : 'Block',
          style: blocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              if (blocked) {
                await unblockUser(other.id);
              } else {
                await blockUser(other.id);
              }
              setConversation(prev =>
                prev
                  ? {
                      ...prev,
                      isBlocked: !blocked,
                      canSend: blocked,
                    }
                  : prev,
              );
              await invalidateChatQueries(conversationId);
              showMessage({
                type: 'success',
                message: blocked ? 'Member unblocked.' : 'Member blocked.',
              });
            } catch (err) {
              showMessage({
                type: 'danger',
                message:
                  err?.response?.data?.message ||
                  (blocked ? 'Could not unblock.' : 'Could not block.'),
              });
            }
          },
        },
      ],
    );
  };

  const openMenu = () => {
    Alert.alert(other?.name || 'Conversation', undefined, [
      other?.id ? { text: 'View profile', onPress: openProfile } : null,
      other?.id
        ? {
            text: thread?.isBlocked ? 'Unblock' : 'Block',
            style: thread?.isBlocked ? 'default' : 'destructive',
            onPress: confirmBlockToggle,
          }
        : null,
      { text: 'Cancel', style: 'cancel' },
    ].filter(Boolean));
  };

  const otherReadId = otherLastReadMessageId;

  const renderMessage = ({ item }) => {
    const mine = item.mine;
    const read =
      mine &&
      !item.pending &&
      !item.failed &&
      item.id != null &&
      otherReadId != null &&
      Number(item.id) <= Number(otherReadId);
    return (
      <Pressable
        onPress={() => item.failed && retryFailed(item)}
        style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
        <View style={[styles.bubble, mine ? styles.mine : styles.theirs, item.failed && styles.failed]}>
          <Typography
            fixed
            size={14}
            color={mine ? COLORS.foreground : COLORS.body}
            LineHeight={21}>
            {item.body}
          </Typography>
        </View>
        <View style={[styles.meta, mine && styles.metaMine]}>
          <Typography fixed size={10} color={item.failed ? COLORS.destructive : COLORS.mute}>
            {item.failed
              ? 'Not sent · tap to retry'
              : item.pending
                ? 'Sending'
                : formatChatTime(item.createdAt)}
          </Typography>
          {mine && !item.failed && (
            read ? (
              <Icon.Checks size={12} color={COLORS.primary} />
            ) : (
              <Icon.Check size={12} color={item.pending ? COLORS.mute : COLORS.mute} />
            )
          )}
        </View>
      </Pressable>
    );
  };

  if (subscriptionLoading) {
    return (
      <SafeAreaWrapper edges={['top', 'bottom']} bgColor={COLORS.background}>
        <View style={styles.accessLoader}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!isSubscribed) {
    return (
      <SafeAreaWrapper edges={['top', 'bottom']} bgColor={COLORS.background}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={styles.iconBtn}>
            <Icon.ArrowLeft size={20} color={COLORS.foreground} />
          </Pressable>
          <Avatar size={36} />
          <View style={styles.headerCopy}>
            <Typography
              fixed
              size={14}
              fFamily="interSemiBold600"
              color={COLORS.foreground}>
              Private conversation
            </Typography>
            <Typography fixed size={11} color={COLORS.mute}>
              Premium messaging
            </Typography>
          </View>
          <View style={styles.iconBtn} />
        </View>
        <PremiumGate
          compact
          eyebrow="Conversation locked"
          title="Connect through private messaging"
          description="Subscribe to open this conversation, send messages, and receive realtime replies."
          cta="Unlock conversation"
          onUnlock={() => navigation.navigate('SubscriptionScreen')}
        />
        <View style={styles.lockedComposer}>
          <Icon.Lock size={16} color={COLORS.mute} />
          <Typography fixed size={13} color={COLORS.mute}>
            Subscribe to write a message
          </Typography>
        </View>
      </SafeAreaWrapper>
    );
  }

  const headerName = other?.name || 'Conversation';

  return (
    <SafeAreaWrapper edges={['top', 'bottom']} bgColor={COLORS.background}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.iconBtn}>
            <Icon.ArrowLeft size={20} color={COLORS.foreground} />
          </Pressable>
          <Pressable onPress={openProfile} disabled={!other?.id}>
            <Avatar src={other?.avatar} size={36} tier={other?.tier} />
          </Pressable>
          <Pressable
            style={styles.headerCopy}
            onPress={openProfile}
            disabled={!other?.id}>
            <Typography
              fixed
              size={14}
              fFamily="interSemiBold600"
              color={COLORS.foreground}
              numberOfLines={1}>
              {headerName}
            </Typography>
            <Typography fixed size={11} color={COLORS.mute} numberOfLines={1}>
              {opening ? 'Opening…' : subtitle}
            </Typography>
          </Pressable>
          <Pressable onPress={openMenu} hitSlop={8} style={styles.iconBtn}>
            <Icon.DotsV size={20} color={COLORS.foreground} />
          </Pressable>
        </View>

        {opening || (loading && items.length === 0) ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} />
            {openError ? (
              <Typography fixed size={13} color={COLORS.mute} textAlign="center" mT={16}>
                {openError}
              </Typography>
            ) : null}
          </View>
        ) : (
          <FlatList
            inverted
            data={items}
            keyExtractor={(item, index) =>
              String(item.id || item.clientMessageId || `m-${index}`)
            }
            renderItem={renderMessage}
            contentContainerStyle={styles.thread}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onEndReached={loadOlder}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator color={COLORS.primary} style={styles.more} />
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyThread}>
                <Typography fixed size={13} color={COLORS.mute} textAlign="center">
                  {openError || 'No messages yet. Say hello.'}
                </Typography>
              </View>
            }
          />
        )}

        {!!disabledCopy && (
          <View style={styles.banner}>
            <Icon.Lock size={14} color={COLORS.mute} />
            <Typography fixed size={12} color={COLORS.mute} style={styles.bannerText}>
              {disabledCopy}
            </Typography>
          </View>
        )}

        <View style={styles.composer}>
          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={canSend ? 'Write a message' : 'Messaging unavailable'}
              placeholderTextColor={COLORS.mute}
              style={[styles.input, !canSend && styles.inputDisabled]}
              editable={canSend && conversationId != null}
              maxLength={MAX_BODY}
              multiline
              blurOnSubmit={false}
            />
            <Pressable
              style={[
                styles.send,
                (!canSend || !text.trim() || conversationId == null) && styles.sendOff,
              ]}
              onPress={onSend}
              disabled={!canSend || !text.trim() || conversationId == null || sending}>
              <Icon.Send size={20} color={COLORS.primaryForeground} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  accessLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedComposer: {
    minHeight: 58,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconBtn: { padding: 4 },
  headerCopy: { flex: 1, minWidth: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  thread: { padding: 20, gap: 16, flexGrow: 1 },
  emptyThread: { padding: 24, transform: [{ scaleY: -1 }] },
  more: { marginVertical: 12 },
  bubbleRow: { alignItems: 'flex-start' },
  bubbleRowMine: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  mine: {
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  theirs: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  failed: { borderColor: COLORS.destructive },
  meta: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaMine: { justifyContent: 'flex-end' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  bannerText: { flex: 1 },
  composer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 12,
    backgroundColor: COLORS.background,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: 12,
    color: COLORS.foreground,
    fontSize: 14,
  },
  inputDisabled: { opacity: 0.6 },
  send: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { opacity: 0.4 },
});
