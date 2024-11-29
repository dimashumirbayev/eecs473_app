import { Text, View, StyleSheet, } from "react-native";
import * as FileSystem from "expo-file-system";
import { Mutex } from "async-mutex";
import { createContext, useState, useContext } from "react";

const mutex = new Mutex();
let initialized = false;
let timestamp = Date.now();

// Define the type for the context's value
interface RecordingContextType {
    recordingNum: number;
    validRecordings: number[];
    InitRecordings: () => void;
    startRecording: () => void;
    stopRecording: (data : string[]) => void;
    deleteFile: (num : number) => void;
    deleteAllFiles: () => void;
    renameFile: (num : number, newName : string) => void;
    printFile: (num : number) => void;
};

// Functions and Variables to be exported
export const RecordingContext = createContext<RecordingContextType>({
    recordingNum: 0,
    validRecordings: [],
    InitRecordings: () => {},
    startRecording: () => {},
    stopRecording: (data : string[]) => {},
    deleteFile: (num : number) => {},
    deleteAllFiles: () => {},
    renameFile: (num : number, newName : string) => {},
    printFile: (num : number) => {},
});

export const RecordingProvider = ({ children }: { children: React.ReactNode }) => {

    const [recordingNum, setRecordingNum] = useState(0)
    const [validRecordings, setValidRecordings] = useState([])

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// Function Implementations Begin ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async function InitRecordings() {
        await mutex.acquire(); // lock

        if (!initialized) {
            console.log("InitRecordings")

            // Read recordings_state file
            const FilePath = FileSystem.documentDirectory + "recording_state"
            // await FileSystem.deleteAsync(FilePath) // TODO: test by deleting 'recording_state' file

            const FileInfo = await FileSystem.getInfoAsync(FilePath)
            if (!FileInfo.exists) {
                console.log("'recording_state' file does not exist")

                // Create file -> file format: values separated by commas: RecordingNum followed by list of valid recordings
                // Important: because of how strings are parsed, add comma when adding , before adding new element, not after
                await FileSystem.writeAsStringAsync(FilePath, "0")
            } else {
                console.log("'recording_state' file already exists")
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

            initialized = true
        }
        mutex.release(); // unlock
    }

    async function startRecording() {
        await InitRecordings();
        await mutex.acquire(); // lock

        timestamp = Date.now()
        console.log("Starting recording", recordingNum, "at", timestamp_to_string(timestamp))

        mutex.release(); // unlock
    }
    async function stopRecording(data : string[]) {
        await InitRecordings();
        await mutex.acquire(); // lock

        const FilePath = FileSystem.documentDirectory + "recording" + String(recordingNum)
        const RecordingStatePath = FileSystem.documentDirectory + "recording_state"

        // Save recording
        const name = String(recordingNum)
        const time = timestamp_to_string(timestamp)
        let writeVal = name + "," + time
        data.map((value) => {
            writeVal += ("," + value)
        })
        await FileSystem.writeAsStringAsync(FilePath, writeVal)

        // Update and save recording_state
        validRecordings.push(recordingNum)
        recordingNum ++
        writeVal = String(recordingNum)
        validRecordings.map((value) => {
            writeVal += ("," + value)
        })
        await FileSystem.writeAsStringAsync(RecordingStatePath, writeVal)
        console.log("Saved recording", recordingNum - 1)

        mutex.release(); // unlock
    }
    const deleteFile = (num : number) => {}
    const deleteAllFiles = () => {}
    const renameFile = (num : number, newName : string) => {}
    const printFile = (num : number) => {}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////// Function Implementations End /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    return (
        <RecordingContext.Provider value ={{ recordingNum, validRecordings, InitRecordings, startRecording,
            stopRecording, deleteFile, deleteAllFiles, renameFile, printFile, }}>
            <Text> hello from the other side </Text>
            {children}
        </RecordingContext.Provider>
    )
}

// TODO: create setAutoDelete(bool) function to be called by settings

function timestamp_to_string(timestamp : number) : string {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

    // Adds leading 0 if 1 digit number
    function add_leading_zero(num : number) : string {
        return (num < 10 ? "0" : "") + String(num)
    }

    // Function starts here
    const date = new Date(timestamp)

    // November 28 2024 3:55:03 PM
    let meridiem = "AM"
    const month = months[date.getMonth()]
    const day = String(date.getDate())
    const year = String(date.getFullYear())
    let hour = String(date.getHours())
    const minute = add_leading_zero(date.getMinutes())
    const second = add_leading_zero(date.getSeconds())

    if (date.getHours() > 12) {
        meridiem = "PM"
        hour = String(date.getHours() - 12)
    }

    const time = month + " " + day + " " + year + " " + hour + ":" + minute + ":" + second + meridiem
    return time
}
