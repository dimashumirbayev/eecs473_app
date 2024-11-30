import { Text, View, StyleSheet, } from "react-native";
import { Link } from "expo-router";
import { Image } from "expo-image"
import { useContext } from "react";
import { RecordingContext } from "@/components/RecordingManager"
import { SettingsInit} from "./settings"

export default function IndexScreen() {

  const { RecordingsInit } = useContext(RecordingContext)

  SettingsInit()
  RecordingsInit();

  return (
    <View>
    </View>
  );
}
