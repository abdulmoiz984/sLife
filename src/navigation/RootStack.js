import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import FlashMessage from 'react-native-flash-message';
import { useSelector } from 'react-redux';
//----
import StackNavigator from './StackNavigator';
import { COLORS } from '../globalStyle/Theme';
import { navigationRef } from './NavigationService';
import {
  flushPendingPushRoute,
  notificationListener,
  requestNotificationPermission,
} from '../utils/notificationHelper';
import { connectEcho, disconnectEcho } from '../helpers/echoClient';

const RootStack = () => {
  const isLogged = useSelector(s => s.app.isLogged);

  useEffect(() => {
    requestNotificationPermission();
    const unsubscribe = notificationListener();
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    if (!isLogged) {
      return undefined;
    }
    connectEcho();
    return () => {
      disconnectEcho();
    };
  }, [isLogged]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={flushPendingPushRoute}
      onStateChange={flushPendingPushRoute}
    >
      <StatusBar
        animated={true}
        backgroundColor={COLORS.background}
        barStyle="light-content"
      />
      <StackNavigator />
      {/* Last child so toasts float above all screens */}
      <FlashMessage
        position="top"
        floating
        animated
        hideOnPress
        duration={3200}
        animationDuration={280}
      />
    </NavigationContainer>
  );
};

export default RootStack;
