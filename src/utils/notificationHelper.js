/* global globalThis */
import {Platform} from 'react-native';
import {openSettings, requestNotifications} from 'react-native-permissions';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidStyle} from '@notifee/react-native';
import {queryClient, storage} from '../api/api';
import {KEYS} from '../constants';

globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

function invalidatePassengerQueries() {
  queryClient.invalidateQueries({queryKey: ['activeBooking']});
  queryClient.invalidateQueries({queryKey: ['bookings']});
}

export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android') {
    const {status} = await requestNotifications([
      'alert',
      'sound',
      'badge',
      'carPlay',
    ]);
    if (status === 'granted') {
      await registerForNotifications();
    } else if (status === 'denied' || status === 'blocked') {
      openSettings();
    }
  }

  const authStatus = await messaging().requestPermission();
  if (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  ) {
    await registerForNotifications();
  }
};

export const notificationListener = () => {
  receiveBackgroundMessages();
  receiveInitialNotificationMessages();
  receiveForegroundMessages();
};

const registerForNotifications = async () => {
  try {
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    console.log(
      ' notificationHelper.js ~ registerForNotifications ~ token:',
      token,
    );

    if (token) {
      storage.set(KEYS.FCM_TOKEN, token);
    }
  } catch (err) {
    console.log(
      ' notificationHelper.js ~ registerForNotifications ~ err:',
      err,
    );
  }
};

export function getStoredFcmToken() {
  return storage.getString(KEYS.FCM_TOKEN) ?? null;
}

const receiveForegroundMessages = () => {
  messaging().onMessage(async remoteMessage => {
    console.log(
      ' notificationHelper.js ~ messaging ~ remoteMessage:',
      remoteMessage,
    );

    invalidatePassengerQueries();
    handleForegroundNotification(remoteMessage);
  });
};

const receiveInitialNotificationMessages = () => {
  messaging()
    .getInitialNotification()
    .then(async remoteMessage => {
      console.log(
        ' receiveInitialNotificationMessages ~ notification state quit:',
        remoteMessage,
      );
      if (remoteMessage) {
        invalidatePassengerQueries();
      }
    });
};

const receiveBackgroundMessages = () => {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
    invalidatePassengerQueries();
  });

  messaging().onNotificationOpenedApp(async remoteMessage => {
    console.log('notification state background: ', remoteMessage);
    invalidatePassengerQueries();
  });
};

const handleForegroundNotification = async remoteMsg => {
  try {
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });
    await notifee.requestPermission();

    const title = remoteMsg?.notification?.title;
    const body = remoteMsg?.notification?.body;
    const imageUrl =
      remoteMsg?.notification?.android?.imageUrl || remoteMsg?.data?.imageUrl;

    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId,
        pressAction: {id: 'default'},
        style: imageUrl
          ? {
              type: AndroidStyle.BIGPICTURE,
              picture: imageUrl,
            }
          : undefined,
      },
    });

    console.log('NOTI DONE');
  } catch (err) {
    console.log(
      ' notificationHelper.js ~ handleForegroundNotification ~ err:',
      err,
    );
  }
};
