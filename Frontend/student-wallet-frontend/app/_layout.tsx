import { useEffect } from 'react';
import "../global.css";
import '@expo/metro-runtime';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from './_services/db';

export default function RootLayout() {
  useEffect(() => {
    initDatabase()
      .then(() => console.log('[DB] Local SQLite Database initialized successfully.'))
      .catch((err) => console.error('[DB] Failed to initialize SQLite database:', err));
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}