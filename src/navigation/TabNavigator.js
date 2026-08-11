import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS, getFontStyle } from '../globalStyle/Theme';
import { Icon } from '../components/slife';
import HomeScreen from '../screens/Home/HomeScreen';
import DiscoverScreen from '../screens/Discover/DiscoverScreen';
import ConnectionsScreen from '../screens/Network/ConnectionsScreen';
import MessagesScreen from '../screens/Messages/MessagesScreen';
import MeScreen from '../screens/Profile/MeScreen';

const Tab = createBottomTabNavigator();

const tabIcon = (name) => {
  const Map = {
    HomeTab: Icon.Home,
    DiscoverTab: Icon.Search,
    NetworkTab: Icon.Users,
    MessagesTab: Icon.Message,
    ProfileTab: Icon.User,
  };
  return Map[name];
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.mute,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
        tabBarIcon: ({ color }) => {
          const Ico = tabIcon(route.name);
          return Ico ? <Ico size={24} color={color} /> : null;
        },
      })}>
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="DiscoverTab" component={DiscoverScreen} options={{ tabBarLabel: 'Discover' }} />
      <Tab.Screen name="NetworkTab" component={ConnectionsScreen} options={{ tabBarLabel: 'Network' }} />
      <Tab.Screen name="MessagesTab" component={MessagesScreen} options={{ tabBarLabel: 'Messages' }} />
      <Tab.Screen name="ProfileTab" component={MeScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default TabNavigator;

const styles = StyleSheet.create({
  bar: {
    backgroundColor: COLORS.background,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 72,
    paddingTop: 8,
    paddingBottom: 16,
  },
  label: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    ...getFontStyle('interSemiBold600'),
  },
});
