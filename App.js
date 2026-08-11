import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
//------
import RootStack from './src/navigation/RootStack';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <SafeAreaProvider>
        <RootStack />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
