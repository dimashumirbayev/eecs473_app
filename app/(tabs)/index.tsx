import { Text, View, StyleSheet, Alert, ScrollView, TouchableOpacity } from "react-native";
import { useState, useContext, useEffect, useRef } from 'react';
import { RecordingContext } from "@/components/RecordingManager"
import { Ionicons } from "@expo/vector-icons";
import useBLE from "@/components/BLEstuff";
import { SettingsInit } from "./settings";
import { DataViewer } from "@/components/DataViewer";

export default function HomeScreen() {

    const { startRecording, stopRecording, writeDataLine, RecordingsInit } = useContext(RecordingContext)
    const [isRecording, setIsRecording] = useState(false);
    const [mode, setMode] = useState("Squat")
    const { connectedDevice, requestPermissions, scanForPeripherals, allDevices, connectToDevice, data, updata } = useBLE()
    //const [dataString, setDataString] = useState("0.00 0.00 0.00 0.00 0.00 0.00 0.00 0.00")
    const dataRef = useRef("0.00 0.00 0.00 0.00 0.00 0.00 0.00 0.00")

    SettingsInit()
    RecordingsInit()

    const scanForDevices = async () => {
        const isPermissionsEnabled = await requestPermissions();
        if (isPermissionsEnabled) {
            await scanForPeripherals();
        }
    }
    async function connectFunc() {
        if (connectedDevice == null) {
            await scanForDevices()
            if (allDevices.length > 0) {
                await connectToDevice(allDevices[0])
            }
        }
    }
    //connectFunc()

    useEffect(() => {
        connectFunc()
    }, [allDevices]);

    useEffect(() => {
        writeDataLine(data)
    }, [updata]);

    return (
        <ScrollView style={styles.scrollcontainer}>
            <View style={styles.connectingcontainer}>
                <Ionicons
                    style = {{ marginRight: 2 }}
                    name = { connectedDevice == null ? "sad-outline" : "happy-outline" }
                    size = {30}
                    color = { connectedDevice == null ? "#d12e17" : "#1EB1FC" }
                />
                <Text style={styles.modetext}> {connectedDevice == null ? "Connecting ..." : "Connected" } </Text>
            </View>
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
            <View style={styles.DataViewerContainer}>
                <DataViewer dataString = {data}>
                </DataViewer>
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
              <Ionicons
                  style = {{
                      marginLeft: 15,
                  }}
                  name = { isRecording? "pause" : "play" }
                  size = {27}
                  color = "#1EB1FC"
              />
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
    connectingcontainer: {
        flex: 1,
        flexDirection: 'row',
        marginLeft: 10,
        marginRight: 10,
        marginTop: 15,
        height: 68,
        backgroundColor: 'gray',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
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
        backgroundColor: '#1EB1FC',
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
        backgroundColor: '#1EB1FC',
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
    },
    DataViewerContainer: {
        backgroundColor: 'white',
        margin: 10,
        height: 400,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        zIndex: 1,
    },
});
