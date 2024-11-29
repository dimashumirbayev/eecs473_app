import { Text, View, StyleSheet, } from "react-native";
import * as FileSystem from "expo-file-system";
import { Mutex } from "async-mutex";
import { createContext, useState, useContext } from "react";

const mutex = new Mutex();
let recordingNum : number = 0
let validRecordings : number[] = []
let metadataRecordings: RecordingMetadata[] = []
let initialized = false;
let timestamp = Date.now();

export interface RecordingMetadata {
    recordingNum: number,
    name: string,
    timestamp: number,
};

// Define the type for the context's value
interface RecordingContextType {
    recordings: RecordingMetadata[];
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
    recordings: [],
    InitRecordings: () => {},
    startRecording: () => {},
    stopRecording: (data : string[]) => {},
    deleteFile: (num : number) => {},
    deleteAllFiles: () => {},
    renameFile: (num : number, newName : string) => {},
    printFile: (num : number) => {},
});

export const RecordingProvider = ({ children }: { children: React.ReactNode }) => {

    const [recordings, setrecordings] = useState<RecordingMetadata[]>([])

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// Function Implementations Begin ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    async function InitRecordings() {
        await mutex.acquire(); // lock

        if (!initialized) {
            console.log("InitRecordings")

            // Read recordings_state file
            const FilePath = FileSystem.documentDirectory + "recording_state"

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

    async function deleteFile (num : number) {
        await InitRecordings();
        await mutex.acquire(); // lock

        const FilePath = FileSystem.documentDirectory + "recording" + String(num)
        const RecordingStatePath = FileSystem.documentDirectory + "recording_state"

        // Check if recording exists
        const index = validRecordings.indexOf(num)
        if (index != -1) {
            // Delete File
            const FileStatus = await FileSystem.getInfoAsync(FilePath)
            if (FileStatus.exists) {
                await FileSystem.deleteAsync(FilePath)
            }

            // Update and save recording_state
            validRecordings.splice(index, 1)
            let writeVal = String(recordingNum)
            validRecordings.map((value) => {
                writeVal += ("," + value)
            })
            await FileSystem.writeAsStringAsync(RecordingStatePath, writeVal)
            console.log("Deleted recording", num)
        }

        mutex.release(); // unlock
    }

    async function deleteAllFiles() {
        await InitRecordings();
        await mutex.acquire(); // lock

        // Delete all recordings
        while (validRecordings.length > 0) {
            const deleteTarget = validRecordings[0]
            mutex.release();
            await deleteFile(deleteTarget)
            await mutex.acquire();
        }

        const RecordingStatePath = FileSystem.documentDirectory + "recording_state"
        await FileSystem.writeAsStringAsync(RecordingStatePath, "0")
        initialized = false

        mutex.release(); // unlock
    }

    async function renameFile(num : number, newName : string) {
        await InitRecordings();
        await mutex.acquire(); // lock

        // Check if recording exists
        const index = validRecordings.indexOf(num)
        if (index != -1) {
            // Change "name" field within file
            const FilePath = FileSystem.documentDirectory + "recording" + String(num)
            const old_contents = await FileSystem.readAsStringAsync(FilePath)
            let old_contents_split = old_contents.split(",")
            old_contents_split[0] = newName
            let writeVal = ""
            old_contents_split.map((value) => {
                writeVal += value
            })
            await FileSystem.writeAsStringAsync(FilePath, writeVal)
            console.log("Renamed recording", num, "to", newName)
        }

        mutex.release(); // unlock
    }

    async function printFile(num : number) {
        await InitRecordings();
        await mutex.acquire(); // lock

        const FilePath = FileSystem.documentDirectory + "recording" + String(num)
        const FileStatus = await FileSystem.getInfoAsync(FilePath)
        if (FileStatus.exists) {
            const Contents = await FileSystem.readAsStringAsync(FilePath)
            console.log("Contents of recording", num, ":", Contents)
        }

        mutex.release(); // unlock
    }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////// Function Implementations End /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    return (
        <RecordingContext.Provider value ={{ recordings, InitRecordings, startRecording,
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
