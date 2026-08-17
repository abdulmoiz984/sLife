/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import '@react-native-firebase/app';
import messagingNs, {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

const messaging =
  typeof messagingNs === 'function' ? messagingNs() : getMessaging();

if (typeof messaging.setBackgroundMessageHandler === 'function') {
  messaging.setBackgroundMessageHandler(async remoteMessage => {
    console.log('FCM background:', remoteMessage);
  });
} else {
  setBackgroundMessageHandler(messaging, async remoteMessage => {
    console.log('FCM background:', remoteMessage);
  });
}

notifee.onBackgroundEvent(async ({ type }) => {
  if (type !== EventType.PRESS) {
    return;
  }
});

AppRegistry.registerComponent(appName, () => App);
