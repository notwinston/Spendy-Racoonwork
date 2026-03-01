import React, { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../src/constants';
import { useAuthStore } from '../src/stores/authStore';
import { useNotificationStore } from '../src/stores/notificationStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isLoading, initialize } = useAuthStore();
  const { preferences, scheduleMorningBrief } = useNotificationStore();

  const [fontsLoaded, fontError] = useFonts({
    Syne_700Bold,
    Syne_800ExtraBold,
    DMMono_400Regular,
    DMMono_500Medium,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    initialize();
  }, []);

  // Schedule morning brief notification after auth finishes loading
  useEffect(() => {
    if (!isLoading && preferences.hiddenCostAlerts) {
      scheduleMorningBrief().catch(console.warn);
    }
  }, [isLoading]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      {isLoading && (
        <LinearGradient
          colors={Colors.gradientMeshPrimary as unknown as [ColorValue, ColorValue, ...ColorValue[]]}
          locations={[0, 0.3, 0.7, 1]}
          style={styles.loading}
        >
          <ActivityIndicator size="large" color={Colors.accent} />
        </LinearGradient>
      )}
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
        <Stack.Screen
          name="wrapped"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    zIndex: 999,
  },
});
