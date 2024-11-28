import { Stack } from "expo-router";
import {LogBox} from "react-native";

LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  return (
  <Stack> // Stack screen means it can be overlaid on something
    <Stack.Screen
      name="(tabs)"
      options={{
        headerShown: false,
      }}/>
  </Stack>
  )
}
