import { Text, View, StyleSheet, Switch } from "react-native";
import * as FileSystem from "expo-file-system";
import { Mutex } from "async-mutex";
import { useState } from "react";

let mutex = new Mutex();
let initialized = false

// Used for initialization ONLY
let o = false
let a = false

export default function SettingsScreen() {

    const [orientationVar, setOrientationVar] = useState(o)
    const [autoDeleteVar, setAutoDeleteVar] = useState(a)

    // setOrientationVar(o)

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
            <Text style={styles.text}>Settings screen</Text>
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
    switchContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 10,
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
        getOrientation()
        getAutoDelete()
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
        console.log("set auto_delete = ", String(val))
    }

    mutex.release()
}

// Only needs to be called during stopRecording()
async function getAutoDelete() : Promise<boolean> {
    await SettingsInit()
    await mutex.acquire()

    const FilePath = FileSystem.documentDirectory + "settings/auto_delete"
    const val = await FileSystem.readAsStringAsync(FilePath)
    a = Boolean(val == "true")

    mutex.release()
    return Boolean(val)
}

async function setOrientation(val : string) {
    await SettingsInit()
    await mutex.acquire()

    const FilePath = FileSystem.documentDirectory + "settings/orientation"
    const FileStatus = await FileSystem.getInfoAsync(FilePath)
    if (FileStatus.exists) {
        await FileSystem.writeAsStringAsync(FilePath, String(val))
        console.log("set orientation = ", String(val))
    }

    mutex.release()
}

// Only needs to be called during startup
async function getOrientation() : Promise<string> {
    await SettingsInit()
    await mutex.acquire()

    const FilePath = FileSystem.documentDirectory + "settings/orientation"
    const val = await FileSystem.readAsStringAsync(FilePath)
    o = Boolean(val == "right")

    mutex.release()
    return val
}