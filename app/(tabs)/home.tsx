import { Text, View, StyleSheet, Alert } from "react-native";
import { useState, useContext } from 'react';
import Button from "@/components/Button"
import { printFile, startRecording, stopRecording, deleteAllFiles } from "./recordings";
import { RecordingContext } from "@/components/RecordingManager"

// Recording data
let data : string[] = [];

export default function HomeScreen() {

    const {recordingNum, validRecordings, startRecordingFunc } = useContext(RecordingContext)

    const [isRecording, setIsRecording] = useState(false);

    return (
        <View style={styles.container}>
            <View>
                <Text style={styles.text}>Home screen</Text>
            </View>
            <View>
                <Button
                    label = {isRecording? "End Recording" : "Start Recording"}
                    onPress = {() => {
                        if (isRecording) {
                            console.log("End Recording Button Pressed")
                            stopRecording(data)
                            alert("Recording Saved")
                        } else {
                            console.log("Start Recording Button Pressed")
                            // startRecording()
                            startRecordingFunc()
                        }
                        setIsRecording(!isRecording)
                    }}
                />
                <Button
                    label = {"Delete All Recordings"}
                    onPress = {() => {
                        printFile(2)
                        deleteAllFiles()
                    }}
                />
            </View>
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
