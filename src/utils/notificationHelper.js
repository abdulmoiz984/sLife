import { Platform } from 'react-native';
import { requestNotifications } from 'react-native-permissions';
import messagingNs, {
  AuthorizationStatus as ModularAuthStatus,
  getMessaging,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
import { storage } from '../api/api';
import { KEYS } from '../constants';
import {
  getStoredFcmToken,
  registerCurrentPushToken,
} from '../api/pushService';
import { navigate, navigateToChat, navigationRef } from '../navigation/NavigationService';
import {
  getActiveConversationId,
  invalidateChatQueries,
} from '../helpers/chatHelpers';
import {
  invalidateNotificationQueries,
  openNotificationDestination,
} from '../helpers/notificationHelpers';

const PUSH_CHANNEL_ID = 'default';
const AUTH_ROUTES = new Set([
  'SplashScreen',
  'OnboardingScreen',
  'LoginScreen',
  'SignupScreen',
  'ForgotPasswordScreen',
  'VerifyResetOtpScreen',
  'ResetPasswordScreen',
  'VerifyScreen',
  'ProfileSetupScreen',
]);
const AuthStatus =
  messagingNs?.AuthorizationStatus || ModularAuthStatus || {};

let messagingInstance;
let listenersBound = false;
let unsubscribers = [];

function fcm() {
  if (!messagingInstance) {
    messagingInstance =
      typeof messagingNs === 'function' ? messagingNs() : getMessaging();
  }
  return messagingInstance;
}

function persistToken(token) {
  if (!token) {
    return;
  }
  storage.set(KEYS.FCM_TOKEN, token);
}

async function syncTokenWithBackend() {
  if (!storage.getString(KEYS.ACCESS_TOKEN) || !getStoredFcmToken()) {
    return;
  }
  try {
    await registerCurrentPushToken();
  } catch (err) {
    console.log('notificationHelper ~ register device:', err?.response?.data || err);
  }
}

async function ensureDefaultChannel() {
  await notifee.createChannel({
    id: PUSH_CHANNEL_ID,
    name: 'SLife',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

async function requestOsPermission() {
  if (Platform.OS === 'android') {
    const { status } = await requestNotifications(['alert', 'sound', 'badge']);
    return status === 'granted' || status === 'limited';
  }

  const { status } = await requestNotifications(['alert', 'sound', 'badge']);
  if (status === 'granted' || status === 'limited') {
    return true;
  }

  const authStatus = await fcm().requestPermission();
  return (
    authStatus === AuthStatus.AUTHORIZED ||
    authStatus === AuthStatus.PROVISIONAL
  );
}

export async function requestNotificationPermission() {
  try {
    await requestOsPermission();
    await registerForNotifications();
  } catch (err) {
    console.log('notificationHelper ~ permission:', err);
  }
}

const registerForNotifications = async () => {
  try {
    await ensureDefaultChannel();
    await fcm().registerDeviceForRemoteMessages();
    const token = await fcm().getToken();
    console.log('notificationHelper ~ FCM token:', token);
    persistToken(token);
    await syncTokenWithBackend();
    return token;
  } catch (err) {
    console.log('notificationHelper ~ registerForNotifications:', err);
    return null;
  }
};

export { getStoredFcmToken };

function stringifyPushData(data = {}) {
  const out = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value == null) {
      return;
    }
    out[key] = typeof value === 'string' ? value : String(value);
  });
  return out;
}

export function queuePushData(data) {
  if (!data || typeof data !== 'object' || !Object.keys(data).length) {
    return;
  }
  storage.set(KEYS.PENDING_PUSH_DATA, JSON.stringify(stringifyPushData(data)));
  flushPendingPushRoute();
}

export function flushPendingPushRoute() {
  if (!navigationRef.isReady()) {
    return;
  }
  if (!storage.getString(KEYS.ACCESS_TOKEN)) {
    return;
  }

  const routeName = navigationRef.getCurrentRoute()?.name;
  if (!routeName || AUTH_ROUTES.has(routeName)) {
    return;
  }

  const raw = storage.getString(KEYS.PENDING_PUSH_DATA);
  if (!raw) {
    return;
  }

  storage.delete(KEYS.PENDING_PUSH_DATA);

  try {
    openPushRoute(JSON.parse(raw));
  } catch (err) {
    console.log('notificationHelper ~ pending route:', err);
  }
}

function openPushRoute(data = {}) {
  const type = data.type;
  const screen = data.screen;

  if (type) {
    invalidateNotificationQueries().catch(() => {});
  }

  if (type === 'chat_message') {
    const conversationId = data.conversation_id;
    invalidateChatQueries(conversationId).catch(() => {});
    navigateToChat({
      conversationId: conversationId
        ? Number(conversationId) || conversationId
        : undefined,
      userId: data.sender_id
        ? Number(data.sender_id) || data.sender_id
        : undefined,
    });
    return;
  }

  if (
    type === 'connection_request' ||
    type === 'connection_accept' ||
    type === 'connection_accepted' ||
    type === 'verification_approved' ||
    type === 'verification_rejected'
  ) {
    openNotificationDestination(data);
    return;
  }

  if (screen === 'home' || screen === 'HomeTab' || screen === 'MainTabs') {
    navigate('MainTabs', { screen: 'HomeTab' });
    return;
  }
  if (screen === 'notifications' || screen === 'NotificationsScreen') {
    navigate('NotificationsScreen');
    return;
  }
  if (screen === 'requests' || screen === 'RequestsScreen') {
    navigate('RequestsScreen');
    return;
  }
  if (screen === 'settings' || screen === 'SettingsScreen') {
    navigate('SettingsScreen');
    return;
  }

  if (type) {
    navigate('NotificationsScreen');
    return;
  }

  navigate('MainTabs', { screen: 'HomeTab' });
}

const receiveForegroundMessages = () => {
  return fcm().onMessage(async remoteMessage => {
    console.log('notificationHelper ~ foreground:', remoteMessage);
    handleForegroundNotification(remoteMessage);
  });
};

const receiveInitialNotificationMessages = () => {
  fcm()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage?.data) {
        queuePushData(remoteMessage.data);
      }
    })
    .catch(err => {
      console.log('notificationHelper ~ getInitialNotification:', err);
    });

  notifee.getInitialNotification().then(initial => {
    if (initial?.notification?.data) {
      queuePushData(initial.notification.data);
    }
  });
};

const receiveOpenedFromBackground = () => {
  return fcm().onNotificationOpenedApp(remoteMessage => {
    if (remoteMessage?.data) {
      queuePushData(remoteMessage.data);
    }
  });
};

const receiveNotifeePress = () => {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS && detail?.notification?.data) {
      queuePushData(detail.notification.data);
    }
  });
};

const receiveTokenRefresh = () => {
  return fcm().onTokenRefresh(token => {
    console.log('notificationHelper ~ token refresh:', token);
    persistToken(token);
    syncTokenWithBackend();
  });
};

export const notificationListener = () => {
  if (listenersBound) {
    return () => {};
  }
  listenersBound = true;

  unsubscribers = [
    receiveForegroundMessages(),
    receiveOpenedFromBackground(),
    receiveNotifeePress(),
    receiveTokenRefresh(),
  ].filter(Boolean);

  receiveInitialNotificationMessages();

  return () => {
    listenersBound = false;
    unsubscribers.forEach(unsub => {
      try {
        unsub?.();
      } catch (_) {
        /* noop */
      }
    });
    unsubscribers = [];
  };
};

const handleForegroundNotification = async remoteMsg => {
  try {
    const data = stringifyPushData(remoteMsg?.data || {});

    if (data.type === 'chat_message') {
      invalidateChatQueries(data.conversation_id).catch(() => {});
      if (
        getActiveConversationId() &&
        String(getActiveConversationId()) === String(data.conversation_id)
      ) {
        return;
      }
    }

    if (data.type) {
      invalidateNotificationQueries().catch(() => {});
    }

    await ensureDefaultChannel();

    const title =
      remoteMsg?.notification?.title || remoteMsg?.data?.title || 'SLife';
    const body = remoteMsg?.notification?.body || remoteMsg?.data?.body || '';
    const imageUrl =
      remoteMsg?.notification?.android?.imageUrl || remoteMsg?.data?.imageUrl;

    await notifee.displayNotification({
      title,
      body,
      data,
      android: {
        channelId: PUSH_CHANNEL_ID,
        pressAction: { id: 'default' },
        importance: AndroidImportance.HIGH,
        style: imageUrl
          ? {
              type: AndroidStyle.BIGPICTURE,
              picture: imageUrl,
            }
          : undefined,
      },
      ios: {
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
      },
    });
  } catch (err) {
    console.log('notificationHelper ~ foreground display:', err);
  }
};
