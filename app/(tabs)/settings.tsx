import { Text, View, StyleSheet, Switch, Alert, Linking, Pressable } from "react-native";
import * as FileSystem from "expo-file-system";
import { Mutex } from "async-mutex";
import { useState, useContext } from "react";
import Button from "@/components/Button"
import { RecordingContext } from "@/components/RecordingManager"

let mutex = new Mutex();
let initialized = false

// Used for initialization ONLY
let o = false
let a = false

export default function SettingsScreen() {

    const [orientationVar, setOrientationVar] = useState(o)
    const [autoDeleteVar, setAutoDeleteVar] = useState(a)

    const { deleteAllFiles } = useContext(RecordingContext)

    return (
        <View style = {styles.container}>
            <View style = {styles.switchContainer}>
                <Text style = {styles.text} > Orientation </Text>
                <Switch
                    value = {orientationVar}
                    onValueChange = {() => {
                        const direction = orientationVar ? "left" : "right"
                        setOrientationVar(!orientationVar)
                        setOrientation(direction)
                        setOrientationVar(!orientationVar)
                    }}>
                </Switch>
            </View>
            <View style = {styles.switchContainer}>
                <Text style = {styles.text} > Auto Delete Recordings </Text>
                <Switch
                    value = {autoDeleteVar}
                    onValueChange = {() => {
                        setAutoDelete(!autoDeleteVar)
                        setAutoDeleteVar(!autoDeleteVar)
                    }}>
                </Switch>
            </View>
            <View style={styles.DeleteButton}>
                <Button
                    label = {"Delete All Recordings"}
                    onPress = {() => {
                        Alert.alert(
                            "Are you sure?",
                            "Press OK to delete all recordings",
                            [
                              {
                                text: "Cancel",
                                style: "cancel"
                              },
                              {
                                text: "OK",
                                onPress: () => deleteAllFiles(),
                              }
                            ],
                            { cancelable: false }
                        );
                    }}
                />
            </View>
            <View style={styles.AboutBox}>
                <Text style = {styles.text} > App Info </Text>
                <Text style = {styles.text} > </Text>
                <Text style = {styles.text} > Precision Posture v1.0 </Text>
                <Text style = {styles.text} > react-native: 0.76.3 </Text>
                <Text style = {styles.text} > SDK 52.0 </Text>
                <Text style = {styles.text} > </Text>
            </View>
            <View style={styles.reportBugContainer}>
                <Pressable
                    style = {styles.reportBugButton}
                    onPress = {() => {
                        const url = "https://github.com/dimashumirbayev/eecs473_app/issues"
                        Linking.openURL(url)
                        console.log("button pressed")
                    }}
                >
                    <Text style = {styles.reportBugLabel}> Report a Bug </Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#25292e',
        padding: 10,
    },
    text: {
        // color: '#fff',
        fontSize: 18,
        // fontWeight: 'bold',
    },
    switchContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        margin: 5,
        padding: 10,
        backgroundColor: '#93d0db',
        borderRadius: 20,
    },
    DeleteContainer: {

    },
    DeleteButton: {

    },
    DeleteLabel: {

    },
    DeleteButton: {
        backgroundColor: 'red',
        borderRadius: 20,
        margin: 5,
        padding: 10,
    },
    AboutBox: {
        backgroundColor: '#93d0db',
        borderRadius: 20,
        margin: 5,
        padding: 10,
        alignItems: 'center',
    },
    reportBugContainer: {
        height: 68,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
    },
    reportBugButton: {
        borderRadius: 10,
        width: '50%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    reportBugLabel: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export async function SettingsInit() {
    await mutex.acquire()

    if (!initialized) {
        console.log("SettingsInit")

        // Create /settings
        const SettingsDir = FileSystem.documentDirectory + "settings/"
        const DirStatus = await FileSystem.getInfoAsync(SettingsDir)
        if (!DirStatus.exists) {
            console.log(SettingsDir)
            await FileSystem.makeDirectoryAsync(SettingsDir)
        }

        // Create /settings/auto_delete
        const AutoDeletePath = SettingsDir + "auto_delete"
        const AutoDeleteStatus = await FileSystem.getInfoAsync(AutoDeletePath)
        if (!AutoDeleteStatus.exists) {
            console.log("Creating file /settings/auto_delete")
            FileSystem.writeAsStringAsync(AutoDeletePath, "false")
        } else {
            console.log("file /settings/auto_delete exists")
        }

        // Create /settings/orientation
        const OrientationPath = SettingsDir + "orientation"
        const OrientationStatus = await FileSystem.getInfoAsync(OrientationPath)
        if (!OrientationStatus.exists) {
            console.log("Creating file /settings/orientation")
            FileSystem.writeAsStringAsync(OrientationPath, "left")
        } else {
            console.log("file /settings/orientation exists")
        }

        initialized = true
        getOrientationFile()
        getAutoDeleteFile()
    }

    mutex.release()
}

async function setAutoDelete(val : boolean) {
    await SettingsInit()
    await mutex.acquire()

    const FilePath = FileSystem.documentDirectory + "settings/auto_delete"
    const FileStatus = await FileSystem.getInfoAsync(FilePath)
    if (FileStatus.exists) {
        await FileSystem.writeAsStringAsync(FilePath, String(val))
        console.log("set auto_delete =", String(val))
    }
    a = val

    mutex.release()
}

// Only needs to be called during stopRecording()
export async function getAutoDelete() : Promise<boolean> {
    await SettingsInit()
    await mutex.acquire()

    const val = a
    mutex.release()
    return val
}

async function setOrientation(val : string) {
    await SettingsInit()
    await mutex.acquire()

    const FilePath = FileSystem.documentDirectory + "settings/orientation"
    const FileStatus = await FileSystem.getInfoAsync(FilePath)
    if (FileStatus.exists) {
        await FileSystem.writeAsStringAsync(FilePath, String(val))
        console.log("set orientation =", String(val))
    }
    o = (val == "right")

    mutex.release()
}

// Only needs to be called during startup
export async function getOrientation() : Promise<string> {
    await SettingsInit()
    await mutex.acquire()

    const val = o ? "right" : "left"
    mutex.release()
    return val
}

// Reads the file and stores value in var a
async function getAutoDeleteFile() {
    await SettingsInit()
    await mutex.acquire()

    const FilePath = FileSystem.documentDirectory + "settings/auto_delete"
    const val = await FileSystem.readAsStringAsync(FilePath)
    a = Boolean(val == "true")
    console.log("a =", a)

    mutex.release()
}

// Reads the file and stores value in var o
async function getOrientationFile() {
    await SettingsInit()
    await mutex.acquire()

    const FilePath = FileSystem.documentDirectory + "settings/orientation"
    const val = await FileSystem.readAsStringAsync(FilePath)
    o = Boolean(val == "right")
    console.log("o =", o)

    mutex.release()
}