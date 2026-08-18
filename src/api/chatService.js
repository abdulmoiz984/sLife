import { ENDPOINTS } from './endpoints';
import api from './api';

export const getConversations = async (params = {}) => {
  const response = await api.get(ENDPOINTS.CHATS, {
    params: {
      per_page: params.per_page ?? 20,
      page: params.page,
    },
  });
  return response.data;
};

export const openConversation = async userId => {
  const response = await api.post(ENDPOINTS.CHATS, { user_id: userId });
  return response.data;
};

export const getChatMessages = async (conversationId, params = {}) => {
  const response = await api.get(ENDPOINTS.CHAT_MESSAGES(conversationId), {
    params: {
      limit: params.limit ?? 30,
      ...(params.before_id ? { before_id: params.before_id } : {}),
    },
  });
  return response.data;
};

export const sendChatMessage = async (conversationId, body) => {
  const response = await api.post(ENDPOINTS.CHAT_MESSAGES(conversationId), {
    client_message_id: body.client_message_id,
    body: body.body,
  });
  return response.data;
};

export const markChatRead = async (conversationId, lastMessageId) => {
  // Prefer omitting id so the backend marks through the latest message.
  // Passing a stale id from a previous thread causes ModelNotFound 404 toasts.
  const payload =
    lastMessageId != null ? { last_message_id: lastMessageId } : {};
  const response = await api.post(ENDPOINTS.CHAT_READ(conversationId), payload, {
    skipErrorToast: true,
  });
  return response.data;
};

export const getBlockedUsers = async () => {
  const response = await api.get(ENDPOINTS.BLOCKED_USERS);
  return response.data;
};

export const blockUser = async userId => {
  const response = await api.post(ENDPOINTS.BLOCK_USER(userId));
  return response.data;
};

export const unblockUser = async userId => {
  const response = await api.delete(ENDPOINTS.BLOCK_USER(userId));
  return response.data;
};
