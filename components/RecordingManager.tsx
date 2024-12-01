import { createContext, useState } from "react";
import * as FileSystem from "expo-file-system";
import { Mutex } from "async-mutex";
import { getAutoDelete } from "@/app/(tabs)/settings";

// Global state managed by RecordingManager
const mutex = new Mutex()
let recordingNum : number = 0
let recordingNums : number[] = []
let recordingMetadata : RecordingMetadata[] = []
let autoDeleteNums : number[] = []
let initialized = false

// State for current recording
let isRecording = false
let dataBuffer :string[] = []
let startTime = Date.now()

export interface RecordingMetadata {
    key: number, // recordingNum
    name: string,
    mode: string
    startTime: number,
    endTime: number,
};

// Define the type for the context's value
interface RecordingContextType {
    recordings: RecordingMetadata[];
    RecordingsInit: () => void;
    startRecording: () => void;
    stopRecording: (mode : string) => void;
    deleteFile: (num : number) => void;
    deleteAllFiles: () => void;
    renameFile: (num : number, newName : string) => void;
    printFile: (num : number) => void;
    writeDataLine: (data : string) => void; // write data line by line into buffer
};

// Functions and Variables to be exported
export const RecordingContext = createContext<RecordingContextType>({
    recordings: [],
    RecordingsInit: () => {},
    startRecording: () => {},
    stopRecording: (mode : string) => {},
    deleteFile: (num : number) => {},
    deleteAllFiles: () => {},
    renameFile: (num : number, newName : string) => {},
    printFile: (num : number) => {},
    writeDataLine: (data : string) => {},
});

export const RecordingProvider = ({ children }: { children: React.ReactNode }) => {

    const [recordings, setrecordings] = useState<RecordingMetadata[]>([])

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// Function Implementations Begin ////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Creates a deep copy of recordingMetadata to update state
    function updateState() {
        let copy : RecordingMetadata[] = []
        recordingMetadata.map((value) => {
            copy.push(value)
        })
        setrecordings(copy.reverse())
    }

    async function RecordingsInit() {
        await mutex.acquire(); // lock

        if (!initialized) {
            console.log("RecordingsInit")

            await createStateFiles()
            await readStateFiles()

            initialized = true

            // After initialization, delete all items in autoDeleteNums
            const AutoDeleteFilePath = FileSystem.documentDirectory + "recordingAutoDeleteFile"
            autoDeleteNums.map((value) => {
                console.log("Deleting auto delete file", value)
                deleteFile(value) // asynchronously delete files
            })
            autoDeleteNums = []
            await FileSystem.writeAsStringAsync(AutoDeleteFilePath, "")
            updateState();
        }

        mutex.release(); // unlock
    }

    async function startRecording() {
        await RecordingsInit();
        await mutex.acquire(); // lock

        isRecording = true
        dataBuffer = []
        startTime = Date.now()
        console.log("Starting recording", recordingNum, "at", timestamp2string(startTime))

        // updateState();
        mutex.release(); // unlock
    }

    async function stopRecording(mode : string) {
        await RecordingsInit();
        await mutex.acquire(); // lock

        // Save recording
        isRecording = false
        const recordingFilePath = FileSystem.documentDirectory + "recording" + String(recordingNum)
        let writeVal = ""
        dataBuffer.map((value, index) => {
            if (index == 0) {
                writeVal += value
            } else {
                writeVal += ("," + value)
            }
        })
        await FileSystem.writeAsStringAsync(recordingFilePath, writeVal)
        console.log("Saved recording", recordingNum)

        // Update recording state
        recordingNums.push(recordingNum)
        recordingMetadata.push({
            key: recordingNum, name: "RECORDING " + String(recordingNum), mode: mode, startTime: startTime, endTime: Date.now(),
        })
        const autoDeleteSetting = await getAutoDelete()
        if (autoDeleteSetting) {
            autoDeleteNums.push(recordingNum)
        }
        recordingNum ++

        // Write updated recording state to persistent storage
        await updateStateFiles()

        updateState();
        mutex.release(); // unlock
    }

    async function deleteFile (num : number) {
        await RecordingsInit();
        await mutex.acquire(); // lock

        // Check if recording exists
        const index = recordingNums.indexOf(num)
        if (index != -1) {
            // Delete File
            const DeleteFilePath = FileSystem.documentDirectory + "recording" + String(num)
            const DeleteFileStatus = await FileSystem.getInfoAsync(DeleteFilePath)
            if (DeleteFileStatus.exists) {
                await FileSystem.deleteAsync(DeleteFilePath)
            }
            console.log("Deleted recording", num)

            // Update recording state
            recordingNums.splice(index, 1)
            recordingMetadata.splice(index, 1)
            // Do not need to remove from autoDeleteNums

            // Write updated recording state to persistent storage
            await updateStateFiles()
        }

        updateState();
        mutex.release(); // unlock
    }

    async function deleteAllFiles() {
        await RecordingsInit();
        await mutex.acquire(); // lock

        // Delete all recordings
        while (recordingNums.length > 0) {
            const deleteTarget = recordingNums[0]
            mutex.release();
            await deleteFile(deleteTarget)
            await mutex.acquire();
        }

        // Update recording state
        recordingNum = 0
        recordingNums = []
        recordingMetadata = []
        autoDeleteNums = []

        // Write updated recording state to persistent storage
        await updateStateFiles()

        initialized = false

        updateState();
        mutex.release(); // unlock
    }

    async function renameFile(num : number, newName : string) {
        await RecordingsInit();
        await mutex.acquire(); // lock

        // Check if recording exists
        const index = recordingNums.indexOf(num)
        if (index != -1) {
            // Change name field of metadata
            let metadata = recordingMetadata[index]
            metadata.name = newName
            recordingMetadata[index] = metadata
            console.log("Renamed recording ", num, "to", newName)

            // Write updated recording state to persistent storage
            await updateStateFiles()
        }

        updateState()
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

    async function writeDataLine(data : string) {
        await RecordingsInit();
        await mutex.acquire(); // lock

        if (isRecording) {
            dataBuffer.push(data)
        }

        mutex.release(); // unlock
    }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////// Function Implementations End /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    return (
        <RecordingContext.Provider value ={{ recordings, RecordingsInit, startRecording,
            stopRecording, deleteFile, deleteAllFiles, renameFile, printFile, writeDataLine }}>
            {children}
        </RecordingContext.Provider>
    )
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////// Helper Functions ////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Creates necessary state files with initial values
async function createStateFiles() {
    const recordingNumFilePath = FileSystem.documentDirectory + "recordingNumFile"
    const recordingNumFileStatus = await FileSystem.getInfoAsync(recordingNumFilePath)
    if (!recordingNumFileStatus.exists) {
        await FileSystem.writeAsStringAsync(recordingNumFilePath, "0")
    }

    const recordingNumsFilePath = FileSystem.documentDirectory + "recordingNumsFile"
    const recordingNumsFileStatus = await FileSystem.getInfoAsync(recordingNumsFilePath)
    if (!recordingNumsFileStatus.exists) {
        await FileSystem.writeAsStringAsync(recordingNumsFilePath, "")
    }

    const recordingMetadataFilePath = FileSystem.documentDirectory + "recordingMetadataFile"
    const recordingMetadataFileStatus = await FileSystem.getInfoAsync(recordingMetadataFilePath)
    if (!recordingMetadataFileStatus.exists) {
        await FileSystem.writeAsStringAsync(recordingMetadataFilePath, "")
    }

    const recordingAutoDeleteFilePath = FileSystem.documentDirectory + "recordingAutoDeleteFile"
    const recordingAutoDeleteFileStatus = await FileSystem.getInfoAsync(recordingAutoDeleteFilePath)
    if (!recordingAutoDeleteFileStatus.exists) {
        await FileSystem.writeAsStringAsync(recordingAutoDeleteFilePath, "")
    }
}

// Reads state files and initializes data structures
async function readStateFiles() {
    const recordingNumFilePath = FileSystem.documentDirectory + "recordingNumFile"
    const recordingNumFileContents = await FileSystem.readAsStringAsync(recordingNumFilePath)
    recordingNum = Number(recordingNumFileContents)
    console.log("recordingNum =", Number(recordingNumFileContents))

    const recordingNumsFilePath = FileSystem.documentDirectory + "recordingNumsFile"
    const recordingNumsFileContents = await FileSystem.readAsStringAsync(recordingNumsFilePath)
    if (recordingNumsFileContents != "") {
        const recordingNumsFileSplit = recordingNumsFileContents.split(",")
        recordingNumsFileSplit.map((value) => {
            recordingNums.push(Number(value))
        })
    }
    console.log("recordingNums =", recordingNums)

    const recordingMetadataFilePath = FileSystem.documentDirectory + "recordingMetadataFile"
    const recordingMetadataFileContents = await FileSystem.readAsStringAsync(recordingMetadataFilePath)
    if (recordingMetadataFileContents != "") {
        const recordingMetadataFileSplit = recordingMetadataFileContents.split(",")
        recordingMetadataFileSplit.map((value) => {
            recordingMetadata.push(string2metadata(value))
        })
    }
    console.log("recordingMetadata =", recordingMetadata)

    const recordingAutoDeleteFilePath = FileSystem.documentDirectory + "recordingAutoDeleteFile"
    const recordingAutoDeleteFileContents = await FileSystem.readAsStringAsync(recordingAutoDeleteFilePath)
    if (recordingAutoDeleteFileContents != "") {
        const recordingAutoDeleteFileSplit = recordingAutoDeleteFileContents.split(",")
        recordingAutoDeleteFileSplit.map((value) => {
            autoDeleteNums.push(Number(value))
        })
    }
    console.log("autoDeleteNums =", autoDeleteNums)
}

async function updateStateFiles() {
    const recordingNumFilePath = FileSystem.documentDirectory + "recordingNumFile"
    await FileSystem.writeAsStringAsync(recordingNumFilePath, String(recordingNum))

    const recordingNumsFilePath = FileSystem.documentDirectory + "recordingNumsFile"
    let recordingNumsWriteVal = ""
    recordingNums.map((value, index) => {
        if (index == 0) {
            recordingNumsWriteVal += value
        } else {
            recordingNumsWriteVal += ("," + value)
        }
    })
    await FileSystem.writeAsStringAsync(recordingNumsFilePath, recordingNumsWriteVal)

    const recordingMetadataFilePath = FileSystem.documentDirectory + "recordingMetadataFile"
    let recordingMetadataWriteVal = ""
    recordingMetadata.map((value, index) => {
        if (index == 0) {
            recordingMetadataWriteVal += metadata2string(value)
        } else {
            recordingMetadataWriteVal += ("," + metadata2string(value))
        }
    })
    await FileSystem.writeAsStringAsync(recordingMetadataFilePath, recordingMetadataWriteVal)

    const recordingAutoDeleteFilePath = FileSystem.documentDirectory + "recordingAutoDeleteFile"
    let recordingAutoDeleteWriteVal = ""
    autoDeleteNums.map((value, index) => {
        if (index == 0) {
            recordingAutoDeleteWriteVal += value
        } else {
            recordingAutoDeleteWriteVal += ("," + value)
        }
    })
    await FileSystem.writeAsStringAsync(recordingAutoDeleteFilePath, recordingAutoDeleteWriteVal)
}

// Convert string of metadata to RecordingMetadata struct
function string2metadata(metadata : string) : RecordingMetadata {
    let result : RecordingMetadata = {
        key: 0, name: "", mode: "", startTime: 0, endTime: 0,
    }

    const split = metadata.split("*")
    split.map((value, index) => {
        switch (index) {
            case 0:
                result.key = Number(value)
                break
            case 1:
                result.name = value
                break
            case 2:
                result.mode = value
                break
            case 3:
                result.startTime = Number(value)
                break
            case 4:
                result.endTime = Number(value)
                break
        }
    })

    return result
}

function metadata2string(metadata : RecordingMetadata) : string {
    const result = String(metadata.key) + "*" + metadata.name + "*" + metadata.mode + "*"
        + String(metadata.startTime) + "*" + String(metadata.endTime)
    return result
}

export function timestamp2string(timestamp : number) : string {
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

export async function readFile(num : number) : Promise<string> {
    console.log("Reading file:", num)
    const FilePath = FileSystem.documentDirectory + "recording" + String(num)
    const FileStatus = await FileSystem.getInfoAsync(FilePath)
    if (FileStatus.exists) {
        const FileContents = await FileSystem.readAsStringAsync(FilePath)
        return FileContents
    } else {
        console.log("readFile: file", num, "does not exists")
        return "0.00 0.00 0.00 0.00 0.00 0.00 0.00 0.00"
    }
}