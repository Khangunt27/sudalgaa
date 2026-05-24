import { ClerkProvider } from "@clerk/clerk-expo";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { TripProvider } from "./context/TripContext";
import "./global.css";
import TabNavigator from "./navigation/TabNavigator";
import * as SecureStore from "expo-secure-store";
import RootNavigator from "./navigation/RootNavigator";
import { LanguageProvider } from "./contexts/LanguageContext";

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return await SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

export default function App() {
  if (!clerkPublishableKey) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Missing Clerk publishable key</Text>
        <Text style={styles.errorText}>
          Add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` to `mongo/.env`, then restart Expo.
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <LanguageProvider>
        <TripProvider>
          <NavigationContainer>
            {/* <TabNavigator /> */}
            <RootNavigator />
          </NavigationContainer>
        </TripProvider>
      </LanguageProvider>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
  },
});
