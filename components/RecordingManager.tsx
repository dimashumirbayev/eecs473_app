import { Text, View, StyleSheet, } from "react-native";
import { createContext, useState, useContext } from "react";

// Define the type for the context's value
interface RecordingContextType {
    recordingNum: number;
    validRecordings: number[];
    startRecordingFunc: () => void;
};

// Functions and Variables to be exported
export const RecordingContext = createContext<RecordingContextType>({
    recordingNum: 0,
    validRecordings: [],
    startRecordingFunc: () => {console.log("wrong guy")}
});

async function startRecordingFunc_() {
    console.log("WRONG GUY")
}

// export const useRecording = () => {
//     return useContext(RecordingContext)
// }

export const RecordingProvider = ({ children }: { children: React.ReactNode }) => {

    const [recordingNum, setRecordingNum] = useState(0)
    const [validRecordings, setValidRecordings] = useState([])
    const startRecordingFunc = () => {
        console.log("CORRECT GUY")
    }

    return (
        <RecordingContext.Provider value ={{ recordingNum, validRecordings, startRecordingFunc }}>
            <Text> hello from the other side </Text>
            {children}
        </RecordingContext.Provider>
    )
}

// TODO: create setAutoDelete(bool) function to be called by settings