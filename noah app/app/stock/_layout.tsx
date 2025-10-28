
import { Stack } from 'expo-router';
import React from 'react';

export default function StockLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    />
  );
}
