import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '../src/constants';
import { useAuthStore } from '../src/stores/authStore';

export default function RootLayout() {
  const { isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="budget-detail"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="transaction-review"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="arena"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="plan"
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
