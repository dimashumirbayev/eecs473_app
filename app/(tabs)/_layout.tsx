import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
    return (
    <Tabs
        screenOptions={{
            tabBarActiveTintColor: "#000000", // Color of the icon itself
            tabBarActiveBackgroundColor: "#ffd33d", // Color to indicate selected tab
            headerShadowVisible: false,
        }}
    >
    <Tabs.Screen
        name="index"
        options={{
            href: null,
        }}/>
    <Tabs.Screen
        name="home"
        options={{
            headerTitle: "Home",
            tabBarIcon: ({ focused, color }) =>
                <Ionicons
                    name = {"barbell-outline"}
                    size = {30}
                />,
        }}/>
    <Tabs.Screen
        name="recordings"
        options={{
            headerTitle: "Recordings",
            tabBarIcon: ({ focused, color }) =>
                <Ionicons
                    name = {focused ? "videocam" : "videocam-outline"}
                    size = {30}
                />,
        }}/>
    <Tabs.Screen
        name="settings"
        options={{
            headerTitle: "Settings",
            tabBarIcon: ({ focused, color }) =>
                <Ionicons
                    name = {focused ? "settings-sharp" : "settings-outline"}
                    size = {26}
                />,
        }}/>
    </Tabs>
    )
}
