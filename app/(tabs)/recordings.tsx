import { Text, View, StyleSheet, FlatList, ScrollView, TouchableOpacity, Modal, Alert } from "react-native";
import { useContext, useState } from "react";
import { RecordingContext, RecordingMetadata, timestamp2string } from "@/components/RecordingManager"
import { Ionicons } from "@expo/vector-icons";

export default function RecordingsScreen() {

    const {recordings, deleteFile, renameFile } = useContext(RecordingContext)
    const [modalVisible, setModalVisible ] = useState(false)
    const [selectedRecording, setSelectedRecording] = useState<RecordingMetadata>({
        key: -1,
        name: "default",
        mode: "default",
        startTime: 0,
        endTime: 0,
    })

    if (recordings.length > 0) {
        return (
            <View style={styles.container}>
                <Modal visible={modalVisible} animationType="slide">
                    <View style = {styles.optionsheader}>
                        <Text style={styles.optionsheadertext}> Options for {selectedRecording.name} </Text>
                    </View>
                    <View style={styles.optionscontainer}>
                        <TouchableOpacity
                            style = {styles.optionsbutton}
                            onPress = {() => {
                                Alert.prompt(
                                    'Enter a new name for ' + selectedRecording.name,
                                    '',
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
                                                        "Error: name cannot contain apostrophe or comma",
                                                        '',
                                                        [{
                                                                text: "OK",
                                                                onPress: () => {}
                                                            }],
                                                        { cancelable: false }
                                                    );
                                                } else {
                                                    console.log('Name entered:', newName)
                                                    renameFile(selectedRecording.key, String(newName))
                                                    setModalVisible(false)
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
                                            setModalVisible(false)
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
                                setModalVisible(false)
                            }}
                        >
                            <Text style={styles.optionstext}> Exit </Text>
                        </TouchableOpacity>
                    </View>
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
                                        setSelectedRecording(item)
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
                                        setModalVisible(true)
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
                <View style={styles.item}>
                    <Text style={styles.text}> </Text>
                    <Text style={styles.title}>                                   No Recordings Yet </Text>
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
        marginLeft: 5,
    },
    title: {
        color: '#fff',
        // fontSize: 14,
        fontWeight: 'bold',
        marginTop: 7,
        marginLeft: 5,
    },
    item: {
        backgroundColor: 'gray',
        margin: 5,
        marginBottom: 7,
        padding: 15,
        borderRadius: 20,
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
    }
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