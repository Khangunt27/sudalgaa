import { useSignIn } from "@clerk/clerk-expo";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import React, { useState } from "react";
import GoogleSignIn from "../components/GoogleSignIn";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const navigation = useNavigation<NavigationProp>();
  const { t } = useLanguage();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignInPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError("");

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
      } else {
        setError("Sign-in incomplete. Please check your credentials.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0f172a", "#1e293b", "#334155"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="airplane" size={40} color="#38bdf8" />
            </View>
            <Text style={styles.title}>GuneTravel</Text>
            <Text style={styles.subtitle}>{t("sign_in_subtitle")}</Text>
          </View>

          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>{t("sign_in_title")}</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                value={emailAddress}
                placeholder={t("email_label")}
                placeholderTextColor="#94a3b8"
                onChangeText={setEmailAddress}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                placeholder={t("password_label")}
                placeholderTextColor="#94a3b8"
                secureTextEntry
                onChangeText={setPassword}
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={onSignInPress} disabled={loading}>
              <LinearGradient colors={["#0ea5e9", "#2563eb"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
                <Text style={styles.buttonText}>{loading ? t("loading_action") : t("continue_cta")}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <GoogleSignIn />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t("no_account_yet")} </Text>
              <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                <Text style={styles.footerLink}>{t("create_account")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.2)",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#f8fafc",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 8,
    textAlign: "center",
  },
  glassCard: {
    backgroundColor: "rgba(30, 41, 59, 0.76)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: "#f8fafc",
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginLeft: 8,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(148, 163, 184, 0.2)",
  },
  dividerText: {
    color: "#94a3b8",
    paddingHorizontal: 16,
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#94a3b8",
    fontSize: 15,
  },
  footerLink: {
    color: "#38bdf8",
    fontSize: 15,
    fontWeight: "600",
  },
});
