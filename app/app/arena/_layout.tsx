import { Stack } from 'expo-router';
import { Colors } from '../../src/constants';

export default function ArenaLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="circle-detail" />
      <Stack.Screen name="challenge-detail" />
      <Stack.Screen name="badges" />
    </Stack>
  );
}
