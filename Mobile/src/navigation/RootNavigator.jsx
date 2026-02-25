import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { LandingScreen } from "../screens/LandingScreen";
import { AuthScreen } from "../screens/AuthScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { ReportsScreen } from "../screens/ReportsScreen";
import { AdminScreen } from "../screens/AdminScreen";
import { palette } from "../theme/palette";

const Stack = createNativeStackNavigator();

function BootScreen() {
  return (
    <View style={styles.boot}>
      <ActivityIndicator size="large" color={palette.blue600} />
    </View>
  );
}

export function RootNavigator() {
  const { isAuthenticated, bootstrapping } = useAuth();

  if (bootstrapping) return <BootScreen />;

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f7fb",
  },
});
