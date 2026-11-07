import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
//------
import RootStack from './src/navigation/RootStack';
import store from './src/redux/store/store';
import { queryClient, setUnauthorizedHandler } from './src/api/api';
import { handleLogout } from './src/redux/slices/appSlice';

/**
 * Stripe is initialised on demand with the server-provided key:
 * initStripe({ publishableKey: payment_sheet.publishable_key }) — no hardcoded key.
 */

export default function App() {
  useEffect(
    () => setUnauthorizedHandler(() => store.dispatch(handleLogout())),
    [],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <ReduxProvider store={store}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <RootStack />
          </QueryClientProvider>
        </SafeAreaProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}
