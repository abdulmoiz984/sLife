import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
//------
import {
  LoginScreen,
  SignupScreen,
  ForgotPasswordScreen,
  HomePlaceholder,
} from '../screens';
import { COLORS } from '../globalStyle/Theme';

const Stack = createNativeStackNavigator();

const stackScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  navigationBarColor: COLORS.mainBg,
};

const StackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={stackScreenOptions}
      initialRouteName="LoginScreen">
      <Stack.Screen
        name="LoginScreen"
        options={{ animation: 'fade' }}
        component={LoginScreen}
      />
      <Stack.Screen name="SignupScreen" component={SignupScreen} />
      <Stack.Screen
        name="ForgotPasswordScreen"
        options={{ animation: 'slide_from_bottom' }}
        component={ForgotPasswordScreen}
      />
      <Stack.Screen
        name="HomePlaceholder"
        options={{ animation: 'fade' }}
        component={HomePlaceholder}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;
