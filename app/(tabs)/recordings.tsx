import { Text, View, StyleSheet, FlatList, ScrollView, TouchableOpacity, Modal, Alert } from "react-native";
import { useContext, useState, useEffect } from "react";
import { RecordingContext, RecordingMetadata, timestamp2string } from "@/components/RecordingManager"
import { Ionicons } from "@expo/vector-icons";
import Slider from '@react-native-community/slider';
import { readFile } from "@/components/RecordingManager";
import { DataViewer } from "@/components/DataViewer";

export default function RecordingsScreen() {

    const {recordings, deleteFile, renameFile } = useContext(RecordingContext)
    const [optionsModalVisible, setOptionsModalVisible ] = useState(false)
    const [selectedRecording, setSelectedRecording] = useState<RecordingMetadata>({
        key: -1,
        name: "default",
        mode: "default",
        startTime: 0,
        endTime: 0,
    })
    const [playbackModalVisible, setPlaybackModalVisible] = useState(false)
    const [playbackPaused, setPlaybackPaused] = useState(true)
    const [playbackStarted, setPlaybackStarted] = useState(false)
    const [playbackIndex, setPlaybackIndex] = useState(0) // index into selectedRecordingContents
    const [selectedRecordingContents, setSelectedRecordingContents] = useState<string[]>(["0.00 0.00 0.00 0.00 0.00 0.00 0.00 0.00"])
    const [playbackString, setPlaybackString] = useState("0.00 0.00 0.00 0.00 0.00 0.00 0.00 0.00")
    async function readFileContents(num : number) {
        const FileContents = await readFile(num)
        const FileContentsSplit = FileContents.split(",")
        console.log("Playback File has length", FileContentsSplit.length)
        setSelectedRecordingContents(FileContentsSplit)
    }

    // Function to handle iteration every X ms during playback
    useEffect(() => {
        const intervalId = setInterval(() => {
            // Increment
            if (playbackModalVisible && playbackStarted) {
                if (!playbackPaused) {
                    setPlaybackIndex((prevIndex) => {
                        const nextIndex = prevIndex + 1
                        if (nextIndex >= selectedRecordingContents.length) { // Finished playback
                            setPlaybackPaused(true)
                            setPlaybackStarted(false)
                            setPlaybackString(selectedRecordingContents[0])
                            return -1 // Instead of 0 for whatever reason -> set slider back to 0
                        } else {
                            console.log("index increment from", prevIndex, "to", nextIndex)
                            setPlaybackString(selectedRecordingContents[nextIndex])
                            return nextIndex
                        }
                    })
                }
            };
        }, 100); // 100 ms interval
        return () => { // Cleanup the interval on unmount
            clearInterval(intervalId);
        };
    }, [playbackModalVisible, playbackStarted, playbackPaused]);

    if (recordings.length > 0) {
        return (
            <View style={styles.container}>
                <Modal visible={playbackModalVisible} animationType="slide">
                    <View style={styles.optionsheader}>
                        <Text style={styles.optionsheadertext}> {selectedRecording.name} </Text>
                    </View>
                    <ScrollView style={styles.optionscontainer}>
                        <View style={styles.playbackmodecontainer}>
                            <Text style={styles.optionstext}> Mode: {selectedRecording.mode} </Text>
                        </View>
                        <View style={styles.DataViewerContainer}>
                            <DataViewer dataString={playbackString} source={"recordings"} mode={selectedRecording.mode}>
                            </DataViewer>
                            <TouchableOpacity
                                style = {styles.PauseContainer}
                                onPress = {() => {
                                    if (!playbackStarted) {
                                        console.log("marking playback started")
                                        setPlaybackStarted(!playbackStarted)
                                    }
                                    setPlaybackPaused(!playbackPaused)
                                }}
                            >
                                <View style={styles.TapToPlayContainer}>
                                    <Ionicons
                                    style = {{
                                        marginLeft: 15,
                                    }}
                                    opacity = {playbackStarted ? 0 : 1}
                                    name = {"play"}
                                    size = {80}
                                    color = "#1EB1FC"
                                    />
                                    <Text style={{fontSize: 20, color: "#1EB1FC", fontWeight: 'bold'}}> {playbackStarted ? "" : "Tap to Play"} </Text>
                                </View>
                                <View style={styles.TapToResumeContainer}>
                                    <Ionicons
                                        opacity = {playbackStarted ? 1 : 0}
                                        name = {playbackPaused ? "play" : "pause"}
                                        size = {30}
                                        color = "#1EB1FC"
                                    />
                                    <Text style={{fontSize: 20, color: "#1EB1FC"}}>
                                        {playbackStarted ? (playbackPaused ? "Tap to Resume" : "Tap to Pause"): ""}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <Slider
                            style={styles.slider}         // The style of the slider
                            minimumValue={0}              // Minimum value of the slider
                            maximumValue={selectedRecordingContents.length - 1} // Maximum value of the slider
                            step={1}                      // Step size for each movement
                            value={playbackIndex}         // Current value of the slider
                            onValueChange={(val) => {     // Function to handle slider value change
                                setPlaybackIndex(val)
                                setPlaybackString(selectedRecordingContents[val])
                                console.log("slider at position", val)
                            }}
                            minimumTrackTintColor="#1EB1FC"   // Color of the track that is below the thumb
                            maximumTrackTintColor="#d3d3d3"   // Color of the track above the thumb
                            thumbTintColor="#1EB1FC"          // Color of the thumb
                        />
                        <TouchableOpacity
                            style = {styles.optionsbutton}
                            onPress = {() => {
                                setPlaybackModalVisible(false)
                            }}
                        >
                            <Text style={styles.optionstext}> Exit </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Modal>
                <Modal visible={optionsModalVisible} animationType="slide">
                    <View style = {styles.optionsheader}>
                        <Text style={styles.optionsheadertext}> Options for {selectedRecording.name} </Text>
                    </View>
                    <ScrollView style={styles.optionscontainer}>
                        <TouchableOpacity
                            style = {styles.optionsbutton}
                            onPress = {() => {
                                Alert.prompt(
                                    'Enter a new name for ' + selectedRecording.name, '',
                                    [
                                        {
                                            text: 'Cancel',
                                            onPress: () => {},
                                            style: 'cancel',
                                        },
                                        {
                                            text: 'OK',
                                            onPress: (newName) => {
                                                // Check that it doesn't contain * or ,
                                                const newNameString = String(newName)
                                                if ((newNameString.indexOf('*') != -1)
                                                    || (newNameString.indexOf(',') != -1)) {
                                                    Alert.alert(
                                                        "Error: name cannot contain apostrophe or comma", '',
                                                        [{
                                                                text: "OK",
                                                                onPress: () => {}
                                                            }],
                                                        { cancelable: false }
                                                    );
                                                } else {
                                                    console.log('Name entered:', newName)
                                                    renameFile(selectedRecording.key, String(newName))
                                                    setOptionsModalVisible(false)
                                                }
                                            }
                                        },
                                    ],
                                );
                            }}
                        >
                            <Text style={styles.optionstext}> Rename Recording </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style = {styles.optionsbutton}
                            onPress = {() => {
                                Alert.alert(
                                    "Are you sure?",
                                    "Press OK to delete '" + selectedRecording.name + "'",
                                    [
                                      {
                                        text: "Cancel",
                                        style: "cancel"
                                      },
                                      {
                                        text: "OK",
                                        onPress: () => {
                                            deleteFile(selectedRecording.key)
                                            setOptionsModalVisible(false)
                                        },
                                      }
                                    ],
                                    { cancelable: false }
                                );
                            }}
                        >
                            <Text style={styles.optionstext}> Delete Recording </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style = {styles.optionsbutton}
                            onPress = {() => {
                                setOptionsModalVisible(false)
                            }}
                        >
                            <Text style={styles.optionstext}> Exit </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Modal>
                <FlatList
                    data = { recordings }
                    renderItem = {({item}) => (
                            <View style={styles.item}>
                                <Text style={styles.title}> </Text>
                                <Text style={styles.text}> </Text>
                                <Text style={styles.text}> </Text>

                                <TouchableOpacity
                                    style = {styles.selectbutton}
                                    onPress = {() => {
                                        console.log("Pressed select button for item", item.key)
                                        readFileContents(item.key) // asynchronously reads file contents
                                        setSelectedRecording(item)
                                        setPlaybackString(selectedRecordingContents[0])
                                        setPlaybackIndex(-1)
                                        setPlaybackPaused(true)
                                        setPlaybackStarted(false)
                                        setPlaybackModalVisible(true)
                                    }}
                                >
                                    <Text style={styles.title}> { item.name } </Text>
                                    <Text style={styles.text}> Exercise: { item.mode } </Text>
                                    <Text style={styles.text}> { timestamp2string(item.startTime) } </Text>
                                    <Text style={styles.text}> Duration: { duration2string(item.startTime, item.endTime) } </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style = {styles.menubutton}
                                    onPress = {() => {
                                        console.log("Pressed menu button for item", item.key)
                                        setSelectedRecording(item)
                                        setOptionsModalVisible(true)
                                    }}
                                >
                                    <Ionicons style = {styles.menuicon}
                                        name = {"menu"}
                                        size = {50}
                                    />
                                </TouchableOpacity>
                            </View>
                )}
                />
            </View>
        );
    } else {
        return (
            <ScrollView style={styles.container}>
                <View style={styles.norecordingsitem}>
                    <Text style={styles.text}> </Text>
                    <Text style={styles.norecordingstext}> No Recordings Yet </Text>
                    <Text style={styles.text}> </Text>
                </View>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#25292e',
        paddingTop: 10,
        paddingHorizontal: 10,
        paddingBottom: 10,
        position: 'relative',
    },
    text: {
        color: '#fff',
        marginLeft: 10,
    },
    title: {
        color: '#fff',
        // fontSize: 14,
        fontWeight: 'bold',
        marginTop: 10,
        marginLeft: 10,
    },
    item: {
        backgroundColor: 'gray',
        margin: 5,
        marginBottom: 7,
        padding: 15,
        borderRadius: 20,
    },
    norecordingsitem: {
        backgroundColor: 'gray',
        margin: 5,
        padding: 15,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    norecordingstext: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        margin: 3,
        marginLeft: 10,
    },
    selectbutton: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 384,
        height: 94,
        zIndex: 1,
        // backgroundColor: 'blue'
    },
    menuicon: {
        color: '#fff"',
        position: 'absolute',
        top: 0,
        right: 5,
    },
    menubutton: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 60,
        height: 50,
        // backgroundColor: 'red',
        zIndex: 2,
    },
    optionsheader: {
        backgroundColor: 'white',
        height: 92,
        alignItems: 'center',
    },
    optionsheadertext: {
        fontSize: 24,
        position: 'absolute',
        top: 50,
    },
    optionscontainer: {
        flex: 1,
        backgroundColor: '#25292e',
    },
    optionsbutton: {
        backgroundColor: 'gray',
        borderRadius: 20,
        marginTop: 10,
        marginLeft: 10,
        marginRight: 10,
        height: 68,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionstext: {
        color: 'white',
        fontSize: 18,
    },
    playbackmodecontainer: {
        backgroundColor: 'gray',
        borderRadius: 20,
        marginTop: 20,
        marginLeft: 10,
        marginRight: 10,
        height: 68,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slider: {
        // margin: 10,
        marginTop: 5,
        marginBottom: 5,
        marginLeft: 25,
        marginRight: 25,
    },
    DataViewerContainer: {
        backgroundColor: '#FFFFF0',
        margin: 10,
        height: 400,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    PauseContainer: {
        // backgroundColor: 'red',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        // flexDirection: 'row',
    },
    TapToPlayContainer: {
        // backgroundColor: 'red',
        zIndex: 1,
    },
    TapToResumeContainer: {
        position: 'absolute',
        top: 15,
        // backgroundColor: 'blue',
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
});

function duration2string(startTime : number, endTime : number) : string {
    // Adds leading 0 if 1 digit number
    function add_leading_zero(num : number) : string {
        return (num < 10 ? "0" : "") + String(num)
    }

    let ms = endTime - startTime // duration in ms

    const hours = Math.floor(ms / 3600000)
    ms -= (hours * 3600000)

    const minutes = Math.floor(ms / 60000)
    ms -= (minutes * 60000)

    const seconds = Math.floor(ms / 1000)

    return String(hours) + ":" + add_leading_zero(minutes) + ":" + add_leading_zero(seconds)
}