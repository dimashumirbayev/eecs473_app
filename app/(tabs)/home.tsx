import { Text, View, StyleSheet, Alert, ScrollView, TouchableOpacity } from "react-native";
import { useState, useContext } from 'react';
import { RecordingContext } from "@/components/RecordingManager"

export default function HomeScreen() {

    const { startRecording, stopRecording, writeDataLine } = useContext(RecordingContext)
    const [isRecording, setIsRecording] = useState(false);
    const [mode, setMode] = useState("Squat")

    return (
        <ScrollView style={styles.scrollcontainer}>
            <View style={styles.modebuttonscontainer}>
                <TouchableOpacity
                    style={ (mode=="Squat")? styles.squatbuttonselected : styles.squatbuttonunselected}
                    onPress={() => {
                        setMode("Squat")
                    }}
                >
                    <Text style={styles.modetext}> Squat </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={ (mode=="Deadlift")? styles.deadliftbuttonselected : styles.deadliftbuttonunselected}
                    onPress={() => {
                        setMode("Deadlift")
                    }}
                >
                    <Text style={styles.modetext}> Deadlift </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.recordbutton}
                onPress={() => {
                    if (isRecording) {
                        stopRecording(mode)
                        Alert.alert(
                            "Recording Saved", '',
                            [{
                                    text: "OK",
                                    onPress: () => {}
                                }],
                            { cancelable: false }
                        );
                    } else {
                        startRecording()
                    }
                    setIsRecording(!isRecording)
                }}
            >
                <Text style={styles.recordtext}> { isRecording ? "Stop Recording" : "Start Recording" } </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollcontainer: {
        backgroundColor: '#25292e',
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: 'blue',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#fff',
    },
    modebuttonscontainer: {
        flex: 1,
        flexDirection: 'row',
        marginLeft: 10,
        marginRight: 10,
        marginTop: 15,
        height: 68,
        backgroundColor: 'gray',
        borderRadius: 20,
        alignItems: 'center',
    },
    squatbuttonselected: {
        left: 10,
        backgroundColor: '#93d0db',
        height: '80%',
        borderRadius: 15,
        marginRight: 5,
        alignItems: 'center',
        justifyContent: 'center',
        width: '46%',
    },
    squatbuttonunselected: {
        left: 10,
        backgroundColor: 'gray',
        height: '80%',
        borderRadius: 15,
        marginRight: 5,
        alignItems: 'center',
        justifyContent: 'center',
        width: '46%',
    },
    deadliftbuttonselected: {
        position: 'relative',
        right: -13,
        backgroundColor: '#93d0db',
        height: '80%',
        borderRadius: 15,
        marginLeft: 5,
        alignItems: 'center',
        justifyContent: 'center',
        width: '46%',
    },
    deadliftbuttonunselected: {
        position: 'relative',
        right: -13,
        backgroundColor: 'gray',
        height: '80%',
        borderRadius: 15,
        marginLeft: 5,
        alignItems: 'center',
        justifyContent: 'center',
        width: '46%',
    },
    modetext: {
        color: 'white',
        fontSize: 20,
    },
    recordbutton: {
        backgroundColor: 'gray',
        height: 68,
        borderRadius: 20,
        marginTop: 15,
        marginLeft: 10,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    recordtext: {
        color: 'white',
        fontSize: 20,
    }
});
