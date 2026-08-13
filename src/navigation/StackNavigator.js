import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  LoginScreen,
  SignupScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
  SplashScreen,
  OnboardingScreen,
  VerifyScreen,
  ProfileSetupScreen,
  FiltersScreen,
  RequestsScreen,
  ChatScreen,
  NotificationsScreen,
  SettingsScreen,
  SubscriptionScreen,
  ProfileScreen,
  ProfileDetailsScreen,
  EducationsScreen,
} from '../screens';
import TabNavigator from './TabNavigator';
import { COLORS } from '../globalStyle/Theme';

const Stack = createNativeStackNavigator();

const stackScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  navigationBarColor: COLORS.background,
  contentStyle: { backgroundColor: COLORS.background },
};

const StackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions} initialRouteName="SplashScreen">
      <Stack.Screen name="SplashScreen" options={{ animation: 'fade' }} component={SplashScreen} />
      <Stack.Screen name="OnboardingScreen" options={{ animation: 'fade' }} component={OnboardingScreen} />
      <Stack.Screen name="LoginScreen" options={{ animation: 'fade' }} component={LoginScreen} />
      <Stack.Screen name="SignupScreen" component={SignupScreen} />
      <Stack.Screen
        name="ForgotPasswordScreen"
        options={{ animation: 'slide_from_bottom' }}
        component={ForgotPasswordScreen}
      />
      <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
      <Stack.Screen name="VerifyScreen" component={VerifyScreen} />
      <Stack.Screen name="ProfileSetupScreen" component={ProfileSetupScreen} />
      <Stack.Screen name="MainTabs" options={{ animation: 'fade' }} component={TabNavigator} />
      <Stack.Screen
        name="FiltersScreen"
        options={{ animation: 'slide_from_bottom', presentation: 'transparentModal' }}
        component={FiltersScreen}
      />
      <Stack.Screen name="RequestsScreen" component={RequestsScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="ProfileDetailsScreen" component={ProfileDetailsScreen} />
      <Stack.Screen name="EducationsScreen" component={EducationsScreen} />
    </Stack.Navigator>
  );
};

export default StackNavigator;
