import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
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
    </NavigationContainer>
  );
};

export default RootStack;
