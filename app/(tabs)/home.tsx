import { Text, View, StyleSheet, Alert, ScrollView } from "react-native";
import { useState, useContext } from 'react';
import Button from "@/components/Button"
import { RecordingContext } from "@/components/RecordingManager"

export default function HomeScreen() {

    const { startRecording, stopRecording, writeDataLine } = useContext(RecordingContext)
    const [isRecording, setIsRecording] = useState(false);

    return (
        <View style={styles.container}>
            <View>
                <Button
                    label = {isRecording? "End Recording" : "Start Recording"}
                    onPress = {() => {
                        if (isRecording) {
                            stopRecording("Squat")
                            alert("Recording Saved")
                        } else {
                            startRecording()
                        }
                        setIsRecording(!isRecording)
                    }}
                />
            </View>
            <View>
                <Button
                    label = {"write some data"}
                    onPress = {() => {
                        writeDataLine("hello im some data")
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
