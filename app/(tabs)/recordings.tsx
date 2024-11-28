import { Text, View, StyleSheet } from "react-native";
import * as FileSystem from "expo-file-system";

let recordingNum : number = 0
let validRecordings : number[] = []

export default function RecordingsScreen() {

    InitRecordings() // Asynchronously initialize

    return (
        <View style={styles.container}>
        <Text style={styles.text}>Recordings screen</Text>
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
});

// Reads recording_state file
async function InitRecordings() {
    console.log("InitRecordings")

    // Read recordings_state file
    const FilePath = FileSystem.documentDirectory + "recording_state"
    await FileSystem.deleteAsync(FilePath)

    const FileInfo = await FileSystem.getInfoAsync(FilePath)
    if (!FileInfo.exists) {
        console.log("Creating file 'recording_state'")

        // Create file -> file format: values separated by commas: RecordingNum followed by list of valid recordings
        // Important: because of how strings are parsed, add comma when adding , before adding new element, not after
        await FileSystem.writeAsStringAsync(FilePath, "4,0,1,2,3")
    }

    const FileContents = await FileSystem.readAsStringAsync(FilePath)
    console.log("FileContents: ", FileContents)

    const FileContentsSplit = FileContents.split(",")
    FileContentsSplit.map((value, index) => {
        if (index == 0) {
            recordingNum = Number(value)
        } else {
            validRecordings.push(Number(value))
        }
    })

    console.log("recordingNum:", recordingNum)
    console.log("validRecordings:", validRecordings)
}
