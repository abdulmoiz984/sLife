import { Pusher } from '@pusher/pusher-websocket-react-native';
import { AppState } from 'react-native';
import api, { storage } from '../api/api';
import { ENDPOINTS } from '../api/endpoints';
import { KEYS } from '../constants';
import { PUSHER_CLUSTER, PUSHER_KEY } from '../constants/pusher';

/** Lazily created — never call native disconnect/connect before init. */
let pusher = null;
let didInit = false;
let connecting = null;
let appStateSub = null;

function getClient() {
  if (!pusher) {
    pusher = Pusher.getInstance();
  }
  return pusher;
}

function parseEventData(data) {
  if (data == null) return {};
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch (_) {
    return {};
  }
}

function eventNameOf(event) {
  return String(event?.eventName || event?.event || '').replace(/^\./, '');
}

async function onAuthorizer(channelName, socketId) {
  try {
    const response = await api.post(ENDPOINTS.BROADCAST_AUTH, {
      socket_id: socketId,
      channel_name: channelName,
    });
    const body = response.data || {};
    if (body.auth) {
      return body;
    }
    if (body.data?.auth) {
      return body.data;
    }
  } catch (err) {
    console.log('pusherClient ~ auth:', err?.response?.data || err);
  }
  // Native SDK force-unwraps a missing auth object — always return a shape.
  return { auth: '' };
}

function bindAppState() {
  if (appStateSub) return;
  appStateSub = AppState.addEventListener('change', state => {
    if (state !== 'active') return;
    if (!didInit) return;
    const token = storage.getString(KEYS.ACCESS_TOKEN);
    if (!token) return;
    getClient()
      .connect()
      .catch(err => {
        console.log('pusherClient ~ reconnect:', err);
      });
  });
}

export function getPusher() {
  return didInit ? getClient() : null;
}

/**
 * Init + connect only when a Sanctum token exists.
 * Safe to call repeatedly; never touches native disconnect before init.
 */
export async function connectEcho() {
  const token = storage.getString(KEYS.ACCESS_TOKEN);
  if (!token) {
    return null;
  }

  if (connecting) {
    return connecting;
  }

  connecting = (async () => {
    try {
      const client = getClient();
      if (!didInit) {
        await client.init({
          apiKey: PUSHER_KEY,
          cluster: PUSHER_CLUSTER,
          useTLS: true,
          onAuthorizer,
          onError: (message, code, error) => {
            console.log('pusherClient ~ error:', message, code, error);
          },
          onConnectionStateChange: (current, previous) => {
            if (__DEV__) {
              console.log('pusherClient ~ state:', previous, '→', current);
            }
          },
        });
        didInit = true;
      }
      await client.connect();
      bindAppState();
      return client;
    } catch (err) {
      console.log('pusherClient ~ connect:', err);
      return null;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

/**
 * Only disconnect after a successful init. Calling disconnect() first is what
 * crashes iOS with: "Unexpectedly found nil while implicitly unwrapping".
 */
export async function disconnectEcho() {
  if (!didInit || !pusher) {
    return;
  }
  try {
    await pusher.disconnect();
  } catch (err) {
    console.log('pusherClient ~ disconnect:', err);
  }
}

export function subscribeChat(conversationId, { onMessage, onRead } = {}) {
  if (conversationId == null) {
    return () => {};
  }

  const channelName = `private-chat.${conversationId}`;
  let cancelled = false;
  let subscribed = false;

  const handleEvent = event => {
    if (cancelled) return;
    const name = eventNameOf(event);
    const payload = parseEventData(event?.data);

    if (__DEV__) {
      console.log('pusherClient ~ event', name, payload);
    }

    if (name === 'message.sent' || name.endsWith('message.sent')) {
      onMessage?.(payload?.message || payload);
      return;
    }
    if (name === 'conversation.read' || name.endsWith('conversation.read')) {
      onRead?.(payload);
    }
  };

  (async () => {
    const client = await connectEcho();
    if (!client || cancelled) return;
    try {
      await client.subscribe({
        channelName,
        onEvent: handleEvent,
        onSubscriptionError: (name, message) => {
          console.log('pusherClient ~ subscribe error:', name, message);
        },
      });
      subscribed = true;
      if (cancelled) {
        await client.unsubscribe({ channelName }).catch(() => {});
      }
    } catch (err) {
      console.log('pusherClient ~ subscribe:', err);
    }
  })();

  return () => {
    cancelled = true;
    if (!subscribed || !didInit || !pusher) return;
    pusher.unsubscribe({ channelName }).catch(() => {});
  };
}
