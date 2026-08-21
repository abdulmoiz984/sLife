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
import { bindSubscriptionForegroundRefresh } from '../helpers/subscriptionHelpers';
import { useSubscriptionMe } from '../hooks/useSubscriptionMe';
import { queryClient } from '../api/api';
import { CHATS_QUERY_KEY } from '../helpers/chatHelpers';

const RootStack = () => {
  const isLogged = useSelector(s => s.app.isLogged);
  const { isSubscribed } = useSubscriptionMe();

  useEffect(() => {
    requestNotificationPermission();
    const unsubscribe = notificationListener();
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    if (!isLogged || !isSubscribed) {
      disconnectEcho();
      queryClient.removeQueries({ queryKey: CHATS_QUERY_KEY });
      return undefined;
    }
    connectEcho();
    const unbindSub = bindSubscriptionForegroundRefresh();
    return () => {
      disconnectEcho();
      unbindSub?.();
    };
  }, [isLogged, isSubscribed]);

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
