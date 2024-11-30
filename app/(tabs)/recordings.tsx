import { Text, View, StyleSheet, FlatList } from "react-native";
import { useContext } from "react";
import { RecordingContext, timestamp2string } from "@/components/RecordingManager"

export default function RecordingsScreen() {

    const {recordings, deleteFile, renameFile } = useContext(RecordingContext)

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
                    </View>
            )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 10,
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