import { Text, View, StyleSheet, } from "react-native";
import * as FileSystem from "expo-file-system";
import { Mutex } from "async-mutex";
import { createContext, useState } from "react";
import { getAutoDelete } from "@/app/(tabs)/settings";

const mutex = new Mutex();
let recordingNum : number = 0
let validRecordings : number[] = []
let initialized = false;
let timestamp = Date.now();

export interface RecordingMetadata {
    recordingNum: number,
    name: string,
    timestamp: number,
};

// Define the type for the context's value
interface RecordingContextType {
    recordings: number[];
    RecordingsInit: () => void;
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
    RecordingsInit: () => {},
    startRecording: () => {},
    stopRecording: (data : string[]) => {},
    deleteFile: (num : number) => {},
    deleteAllFiles: () => {},
    renameFile: (num : number, newName : string) => {},
    printFile: (num : number) => {},
});

export const RecordingProvider = ({ children }: { children: React.ReactNode }) => {

    const [recordings, setrecordings] = useState<number[]>([])

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// Function Implementations Begin ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Creates a deep copy of validRecordings to update state
    function updateState() {
        let copy : number[] = []
        validRecordings.map((value) => {
            copy.push(value)
        })
        setrecordings(copy)
    }

    async function RecordingsInit() {
        await mutex.acquire(); // lock

        if (!initialized) {
            console.log("RecordingsInit")

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

            // Create to_delete file -> used for auto_delete files
            const ToDeletePath = FileSystem.documentDirectory + "to_delete"
            const ToDeleteStatus = await FileSystem.getInfoAsync(ToDeletePath)
            if (!ToDeleteStatus.exists) {
                await FileSystem.writeAsStringAsync(ToDeletePath, "")
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

            // After initialization, delete all items in to_delete
            const ToDeleteContents = await FileSystem.readAsStringAsync(ToDeletePath)
            const NumsToDelete = ToDeleteContents.split(",")
            NumsToDelete.map((value) => {
                console.log("deleting auto delete file", value)
                deleteFile(Number(value)) // asynchronously delete all files to be deleted !
            })
        }
        updateState();
        mutex.release(); // unlock
    }

    async function startRecording() {
        await RecordingsInit();
        await mutex.acquire(); // lock

        timestamp = Date.now()
        console.log("Starting recording", recordingNum, "at", timestamp_to_string(timestamp))

        updateState();
        mutex.release(); // unlock
    }

    async function stopRecording(data : string[]) {
        await RecordingsInit();
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

        // Check AutoDelete Setting
        const auto_delete = await getAutoDelete()
        if (auto_delete) {
            const ToDeletePath = FileSystem.documentDirectory + "to_delete"
            let ToDeleteContents = await FileSystem.readAsStringAsync(ToDeletePath)
            ToDeleteContents += ("," + String(recordingNum - 1)) // This is after the increment
            await FileSystem.writeAsStringAsync(ToDeletePath, ToDeleteContents)
            console.log("wrote", String(recordingNum - 1), "to auto_delete log")
        }

        updateState();
        mutex.release(); // unlock
    }

    async function deleteFile (num : number) {
        await RecordingsInit();
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

        updateState();
        mutex.release(); // unlock
    }

    async function deleteAllFiles() {
        await RecordingsInit();
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

        updateState();
        mutex.release(); // unlock
    }

    async function renameFile(num : number, newName : string) {
        await RecordingsInit();
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
        await RecordingsInit();
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
        <RecordingContext.Provider value ={{ recordings, RecordingsInit, startRecording,
            stopRecording, deleteFile, deleteAllFiles, renameFile, printFile, }}>
            {children}
        </RecordingContext.Provider>
    )
}

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
