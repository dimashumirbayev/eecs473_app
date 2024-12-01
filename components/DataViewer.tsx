import { Text, View, StyleSheet } from "react-native";
import { useState } from "react";

interface DataViewerContextType {
    dataString: string,
    setDataString: (val : string) => void,
}

interface DataViewerProps {
    value: string;
}

export const DataViewer: React.FC<DataViewerProps> = ({ value }) => {
    return (
        <View style={styles.container}>
            <Text> {value} </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'absolute',
        height: '100%',
        width: '100%',
        borderRadius: 20,
        padding: 10,
        backgroundColor: 'yellow',
    },
    text: {
        // color: '#fff',
        fontSize: 18,
        // fontWeight: 'bold',
    },
});
