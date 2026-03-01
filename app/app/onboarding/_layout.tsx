import { Stack } from 'expo-router';
import { Colors } from '../../src/constants';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="connect-calendar" />
      <Stack.Screen name="connect-bank" />
      <Stack.Screen name="set-budget" />
    </Stack>
  );
}
