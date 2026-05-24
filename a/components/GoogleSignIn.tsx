import { useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

export default function GoogleSignIn() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  useWarmUpBrowser();

  const onGoogleSignInPress = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/"),
      });

      if (createdSessionId) {
        await setActive?.({ session: createdSessionId });
      } else {
        setError("Google sign-in incomplete. Please try again.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }, [startOAuthFlow]);

  return (
    <View className="w-full">
      {error ? <Text className="text-red-500 text-sm text-center mb-3">{error}</Text> : null}
      <TouchableOpacity
        className="w-full border border-gray-300 py-3 mt-3 rounded-lg flex-row justify-center items-center bg-white"
        onPress={onGoogleSignInPress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : (
          <>
            <Image
              source={{ uri: "https://www.google.com/favicon.ico" }}
              className="w-5 h-5 mr-2"
            />
            <Text className="text-gray-900 text-base font-semibold">{t("sign_in_with_google")}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
