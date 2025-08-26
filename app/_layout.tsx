import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#000000",
        },
        headerTintColor: "#ffffff",
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="routine/[id]" />
    </Stack>
  );
}
