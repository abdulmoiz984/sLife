import { queryClient } from '../api/api';
import { mapConnectionUser } from './connectionHelpers';

export const CHATS_QUERY_KEY = ['chats'];

export function createClientMessageId() {
  const cryptoObj = global.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function unwrapList(data, key) {
  if (!data) return [];
  if (Array.isArray(data[key])) return data[key];
  if (Array.isArray(data.data?.[key])) return data.data[key];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

export function unwrapConversation(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.conversation) return data.conversation;
  if (data.data?.conversation) return data.data.conversation;
  if (data.data && data.data.id && (data.data.other_user || data.data.can_send != null)) {
    return data.data;
  }
  if (data.id && (data.other_user || data.can_send != null || data.last_message)) {
    return data;
  }
  return null;
}

export function unwrapSentMessage(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.chat_message) return data.chat_message;
  if (data.data?.chat_message) return data.data.chat_message;
  if (data.message && typeof data.message === 'object' && (data.message.id || data.message.body)) {
    return data.message;
  }
  if (data.data?.message && typeof data.data.message === 'object') {
    return data.data.message;
  }
  if (data.data && (data.data.id || data.data.body || data.data.client_message_id)) {
    return data.data;
  }
  if (data.id && (data.body != null || data.client_message_id)) {
    return data;
  }
  return null;
}

export function mapMessage(raw, currentUserId) {
  if (!raw) return null;
  const senderId = raw.sender_id ?? raw.user_id ?? raw.sender?.id;
  const mineFromFlag =
    typeof raw.is_mine === 'boolean' ? raw.is_mine : null;
  return {
    id: raw.id ?? null,
    clientMessageId: raw.client_message_id || raw.clientMessageId || null,
    body: raw.body || raw.text || '',
    senderId,
    mine:
      mineFromFlag != null
        ? mineFromFlag
        : currentUserId != null && senderId != null
          ? Number(senderId) === Number(currentUserId)
          : !!raw._mine,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    pending: !!raw._pending,
    failed: !!raw._failed,
    raw,
  };
}

export function mapConversation(raw, currentUserId) {
  if (!raw) return null;
  const last = raw.last_message || raw.latest_message;
  return {
    id: raw.id,
    other: mapConnectionUser(raw.other_user || raw.user),
    connectionStatus: raw.connection_status || raw.connection?.status,
    lastMessage: last ? mapMessage(last, currentUserId) : null,
    unreadCount: Number(raw.unread_count || 0),
    lastReadMessageId: raw.last_read_message_id ?? null,
    otherLastReadMessageId:
      raw.other_last_read_message_id ??
      raw.recipient_last_read_message_id ??
      raw.other_user_last_read_message_id ??
      null,
    isBlocked: !!raw.is_blocked,
    canSend: raw.can_send !== false,
    raw,
  };
}

export function mergeMessageList(existing, incoming) {
  const result = [];
  const byId = new Map();
  const byClient = new Map();

  const add = msg => {
    if (!msg) return;
    if (msg.id != null && byId.has(String(msg.id))) {
      const idx = byId.get(String(msg.id));
      result[idx] = { ...result[idx], ...msg, pending: false };
      if (msg.clientMessageId) byClient.set(msg.clientMessageId, idx);
      return;
    }
    if (msg.clientMessageId && byClient.has(msg.clientMessageId)) {
      const idx = byClient.get(msg.clientMessageId);
      result[idx] = { ...result[idx], ...msg, pending: msg.pending && result[idx].pending };
      if (msg.id != null) byId.set(String(msg.id), idx);
      return;
    }
    const idx = result.length;
    result.push(msg);
    if (msg.id != null) byId.set(String(msg.id), idx);
    if (msg.clientMessageId) byClient.set(msg.clientMessageId, idx);
  };

  existing.forEach(add);
  incoming.forEach(add);

  return result.sort((a, b) => {
    const tb = new Date(b.createdAt).getTime() || 0;
    const ta = new Date(a.createdAt).getTime() || 0;
    if (tb !== ta) return tb - ta;
    return Number(b.id || 0) - Number(a.id || 0);
  });
}

export function formatChatTime(iso, { compact = false } = {}) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return compact ? 'Yesterday' : 'Yesterday';
  }

  const diffDays = (now.getTime() - d.getTime()) / 86400000;
  if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function conversationDisabledCopy(conversation) {
  if (!conversation || conversation.canSend) return null;
  if (conversation.isBlocked) {
    return 'Messaging is disabled because someone in this conversation is blocked.';
  }
  if (conversation.connectionStatus && conversation.connectionStatus !== 'accepted') {
    return 'You are no longer connected. History is still available.';
  }
  return 'Messaging is currently unavailable.';
}

export async function invalidateChatQueries(conversationId) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY }),
    conversationId
      ? queryClient.invalidateQueries({ queryKey: ['chatMessages', conversationId] })
      : Promise.resolve(),
  ]);
}

let activeConversationId = null;

export function setActiveConversationId(id) {
  activeConversationId = id == null ? null : String(id);
}

export function getActiveConversationId() {
  return activeConversationId;
}
