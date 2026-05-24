import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import dayjs from "dayjs";
import { useNavigation } from "@react-navigation/native";
import { useTrip } from "../context/TripContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useAuth, useUser } from "@clerk/clerk-expo";
import axios from "axios";
import { AIMAGS } from "../constants/aimags";
import { API_URL, getErrorMessage, isNetworkError } from "../constants/api";
import { useLanguage } from "../contexts/LanguageContext";
import { createPlaceholderImage } from "../constants/imageFallback";

const NewTripScreen = () => {
  const { t } = useLanguage();
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [displayStart, setDisplayStart] = useState<string>("");
  const [displayEnd, setDisplayEnd] = useState<string>("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [chosenLocation, setChosenLocation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // New loading state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ description: string; place_id: string; image?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [bgPhoto, setBgPhoto] = useState<string | null>(null);
  const [aimags, setAimags] = useState<Array<{ name: string; image: string }>>([]);

  const FALLBACK_AIMAGS: Array<{ name: string; image: string }> = AIMAGS.map(a => ({ name: a.name, image: a.image }));
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { addTrip } = useTrip();
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();
  const { user } = useUser();

  const today = dayjs().format("YYYY-MM-DD");

  const handleDayPress = (day: any) => {
    const selected = day.dateString;

    if (
      !selectedRange.startDate ||
      (selectedRange.startDate && selectedRange.endDate)
    ) {
      setSelectedRange({ startDate: selected });
    } else if (
      selectedRange.startDate &&
      dayjs(selected).isAfter(selectedRange.startDate)
    ) {
      setSelectedRange({
        ...selectedRange,
        endDate: selected,
      });
    }
  };

  const getMarkedDates = () => {
    const marks: any = {};

    const { startDate, endDate } = selectedRange;
    if (startDate && !endDate) {
      marks[startDate] = {
        startingDay: true,
        endingDay: true,
        color: "#FF5722",
        textColor: "white",
      };
    } else if (startDate && endDate) {
      let curr = dayjs(startDate);
      const end = dayjs(endDate);

      while (curr.isBefore(end) || curr.isSame(end)) {
        const formatted = curr.format("YYYY-MM-DD");
        marks[formatted] = {
          color: "#FF5722",
          textColor: "white",
          ...(formatted === startDate && { startingDay: true }),
          ...(formatted === endDate && { endingDay: true }),
        };
        curr = curr.add(1, "day");
      }
    }

    return marks;
  };

  const onSaveDates = () => {
    if (selectedRange.startDate) setDisplayStart(selectedRange.startDate);
    if (selectedRange.endDate) setDisplayEnd(selectedRange.endDate);
    setCalendarVisible(false);
  };

  const fetchSuggestions = async (text: string) => {
    try {
      setIsSearching(true);
      // Prefer backend; gracefully fall back to built-in list when 404/unavailable
      let source = aimags;
      if (source.length === 0) {
        try {
          const r = await axios.get(`${API_URL}/api/places/aimags`, {
            timeout: 5000, // 5 second timeout
          });
          source = r.data?.items || [];
          setAimags(source);
        } catch (e: any) {
          // Silently fall back to local data if server is unavailable
          if (isNetworkError(e)) {
            console.warn('Server unavailable, using fallback aimags data');
          }
          source = FALLBACK_AIMAGS;
          setAimags(FALLBACK_AIMAGS);
        }
      }
      const filtered = (text ? source.filter((a: any) => a.name.toLowerCase().includes(text.toLowerCase())) : source)
        .map((a: any) => ({ description: a.name, place_id: a.name, image: a.image }));
      setSuggestions(filtered);
    } catch (e) {
      // Last resort: filter the fallback data
      const filtered = (text ? FALLBACK_AIMAGS.filter((a: any) => a.name.toLowerCase().includes(text.toLowerCase())) : FALLBACK_AIMAGS)
        .map((a: any) => ({ description: a.name, place_id: a.name, image: a.image }));
      setSuggestions(filtered);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateTrip = async () => {
    try {
      setIsLoading(true); // Show loading
      setError(null);

      // Validate required fields
      if (!chosenLocation || !selectedRange.startDate || !selectedRange.endDate) {
        setError(t('please_select_location_date'));
        return;
      }

      // Get Clerk user data
      const clerkUserId = user?.id;
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!clerkUserId || !email) {
        setError(t('user_not_authenticated'));
        return;
      }

      // Background without Google key (use selected photo if available)
      let background = bgPhoto || createPlaceholderImage("Trip", 800, 400);

      // Prepare trip data
      const tripData = {
        tripName: chosenLocation,
        startDate: selectedRange.startDate,
        endDate: selectedRange.endDate,
        startDay: dayjs(selectedRange.startDate).format("dddd"),
        endDay: dayjs(selectedRange.endDate).format("dddd"),
        background, // Use dynamic background
        clerkUserId,
        userData: {
          email,
          name: user?.fullName || "",
        },
      };

      // Get token for authentication
      const token = await getToken();

      // Send request to backend
      const response = await axios.post(`${API_URL}/api/trips`, tripData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000, // 10 second timeout
      });

      const createdTrip = response.data.trip;

      // Add trip to context
      addTrip(createdTrip);

      // Navigate to PlanTrip with the created trip
      navigation.navigate("PlanTrip" as any, { trip: createdTrip } as any);
    } catch (error: any) {
      console.error("Error creating trip:", error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);

      // If it's a network error, provide additional guidance
      if (isNetworkError(error)) {
        console.error('Backend server is not running. Please start it with: cd api && npm start');
      }
    } finally {
      setIsLoading(false); // Hide loading
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-5">
      {/* Close Button */}
      <View className="mt-2 mb-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Title and Subtitle */}
      <Text className="text-2xl font-bold text-gray-900 mb-1">
        {t('plan_new_trip')}
      </Text>
      <Text className="text-base text-gray-500 mb-6">
        {t('build_itinerary')}
      </Text>

      {/* Where to Input */}
      <TouchableOpacity
        onPress={() => setSearchVisible(true)}
        className="border border-gray-300 rounded-xl px-4 py-3 mb-4"
      >
        <Text className="text-sm font-semibold text-gray-700 mb-1">
          {t('where_to')}
        </Text>
        <Text className="text-base text-gray-500">
          {chosenLocation || t('example_locations')}
        </Text>
      </TouchableOpacity>

      {/* Date Inputs */}
      <TouchableOpacity
        className="flex-row border border-gray-300 rounded-xl px-4 py-3 justify-between mb-4"
        onPress={() => setCalendarVisible(true)}
      >
        <View className="flex-1 mr-2">
          <Text className="text-sm font-semibold text-gray-700 mb-1">
            {t('dates_optional')}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="calendar" size={16} color="#666" className="mr-1" />
            <Text className="text-sm text-gray-500">
              {displayStart
                ? dayjs(displayStart).format("MMM D")
                : t('start_date')}
            </Text>
          </View>
        </View>
        <View className="flex-1 ml-2">
          <Text className="text-sm font-semibold text-gray-700 mb-1 invisible">
            .
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="calendar" size={16} color="#666" className="mr-1" />
            <Text className="text-sm text-gray-500">
              {displayEnd ? dayjs(displayEnd).format("MMM D") : t('end_date')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View className="flex-row justify-between items-center mb-8">
        <TouchableOpacity onPress={() => alert('Аялагч урих цонх удахгүй нээгдэнэ.')}>
          <Text className="text-sm text-primary font-medium">
            {t('invite_tripmate')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center" onPress={() => alert('Найзуудын жагсаалт ачааллаж байна...')}>
          <Ionicons name="people" size={16} color="#0066CC" />
          <Text className="ml-1 text-sm text-primary font-medium">
            {t('friends')}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color="#0066CC"
            className="ml-1"
          />
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <Text className="text-red-500 text-sm mb-4">{error}</Text>
      )}

      {/* Start Planning Button */}
      <TouchableOpacity
        onPress={handleCreateTrip}
        className="bg-orange-500 rounded-full py-3 items-center mb-4"
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">
            {t('start_planning')}
          </Text>
        )}
      </TouchableOpacity>

      {/* Example Link */}
      <Text className="text-sm text-gray-500 text-center">
        {t('or_see_example')}{" "}
        <Text className="font-semibold text-gray-600">Улаанбаатар</Text>
      </Text>

      {/* Calendar Modal */}
      <Modal animationType="slide" transparent visible={calendarVisible}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-white rounded-2xl w-11/12">
            <Calendar
              markingType={"period"}
              markedDates={getMarkedDates()}
              onDayPress={handleDayPress}
              minDate={today}
              theme={{
                todayTextColor: "#FF5722",
                arrowColor: "#00BFFF",
                selectedDayTextColor: "#fff",
              }}
            />
            <Pressable
              className="p-4 border-t border-gray-200 items-center"
              onPress={onSaveDates}
            >
              <Text className="text-gray-700 font-semibold">{t('save')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Search Overlay Modal */}
      <Modal animationType="fade" visible={searchVisible}>
        <SafeAreaView className="flex-1 bg-white pt-10 px-4">
          {/* Header */}
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => setSearchVisible(false)}
              className="mr-3"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">
              {t('search_for_place')}
            </Text>
          </View>

          {/* Backend-powered search (no Google key needed) */}
          <View>
            <View className="flex-row items-center bg-[#f1f1f1] rounded-full px-3 py-2">
              <Ionicons name="search" size={18} color="#666" />
              <TextInput
                className="flex-1 ml-2 h-10"
                placeholder={t('search_for_place')}
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={(t) => {
                  setSearchQuery(t);
                  if (t && t.length > 1) {
                    fetchSuggestions(t);
                  } else {
                    setSuggestions([]);
                  }
                }}
                autoFocus
              />
            </View>

            {isSearching && (
              <View className="mt-3 items-center"><ActivityIndicator /></View>
            )}

            <View className="mt-3">
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.place_id}
                  className="py-3 border-b border-gray-200"
                  onPress={async () => {
                    // Use aimag image directly
                    setChosenLocation(item.description);
                    setBgPhoto(item.image || null);
                    setSearchVisible(false);
                  }}
                >
                  <Text className="text-gray-800">{item.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default NewTripScreen;
