import { useSignUp } from "@clerk/clerk-expo";
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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigation = useNavigation<NavigationProp>();
  const { t } = useLanguage();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      await signUp.create({ emailAddress, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({ code });
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
      } else {
        setError("Verification incomplete. Please check your code.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0f172a", "#1e293b", "#334155"]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="person-add" size={40} color="#38bdf8" />
            </View>
            <Text style={styles.title}>{t("sign_up_title")}</Text>
            <Text style={styles.subtitle}>{t("sign_up_subtitle")}</Text>
          </View>

          <View style={styles.glassCard}>
            {pendingVerification ? (
              <>
                <Text style={styles.cardTitle}>{t("verify_email")}</Text>
                <Text style={styles.cardSubtitle}>{t("verify_email_help")}</Text>

                <View style={styles.inputContainer}>
                  <Ionicons name="key-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={code}
                    placeholder={t("verification_code")}
                    placeholderTextColor="#94a3b8"
                    onChangeText={setCode}
                    keyboardType="number-pad"
                  />
                </View>

                {error ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={onVerifyPress} disabled={loading}>
                  <LinearGradient colors={["#10b981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
                    <Text style={styles.buttonText}>{loading ? t("verifying_action") : t("verify_cta")}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>{t("sign_up_title")}</Text>

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

                <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={onSignUpPress} disabled={loading}>
                  <LinearGradient colors={["#0ea5e9", "#2563eb"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
                    <Text style={styles.buttonText}>{loading ? t("loading_action") : t("sign_up_cta")}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>{t("have_account")} </Text>
                  <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
                    <Text style={styles.footerLink}>{t("sign_in_title")}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    fontSize: 28,
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
    marginBottom: 12,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
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
