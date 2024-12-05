import { Text, View, StyleSheet, Switch, Alert, Linking, ScrollView, TouchableOpacity, Modal } from "react-native";
import * as FileSystem from "expo-file-system";
import { Mutex } from "async-mutex";
import { useState, useContext, useEffect } from "react";
import { RecordingContext } from "@/components/RecordingManager"
import { DataViewer, get_global_angles } from "@/components/DataViewer";
import { get_global_data } from "./index";

let mutex = new Mutex();
let initialized = false

// Used for initialization ONLY
let o = false // orientation
let a = false // auto-delete
let i = false // show icons

// Calibration
let calib : number[] = [0, 0, 0, 0, 0, 0, 0]
let timer : number = 10
let timer_started : boolean = false

export default function SettingsScreen() {

    const [reloadCount, setReloadCount] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
        setReloadCount((prevCount) => prevCount + 1); // Increment to simulate reloading
    }, 100); // Reload every 100 ms
        return () => clearInterval(interval);
    }, []);

    if (timer_started) {
        timer -= 0.1
    }
    if (timer <= -1) {
        setCalib(get_global_angles())
        timer = 10
        timer_started = false
    }

    const [orientationVar, setOrientationVar] = useState(o)
    const [autoDeleteVar, setAutoDeleteVar] = useState(a)
    const [showIconsVar, setShowIconsVar] = useState(i)
    const [calibModalVisible, setCalibModalVisible] = useState(false)

    const { deleteAllFiles } = useContext(RecordingContext)

    return (
        <ScrollView style = {styles.container}>
            <Modal visible={calibModalVisible} animationType="slide">
                <View style={styles.calibheader}>
                    <Text style={styles.calibheadertext}> Device Calibration </Text>
                </View>
                <ScrollView style={styles.calibcontainer}>
                    <View style={styles.calibinstructioncontainer}>
                        <Text style={{marginTop: 10, fontSize: 22, color: 'white'}}> Instructions </Text>
                        <Text style={{marginTop: 10, marginLeft: 10, marginRight: 10, fontSize: 18, color: 'white'}}>
                            Calibrate the device by standing in backsquat position with a barbell.
                            To achieve best results, calibrate the device before each workout.
                        </Text>
                    </View>
                    <View style={styles.DataViewerContainer}>
                        <DataViewer dataString = {get_global_data()} source = {"settings"} mode={"Settings"}>
                        </DataViewer>
                    </View>
                    <TouchableOpacity
                        style = {{
                            backgroundColor: (timer_started && timer < 0) ? 'red' : '#1EB1FC',
                            borderRadius: 20,
                            marginLeft: 10,
                            marginRight: 10,
                            marginBottom: 10,
                            height: 68,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                        onPress = {() => {
                            if (!timer_started) {
                                timer_started = true
                            }
                        }}
                    >
                        <Text style={{color: 'white', fontSize: 18}}>
                            { timer_started ?
                                timer < 0? "Calibrating" : "Calibration in " + String(Math.ceil(timer)) + " sec"
                                : "Start Calibration"
                            }
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style = {styles.calibexitbutton}
                        onPress = {() => {
                            setCalibModalVisible(false)
                        }}
                    >
                        <Text style={{color: 'white', fontSize: 18}}> Exit </Text>
                    </TouchableOpacity>
                </ScrollView>
            </Modal>
            <View style = {styles.switchContainer}>
                <Text style = {styles.text} > Orientation </Text>
                <Switch
                    value = {orientationVar}
                    onValueChange = {() => {
                        const direction = orientationVar ? "left" : "right"
                        setOrientationVar(!orientationVar)
                        setOrientation(direction)
                    }}>
                </Switch>
            </View>
            <View style = {styles.switchContainer}>
                <Text style = {styles.text} > Show Icons </Text>
                <Switch
                    value = {showIconsVar}
                    onValueChange = {() => {
                        setShowIcons(!showIconsVar)
                        setShowIconsVar(!showIconsVar)
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
            <View style={styles.CalibContainer}>
                <TouchableOpacity
                    style = {styles.DeleteButton}
                    onPress = {() => {
                        setCalibModalVisible(true)
                    }}
                >
                    <Text style = {{fontSize: 18,}}> Calibrate Device </Text>
                </TouchableOpacity>
            </View>
            <View style={styles.DeleteContainer}>
                <TouchableOpacity
                    style = {styles.DeleteButton}
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
                >
                    <Text style = {styles.DeleteLabel}> Delete All Recordings </Text>
                </TouchableOpacity>
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
                <TouchableOpacity
                    style = {styles.reportBugButton}
                    onPress = {() => {
                        const url = "https://github.com/dimashumirbayev/eecs473_app/issues"
                        Linking.openURL(url)
                        console.log("button pressed")
                    }}
                >
                    <Text style = {styles.reportBugLabel}> Report a Bug </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#25292e',
        padding: 10,
    },
    text: {
        fontSize: 18,
    },
    switchContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        margin: 5,
        padding: 10,
        backgroundColor: '#1EB1FC',
        borderRadius: 20,
    },
    DeleteContainer: {
        backgroundColor: 'red',
        borderRadius: 20,
        height: 68,
        margin: 5,
        padding: 10,
    },
    CalibContainer: {
        backgroundColor: '#1EB1FC',
        borderRadius: 20,
        height: 68,
        margin: 5,
        padding: 10,
    },
    DeleteButton: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    DeleteLabel: {
        color: '#fff',
        fontSize: 18,
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
    },
    calibheader: {
        backgroundColor: 'white',
        height: 92,
        alignItems: 'center',
    },
    calibheadertext: {
        fontSize: 24,
        position: 'absolute',
        top: 50,
    },
    calibcontainer: {
        flex: 1,
        backgroundColor: '#25292e',
    },
    calibexitbutton: {
        backgroundColor: 'gray',
        borderRadius: 20,
        marginLeft: 10,
        marginRight: 10,
        marginBottom: 10,
        height: 68,
        justifyContent: 'center',
        alignItems: 'center',
    },
    calibcalibbutton: {
        backgroundColor: '#1EB1FC',
        borderRadius: 20,
        marginLeft: 10,
        marginRight: 10,
        marginBottom: 10,
        height: 68,
        justifyContent: 'center',
        alignItems: 'center',
    },
    calibinstructioncontainer: {
        backgroundColor: 'gray',
        borderRadius: 20,
        marginLeft: 10,
        marginRight: 10,
        marginTop: 10,
        height: 150,
        alignItems: 'center',
    },
    DataViewerContainer: {
        backgroundColor: '#FFFFF0',
        margin: 10,
        height: 400,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
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

        // Create /settings/icons
        const IconPath = SettingsDir + "icon"
        const IconStatus = await FileSystem.getInfoAsync(IconPath)
        if (!IconStatus.exists) {
            console.log("Creating file /settings/icon")
            FileSystem.writeAsStringAsync(IconPath, "false")
        } else {
            console.log("file /settings/icon exists")
        }

        // Create "calibration" file
        const CalibPath = SettingsDir + "calibration"
        const CalibStatus = await FileSystem.getInfoAsync(CalibPath)
        if (!CalibStatus.exists) {
            console.log("Creating file /settings/calibration")
            FileSystem.writeAsStringAsync(CalibPath, "0,0,0,0,0,0,0")
        } else {
            console.log("file /settings/calibration exists")
        }

        initialized = true
        getOrientationFile()
        getAutoDeleteFile()
        getIconFile()
        getCalibFile()
    }

    mutex.release()
}

///////////////////////////////////////////////////// Orientation /////////////////////////////////////////////////////

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

// Only needs to be called during startup
export function getOrientation() : boolean {
    return o // ? "right" : "left"
}

///////////////////////////////////////////////////// Auto Delete /////////////////////////////////////////////////////

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

// Only needs to be called during stopRecording()
export async function getAutoDelete() : Promise<boolean> {
    await SettingsInit()
    await mutex.acquire()

    const val = a
    mutex.release()
    return val
}

//////////////////////////////////////////////////////// Icons ////////////////////////////////////////////////////////

async function setShowIcons(setVal : boolean) {
    await SettingsInit()
    await mutex.acquire()

    const FilePath = FileSystem.documentDirectory + "settings/icon"
    const FileStatus = await FileSystem.getInfoAsync(FilePath)
    if (FileStatus.exists) {
        await FileSystem.writeAsStringAsync(FilePath, String(setVal))
        console.log("set icon =", String(setVal))
    }
    i = setVal

    mutex.release()
}

// Reads the file and stores value in var i
async function getIconFile() {
    await SettingsInit()
    await mutex.acquire()

    const FilePath = FileSystem.documentDirectory + "settings/icon"
    const val = await FileSystem.readAsStringAsync(FilePath)
    i = Boolean(val)
    console.log("i =", i)

    mutex.release()
}

export function getShowIcons() : boolean {
    return i
}

///////////////////////////////////////////////////// Calibration /////////////////////////////////////////////////////

// Called by 'Calibrate' button in Calibration Modal
async function setCalib(val : number[]) {
    await SettingsInit()
    await mutex.acquire()

    val.map((value, index) => {
        calib[index] = value
    })

    const FilePath = FileSystem.documentDirectory + "settings/calibration"
    await FileSystem.writeAsStringAsync(FilePath, calib2string(val))
    console.log("calib = ", calib)

    mutex.release()
}

// Reads file system and sets value of 'calib'
async function getCalibFile() {
    await SettingsInit()
    await mutex.acquire()

    const FilePath = FileSystem.documentDirectory + "settings/calibration"
    const val = await FileSystem.readAsStringAsync(FilePath)

    // console.log("FILE VERSION OF CALIB = ", val)

    let calib_split = val.split(",")

    calib_split.map((value, index) => {
        calib[index] = Number(value)
    })

    mutex.release()
}

// Returns value of 'calib'
export function getCalib() : number[] {
    // console.log("getCalib returned", calib)
    return calib
}

function calib2string(val : number[]) : string {
    let str = ""
    val.map((value, index) => {
        if (index == 0) {
            str += String(value)
        } else {
            str += ("," + String(value))
        }
    })
    return str
}