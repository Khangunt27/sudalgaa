import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { useFocusEffect, useNavigation, CompositeNavigationProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import WeekendTrips from "../components/WeekendTrips";
import PopularDestinations from "../components/PopularDestinations";
import FeaturedGuides from "../components/FeaturedGuides";
import AimagGrid from "../components/AimagGrid";
import OrbitPlannerHero from "../components/OrbitPlannerHero";
import MonGoTripLogo from "../components/MonGoTripLogo";
import { useUser } from "@clerk/clerk-expo";
import axios from "axios";
import { API_URL, getErrorMessage } from "../constants/api";
import { useLanguage } from "../contexts/LanguageContext";
import { HomeStackParamList } from "../navigation/HomeStack";

type TabNavigatorParamList = {
  Home: undefined;
  Guides: undefined;
  Profile: undefined;
};

type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, "HomeMain">,
  BottomTabNavigationProp<TabNavigatorParamList>
>;

export default function HomeScreen() {
  const { t, language } = useLanguage();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useUser();
  const [trips, setTrips] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [floatAnim] = useState(() => new Animated.Value(0));
  const [glowAnim] = useState(() => new Animated.Value(0.72));
  const animatedDriver = Platform.OS !== "web";

  const copy = {
    greetingMorning: language === "mn" ? "Өглөөний мэнд" : language === "ja" ? "おはよう" : "Good morning",
    greetingAfternoon: language === "mn" ? "Өдрийн мэнд" : language === "ja" ? "こんにちは" : "Good afternoon",
    greetingEvening: language === "mn" ? "Оройн мэнд" : language === "ja" ? "こんばんは" : "Good evening",
    logoSubtitle: language === "mn" ? "Монгол аяллын урсгал" : language === "ja" ? "モンゴル旅のフロー" : "Mongolia travel flow",
    heroTitle: language === "mn" ? "Монголыг илүү гоё мэдэр" : language === "ja" ? "モンゴルをもっと美しく旅しよう" : "Feel Mongolia in a richer way",
    heroDescription:
      language === "mn"
        ? "Зураг, газрын зураг, гайд, төлөвлөгөөг нэг урсгалд холбосон аяллын төв."
        : language === "ja"
          ? "写真、地図、ガイド、旅程をひとつにつないだ旅行ハブ。"
          : "A travel hub that brings photos, maps, guides, and itineraries into one flow.",
    newBadge: language === "mn" ? "Шинэ" : language === "ja" ? "新着" : "New",
    mongoliaLabel: language === "mn" ? "Монгол" : language === "ja" ? "モンゴル" : "Mongolia",
    aiPlannerTitle: language === "mn" ? "AI-аар аяллаа төлөвлө" : language === "ja" ? "AIで旅を計画" : "Plan Your Trip With AI",
    aiPlannerSubtitle:
      language === "mn"
        ? "Том товч дээр дархад AI маршрут, санаа, аяллын урсгал гаргаж өгнө."
        : language === "ja"
          ? "大きなボタンを押すと、AIが旅程やアイデアを提案します。"
          : "Tap the big button and let AI suggest the route, rhythm, and ideas for your trip.",
    aiPlannerButton: language === "mn" ? "AI Planner" : language === "ja" ? "AIプランナー" : "AI Planner",
    aiPlannerAction: language === "mn" ? "Төлөвлөж эхлэх" : language === "ja" ? "計画を始める" : "Start Planning",
    aiOrbitHint: language === "mn" ? "Онгоц таны аяллыг тойрч байна" : language === "ja" ? "飛行機が旅の軌道を描いています" : "Your flight path is already in motion",
    bannerSubtitle:
      language === "mn"
        ? "Монголын онцгой цэгүүдийг нэг урсгалаар төлөвлө"
        : language === "ja"
          ? "モンゴルの印象的なスポットをひとつの流れで計画"
          : "Plan Mongolia's most memorable places in one flow",
  };

  const fetchTrips = useCallback(async () => {
    try {
      const clerkUserId = user?.id;
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!clerkUserId) {
        setError(t("user_not_authenticated_simple"));
        return;
      }

      const response = await axios.get(`${API_URL}/api/trips`, {
        params: { clerkUserId, email },
        timeout: 10000,
      });

      setTrips(response.data.trips || []);
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  }, [t, user]);

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [fetchTrips])
  );

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: animatedDriver,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: animatedDriver,
        }),
      ])
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: animatedDriver,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.55,
          duration: 2500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: animatedDriver,
        }),
      ])
    );

    floatLoop.start();
    glowLoop.start();

    return () => {
      floatLoop.stop();
      glowLoop.stop();
    };
  }, [animatedDriver, floatAnim, glowAnim]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return copy.greetingMorning;
    if (hour < 18) return copy.greetingAfternoon;
    return copy.greetingEvening;
  };

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const rotateAnim = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "4deg"],
  });

  return (
    <SafeAreaView className="flex-1 bg-[#fff7ed]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#1c1917", "#7c2d12", "#f97316"]} className="px-6 pt-4 pb-14 rounded-b-[44px] overflow-hidden">
          <Animated.View
            style={[
              styles.heroOrbLarge,
              {
                pointerEvents: "none" as any,
                opacity: glowAnim,
                transform: [{ translateY: floatTranslate }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.heroOrbSmall,
              {
                pointerEvents: "none" as any,
                opacity: glowAnim,
                transform: [{ rotate: rotateAnim }],
              },
            ]}
          />

          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-orange-200 text-xs font-bold uppercase mb-2" style={styles.kickerText}>
                {getGreeting()}
              </Text>
              <MonGoTripLogo subtitle={copy.logoSubtitle} />
            </View>
            <TouchableOpacity
              className="border border-white/20 p-1 rounded-2xl bg-white/10"
              onPress={() => navigation.navigate("Profile")}
            >
              <Image
                source={{ uri: user?.imageUrl || "https://cdn-icons-png.flaticon.com/128/149/149071.png" }}
                className="w-12 h-12 rounded-xl"
              />
            </TouchableOpacity>
          </View>

          <View className="mb-8">
            <Text className="text-white text-[34px] leading-10 font-black max-w-[300px]">
              {copy.heroTitle}
            </Text>
            <Text className="text-orange-100/90 text-sm leading-6 font-medium mt-3 max-w-[330px]">
              {copy.heroDescription}
            </Text>
          </View>
        </LinearGradient>

        <View className="px-6 -mt-8">
          <OrbitPlannerHero
            eyebrow={copy.aiPlannerButton}
            title={copy.aiPlannerTitle}
            subtitle={copy.aiPlannerSubtitle}
            buttonLabel={copy.aiPlannerAction}
            orbitHint={copy.aiOrbitHint}
            onPress={() => navigation.navigate("NewTrip")}
          />

          <TouchableOpacity activeOpacity={0.92} onPress={() => navigation.navigate("NewTrip")} style={styles.bannerShadow}>
            <LinearGradient colors={["#111827", "#1d4ed8", "#06b6d4"]} className="w-full h-56 rounded-3xl p-6 justify-between overflow-hidden">
              <Animated.View
                style={[
                  styles.bannerGlass,
                  {
                    pointerEvents: "none" as any,
                    transform: [{ translateY: floatTranslate }],
                  },
                ]}
              />
              <View className="bg-white/20 self-start px-2 py-1 rounded-md">
                <Text className="text-white text-[10px] font-bold uppercase tracking-tighter">{copy.newBadge}</Text>
              </View>
              <View>
                <Text className="text-white text-2xl font-black mb-1">{t("plan_next_adventure")}</Text>
                <Text className="text-blue-100/90 text-sm font-medium mb-4">{copy.bannerSubtitle}</Text>
                <View className="flex-row items-center">
                  <Text className="text-white font-bold text-base mr-2">{t("create_new_trip_plan")}</Text>
                  <Ionicons name="chevron-forward-circle" size={20} color="#67e8f9" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {error ? (
          <View className="px-6 mt-6">
            <View className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
              <Text className="text-rose-700 text-sm">{error}</Text>
            </View>
          </View>
        ) : null}

        {trips.length > 0 && (
          <View className="px-6 mt-10">
            <View className="flex-row justify-between items-end mb-4">
              <Text className="text-xl font-bold text-slate-900">{t("continue_planning")}</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                <Text className="text-sm font-bold text-orange-700">{t("see_all")}</Text>
              </TouchableOpacity>
            </View>

            {trips.slice(0, 1).map((trip) => (
              <TouchableOpacity
                key={trip._id}
                className="bg-white rounded-[28px] p-4 flex-row items-center shadow-md border border-orange-100"
                onPress={() => navigation.navigate("PlanTrip", { trip })}
              >
                <Image source={{ uri: trip.background }} className="w-20 h-20 rounded-2xl mr-4" resizeMode="cover" />
                <View className="flex-1">
                  <Text className="text-lg font-bold text-slate-900 mb-1" numberOfLines={1}>
                    {trip.tripName}
                  </Text>
                  <View className="flex-row items-center">
                    <View className="flex-row items-center mr-4">
                      <Ionicons name="location" size={14} color="#ea580c" />
                      <Text className="text-xs text-slate-500 font-bold ml-1 uppercase">{copy.mongoliaLabel}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="map-outline" size={14} color="#64748b" />
                      <Text className="text-xs text-slate-500 font-bold ml-1 uppercase">
                        {trip.placesToVisit?.length || 0} {t("places")}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="bg-orange-50 p-2 rounded-full">
                  <Ionicons name="arrow-forward" size={20} color="#c2410c" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View className="mt-10 px-6">
          <Text className="text-xl font-bold text-slate-900 mb-6">{t("featured_guides")}</Text>
          <FeaturedGuides onGuidePress={() => navigation.navigate("Guides" as any)} />
        </View>

        <View className="mt-8 px-6">
          <Text className="text-xl font-bold text-slate-900 mb-6">{t("weekend_trips")}</Text>
          <WeekendTrips />
        </View>

        <View className="mt-8 px-6">
          <Text className="text-xl font-bold text-slate-900 mb-6">{t("popular_destinations")}</Text>
          <PopularDestinations />
        </View>

        <View className="mt-8 mb-10 px-6">
          <Text className="text-xl font-bold text-slate-900 mb-6">{t("provinces") || "21 Provinces"}</Text>
          <AimagGrid />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  kickerText: {
    letterSpacing: 3,
  },
  bannerShadow: {
    ...Platform.select({
      web: {
        boxShadow: "0 14px 24px rgba(124,45,18,0.24)",
      } as any,
      default: {
        shadowColor: "#7c2d12",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.24,
        shadowRadius: 20,
        elevation: 16,
      },
    }),
  },
  heroOrbLarge: {
    position: "absolute",
    top: 90,
    right: -10,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroOrbSmall: {
    position: "absolute",
    top: 180,
    right: 100,
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  bannerGlass: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
});
