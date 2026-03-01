import { Stack } from 'expo-router';
import { Colors } from '../../src/constants';

export default function PlanLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="savings-goal" />
      <Stack.Screen name="budget-editor" />
    </Stack>
  );
}
