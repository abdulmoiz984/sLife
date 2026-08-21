import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { StripeProvider } from '@stripe/stripe-react-native';
//------
import RootStack from './src/navigation/RootStack';
import store from './src/redux/store/store';
import { queryClient, setUnauthorizedHandler } from './src/api/api';
import { handleLogout } from './src/redux/slices/appSlice';

/**
 * Publishable key is set per checkout via initStripe(payment_sheet.publishable_key).
 * StripeProvider still needs a non-empty placeholder for useStripe().
 */
const STRIPE_PLACEHOLDER_KEY = 'pk_test_51TizEgQiZTNXX69SBZGoErbRSDcLIToVjDMxC3m5dqOJLzN77Ny0kslNVM79xj11q9E3NlPOFZggSjM1GTKkjUci00wgUH6zT6';

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
            <StripeProvider
              publishableKey={STRIPE_PLACEHOLDER_KEY}
              urlScheme="slife">
              <RootStack />
            </StripeProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}
