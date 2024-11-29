import { Text, View, StyleSheet, } from "react-native";
import { Link } from "expo-router";
import { Image } from "expo-image"
import { useContext } from "react";
import { RecordingContext } from "@/components/RecordingManager"

const PlaceholderImage = require("../../assets/images/background-image.png")

export default function IndexScreen() {

  const {recordings, InitRecordings, deleteFile, deleteAllFiles, renameFile } = useContext(RecordingContext)

  InitRecordings();

  return (
    <View style={styles.container}>
      <Image source={PlaceholderImage} style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
  button: {
    fontSize: 20,
    textDecorationLine: "underline",
    color: "#fff",
  },
  image: {
    width: 320,
    height: 440,
    borderRadius: 18,
  }
});