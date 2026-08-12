import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import FlashMessage from 'react-native-flash-message';
//----
import StackNavigator from './StackNavigator';
import { COLORS } from '../globalStyle/Theme';
import { navigationRef } from './NavigationService';

const RootStack = () => {
  return (
    <NavigationContainer ref={navigationRef}>
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
