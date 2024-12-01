import { Stack } from "expo-router";
import {LogBox} from "react-native";
import { RecordingProvider } from "@/components/RecordingManager"

// LogBox.ignoreAllLogs(true)

export default function RootLayout() {
  return (
  <RecordingProvider>
    <Stack> // Stack screen means it can be overlaid on something
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}/>
    </Stack>
  </RecordingProvider>
  )
}
