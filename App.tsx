import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/database';

export default function App() {
  useEffect(() => {
    // Initialize database on application startup
    initDatabase().then((success) => {
      if (success) {
        console.log('[App Startup] Database initialized successfully.');
      } else {
        console.error('[App Startup] Database initialization failed.');
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
