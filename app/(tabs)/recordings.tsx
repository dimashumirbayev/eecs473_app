import { Text, View, StyleSheet, FlatList, ScrollView, Pressable } from "react-native";
import { useContext } from "react";
import { RecordingContext, timestamp2string } from "@/components/RecordingManager"
import { Ionicons } from "@expo/vector-icons";

export default function RecordingsScreen() {

    const {recordings, deleteFile, renameFile } = useContext(RecordingContext)

    if (recordings.length > 0) {
        return (
            <View style={styles.container}>
                <FlatList
                    data = { recordings }
                    renderItem = {({item}) => (
                            <View style={styles.item}>
                                <Text style={styles.title}> { item.name } </Text>
                                <Text style={styles.text}> Exercise: { item.mode } </Text>
                                <Text style={styles.text}> { timestamp2string(item.startTime) } </Text>
                                <Text style={styles.text}> Duration: { duration2string(item.startTime, item.endTime) } </Text>
                                <Pressable
                                    style = {styles.selectbutton}
                                    onPress = {() => {
                                        console.log("Pressed select button for item", item.key)
                                    }}
                                >
                                </Pressable>
                                <Pressable
                                    style = {styles.menubutton}
                                    onPress = {() => {
                                        console.log("Pressed menu button for item", item.key)
                                    }}
                                >
                                    <Ionicons style = {styles.menuicon}
                                        name = {"menu"}
                                        size = {50}
                                    />
                                </Pressable>
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
    },
    title: {
        color: '#fff',
        // fontSize: 14,
        fontWeight: 'bold',
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