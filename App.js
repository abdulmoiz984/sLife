import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
//------
import RootStack from './src/navigation/RootStack';
import store from './src/redux/store/store';
import { queryClient } from './src/api/api';

export default function App() {
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
