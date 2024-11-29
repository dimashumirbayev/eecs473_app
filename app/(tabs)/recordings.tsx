import { Text, View, StyleSheet } from "react-native";
import * as FileSystem from "expo-file-system";
import { useState, useContext } from "react";
import { RecordingContext } from "@/components/RecordingManager"

export default function RecordingsScreen() {

    const {recordings, RecordingsInit, deleteFile, renameFile } = useContext(RecordingContext)

    return (
        <View style={styles.container}>
            if (updated) {
                recordings.map((recording) => {
                    return (
                        <View>
                            <Text style={styles.text}> a recording here </Text>
                        </View>
                    )
                })
            }
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  text: {
    color: '#fff',
  },
});
