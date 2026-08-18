import { useEffect, useRef } from 'react';
import { connectEcho, subscribeChat } from '../helpers/echoClient';
import { mapMessage, setActiveConversationId } from '../helpers/chatHelpers';

export function useChatChannel(conversationId, currentUserId, { onMessage, onRead } = {}) {
  const onMessageRef = useRef(onMessage);
  const onReadRef = useRef(onRead);
  onMessageRef.current = onMessage;
  onReadRef.current = onRead;

  useEffect(() => {
    if (conversationId == null) {
      setActiveConversationId(null);
      return undefined;
    }

    setActiveConversationId(conversationId);
    connectEcho();

    const unsubscribe = subscribeChat(conversationId, {
      onMessage: raw => {
        const mapped = mapMessage(raw, currentUserId);
        if (mapped) onMessageRef.current?.(mapped, raw);
      },
      onRead: receipt => onReadRef.current?.(receipt),
    });

    return () => {
      unsubscribe?.();
      setActiveConversationId(null);
    };
  }, [conversationId, currentUserId]);
}
