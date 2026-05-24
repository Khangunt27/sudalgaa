import { useClerk, useUser } from "@clerk/clerk-expo";
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import dayjs from "dayjs";
import { HomeStackParamList } from "../navigation/HomeStack";
import { useLanguage } from "../contexts/LanguageContext";
import { API_URL, getErrorMessage } from "../constants/api";

export type TabNavigatorParamList = {
  Home: { screen?: string; params?: any };
  Guides: undefined;
  Profile: undefined;
};

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  TabNavigatorParamList & HomeStackParamList
>;

const ProfileScreen = () => {
  const { language, setLanguage, t } = useLanguage();
  const { signOut } = useClerk();
  const { user } = useUser();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [trips, setTrips] = useState<any[]>([]);
  const [rawTrips, setRawTrips] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const profileCopy = {
    premium: language === "mn" ? "Сонгомол аялагч" : language === "ja" ? "プレミアムトラベラー" : "Premium Traveler",
    settings: language === "mn" ? "Тохиргоо" : language === "ja" ? "設定" : "Settings",
    trips: language === "mn" ? "Аялал" : language === "ja" ? "旅行" : "Trips",
    followers: language === "mn" ? "Дагагч" : language === "ja" ? "フォロワー" : "Followers",
    myTrips: language === "mn" ? "Миний аяллууд" : language === "ja" ? "私の旅" : "My Trips",
    spots: language === "mn" ? "цэг" : language === "ja" ? "スポット" : "Spots",
    startIn: language === "mn" ? "Эхлэхэд" : language === "ja" ? "開始まで" : "Start in",
    days: language === "mn" ? "хоног" : language === "ja" ? "日" : "d",
    noTrips: language === "mn" ? "Аялал хараахан алга" : language === "ja" ? "まだ旅行がありません" : "No trips yet",
  };

  const fetchTrips = useCallback(async () => {
    try {
      const clerkUserId = user?.id;
      if (!clerkUserId) {
        setError(t("user_not_authenticated_simple"));
        return;
      }

      const response = await axios.get(`${API_URL}/api/trips`, {
        params: { clerkUserId },
        timeout: 10000,
      });

      const formattedTrips = response.data.trips.map((trip: any) => ({
        id: trip._id,
        name: trip.tripName,
        date: `${dayjs(trip.startDate).format("D MMM")} - ${dayjs(trip.endDate).format("D MMM, YYYY")}`,
        image: trip.background || "https://images.unsplash.com/photo-1578662996442-48f60103fc96",
        places: trip.placesToVisit?.length || 0,
        daysLeft: dayjs(trip.startDate).isAfter(dayjs()) ? dayjs(trip.startDate).diff(dayjs(), "day") : null,
      }));

      setTrips(formattedTrips);
      setRawTrips(response.data.trips);
      setError(null);
    } catch (fetchError: any) {
      console.error("Error fetching trips:", fetchError);
      setError(getErrorMessage(fetchError));
    }
  }, [t, user]);

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [fetchTrips])
  );

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fff7ed]">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient
          colors={["#1f2937", "#7c2d12", "#ea580c"]}
          className="pt-12 pb-16 px-6 rounded-b-[48px] shadow-2xl items-center"
        >
          <View className="relative">
            <Image
              source={{ uri: user.imageUrl }}
              className="w-32 h-32 rounded-[40px] border-4 border-white/20 shadow-xl"
            />
            <View className="absolute -bottom-2 -right-2 bg-white/20 p-2 rounded-2xl border-4 border-orange-900/40">
              <MaterialCommunityIcons name="shield-check" size={24} color="white" />
            </View>
          </View>

          <Text className="mt-6 text-2xl font-black text-white">{user.fullName}</Text>
          <Text className="text-orange-100 font-bold mb-4 uppercase tracking-tighter text-xs">{profileCopy.premium}</Text>

          <View className="flex-row bg-white/10 p-4 rounded-3xl border border-white/10 w-full justify-around">
            <View className="items-center">
              <Text className="text-white text-xl font-black">{trips.length}</Text>
              <Text className="text-orange-100/70 text-[10px] font-bold uppercase">{profileCopy.trips}</Text>
            </View>
            <View className="w-[1] h-full bg-white/10" />
            <View className="items-center">
              <Text className="text-white text-xl font-black">2.4k</Text>
              <Text className="text-orange-100/70 text-[10px] font-bold uppercase">{profileCopy.followers}</Text>
            </View>
          </View>
        </LinearGradient>

        <View className="px-6 -mt-8">
          <View className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200 border border-orange-100">
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">{profileCopy.settings}</Text>

            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
                <View className="bg-orange-50 p-2.5 rounded-2xl mr-4">
                  <Ionicons name="language" size={20} color="#ea580c" />
                </View>
                <Text className="text-slate-800 font-bold text-base">{t("language_label") || "Language"}</Text>
              </View>
              <View className="flex-row bg-slate-100 p-1 rounded-2xl">
                {["mn", "en", "ja"].map((l) => (
                  <TouchableOpacity
                    key={l}
                    onPress={() => setLanguage(l as any)}
                    className={`px-4 py-1.5 rounded-xl ${language === l ? "bg-white shadow-sm" : ""}`}
                  >
                    <Text className={`text-[10px] font-black uppercase ${language === l ? "text-orange-600" : "text-slate-400"}`}>
                      {l}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity onPress={handleSignOut} className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="bg-red-50 p-2.5 rounded-2xl mr-4">
                  <Ionicons name="log-out" size={20} color="#ef4444" />
                </View>
                <Text className="text-slate-800 font-bold text-base">{t("sign_out") || "Sign Out"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          <Text className="mt-10 mb-6 text-xl font-black text-slate-900">{profileCopy.myTrips}</Text>

          {error ? (
            <View className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6">
              <Text className="text-rose-700 text-sm">{error}</Text>
            </View>
          ) : null}

          {trips.length === 0 ? (
            <View className="bg-white rounded-[32px] p-8 items-center border border-orange-100">
              <Ionicons name="airplane-outline" size={34} color="#f97316" />
              <Text className="text-slate-500 font-semibold mt-3">{profileCopy.noTrips}</Text>
            </View>
          ) : (
            trips.map((trip, index) => (
              <Pressable
                key={trip.id}
                onPress={() => navigation.navigate("Home", { screen: "PlanTrip", params: { trip: rawTrips[index] } })}
                className="bg-white rounded-[32px] mb-6 overflow-hidden shadow-lg shadow-slate-200 border border-orange-100"
              >
                <Image source={{ uri: trip.image }} className="w-full h-40" resizeMode="cover" />
                <LinearGradient colors={["transparent", "rgba(15,23,42,0.9)"]} className="absolute inset-0 h-40" />

                <View className="p-6">
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="flex-1 text-lg font-black text-slate-900 mr-2">{trip.name}</Text>
                    <View className="bg-orange-50 px-3 py-1 rounded-full">
                      <Text className="text-[10px] font-black text-orange-600 uppercase">{trip.places} {profileCopy.spots}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={14} color="#64748b" />
                    <Text className="text-slate-500 text-xs font-bold ml-2">{trip.date}</Text>
                  </View>
                </View>

                {trip.daysLeft ? (
                  <View className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                    <Text className="text-white text-[10px] font-black uppercase">
                      {profileCopy.startIn} {trip.daysLeft}{profileCopy.days}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
