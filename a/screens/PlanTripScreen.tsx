import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import {
  RouteProp,
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { HomeStackParamList } from "../navigation/HomeStack";
import { Platform } from 'react-native';
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useAuth, useUser } from "@clerk/clerk-expo";
import axios from "axios";
import { API_URL, getErrorMessage, isNetworkError } from "../constants/api";
import { useLanguage } from "../contexts/LanguageContext";
import { curatedPlans } from "../constants/ubPlan";
import AppModal from "../components/AppModal";

dayjs.extend(customParseFormat);

const PlanTripScreen = () => {
  const { t, language } = useLanguage();
  const navigation = useNavigation() as any;
  const route = useRoute<RouteProp<HomeStackParamList, "PlanTrip">>();
  const { trip: initialTrip } = route.params;
  const [trip, setTrip] = useState(initialTrip || {});
  const [showNotes, setShowNotes] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [selectedTab, setSelectedTab] = useState("Overview");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<
    "place" | "expense" | "editExpense" | "ai" | "aiItinerary"
  >("place");
  const [aiItineraryModalVisible, setAiItineraryModalVisible] = useState(false);
  const [researchModalVisible, setResearchModalVisible] = useState(false);
  const [aiItineraryProgress, setAiItineraryProgress] = useState<string>("");
  const [generatedItinerary, setGeneratedItinerary] = useState<any[]>([]);
  const [itineraryPreferences, setItineraryPreferences] = useState({
    budget: 'medium',
    interests: [] as string[],
    duration: 'full_day', // full_day, half_day, flexible
    includeHotels: true,
    includeFlights: false,
  });
  const [activePlace, setActivePlace] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<any[]>(trip.expenses || []);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    category: "",
    amount: "",
    paidBy: "",
    splitOption: t('dont_split'),
  });
  const [openSplitDropdown, setOpenSplitDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiPlaces, setAiPlaces] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedHighlightId, setExpandedHighlightId] = useState<string | null>(null);
  const [highlightImages, setHighlightImages] = useState<Record<string, string>>({});
  const [openTripSuggestions, setOpenTripSuggestions] = useState<any[]>([]);
  const [openTripLoading, setOpenTripLoading] = useState(false);
  const [openTripError, setOpenTripError] = useState<string | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [selectedActivitiesData, setSelectedActivitiesData] = useState<Map<string, any>>(new Map());
  const { getToken } = useAuth();
  const { user } = useUser();
  const activePlan = useMemo(() => {
    if (!trip?.tripName) return null;
    const lowerName = String(trip.tripName).toLowerCase();
    return (
      curatedPlans.find((plan) =>
        plan.destinationKeywords.some((keyword) =>
          lowerName.includes(keyword)
        )
      ) || null
    );
  }, [trip.tripName]);

  useEffect(() => {
    let isMounted = true;
    const enrichCuratedPlan = async () => {
      if (!activePlan) {
        if (isMounted) {
          setHighlightImages({});
          setOpenTripSuggestions([]);
          setOpenTripError(null);
          setOpenTripLoading(false);
        }
        return;
      }

      try {
        setOpenTripLoading(true);
        setOpenTripError(null);
        const highlightOrder = activePlan.days.flatMap((day) => day.highlights);

        // Fetch images individually for each highlight with specific English queries
        const imagePromises = highlightOrder.map(async (highlight) => {
          try {
            // Create contextually appropriate English query based on highlight title
            let query = '';
            const titleLower = highlight.title.toLowerCase();

            if (titleLower.includes('хоол') || titleLower.includes('зоог') || titleLower.includes('lunch') || titleLower.includes('food')) {
              query = 'Mongolian food restaurant traditional cuisine';
            } else if (titleLower.includes('музей') || titleLower.includes('museum')) {
              query = 'National Museum of Mongolia Ulaanbaatar';
            } else if (titleLower.includes('талбай') || titleLower.includes('square') || titleLower.includes('сухбаатар')) {
              query = 'Sukhbaatar Square Ulaanbaatar Mongolia';
            } else if (titleLower.includes('хийд') || titleLower.includes('monastery')) {
              query = 'Gandantegchinlen Monastery Ulaanbaatar';
            } else if (titleLower.includes('зайсан') || titleLower.includes('zaisan')) {
              query = 'Zaisan Memorial Ulaanbaatar viewpoint';
            } else if (titleLower.includes('ордон') || titleLower.includes('palace')) {
              query = 'Bogd Khan Palace Museum Ulaanbaatar';
            } else {
              // Fallback: use English translation or title with location
              query = `${highlight.title} ${trip.tripName || 'Ulaanbaatar'} Mongolia`;
            }

            const response = await axios.get(`${API_URL}/api/media/place-images`, {
              params: { name: query, contextName: trip.tripName || 'Mongolia', count: 1 },
              timeout: 8000,
            });

            if (response.data?.images?.[0]) {
              return {
                id: highlight.id,
                image: response.data.images[0],
              };
            }
          } catch (err) {
            console.warn(`Failed to fetch image for ${highlight.title}:`, err);
          }
          return { id: highlight.id, image: highlight.image }; // Fallback to default
        });

        const [imageResults, openTripRes] = await Promise.all([
          Promise.all(imagePromises),
          axios.get(`${API_URL}/api/opentripmap/places`, {
            params: {
              lat: activePlan.coordinates?.lat || 47.92123,
              lon: activePlan.coordinates?.lon || 106.918556,
              radius: activePlan.coordinates?.radius || 6000,
              limit: 8,
              lang: language,
            },
            timeout: 12000,
          }),
        ]);

        if (!isMounted) return;

        const imagesMap: Record<string, string> = {};
        imageResults.forEach((result) => {
          if (result) {
            imagesMap[result.id] = result.image;
          }
        });

        setHighlightImages(imagesMap);
        setOpenTripSuggestions(openTripRes.data?.places || []);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Curated enrichment error:', err);
        setOpenTripError(getErrorMessage(err));
        setOpenTripSuggestions([]);
        setHighlightImages({});
      } finally {
        if (isMounted) {
          setOpenTripLoading(false);
        }
      }
    };

    enrichCuratedPlan();

    return () => {
      isMounted = false;
    };
  }, [activePlan, language, trip.tripName]);


  // Initialize expenseForm with user data after user is available
  React.useEffect(() => {
    if (user?.fullName) {
      setExpenseForm(prev => ({
        ...prev,
        paidBy: user.fullName || "",
      }));
    }
  }, [user]);

  const categories = [
    t('flight'),
    t('lodging'),
    t('shopping'),
    t('activities'),
    t('sightseeing'),
    t('drinks'),
    t('food'),
    t('transportation'),
    t('entertainment'),
    t('miscellaneous'),
  ];

  const splitOptions = [
    { label: t('dont_split'), value: t('dont_split') },
    { label: t('everyone'), value: t('everyone') },
  ];

  const fetchTrip = useCallback(async () => {
    try {
      const clerkUserId = user?.id;
      if (!clerkUserId || !trip._id) {
        setError(t('user_or_trip_id_missing'));
        return;
      }

      const token = await getToken();
      const response = await axios.get(
        `${API_URL}/api/trips/${trip._id}`,
        {
          params: { clerkUserId },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000, // 10 second timeout
        }
      );

      setTrip(response.data.trip);
      setExpenses(response.data.trip.expenses || []);
      setError(null);
    } catch (error: any) {
      console.error("Error fetching trip:", error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);

      if (isNetworkError(error)) {
        console.warn('Backend server is not running. Please start it with: cd api && npm start');
      }
    }
  }, [trip._id, user]);

  useFocusEffect(
    useCallback(() => {
      fetchTrip();
    }, [fetchTrip])
  );

  const fetchAIPlaces = async () => {
    // Use trip location if activePlan coordinates not available
    const lat = activePlan?.coordinates?.lat || 47.92123; // Default Ulaanbaatar
    const lon = activePlan?.coordinates?.lon || 106.918556;
    const radius = activePlan?.coordinates?.radius || 6000;

    setAiLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/api/opentripmap/places`, {
        params: {
          lat,
          lon,
          radius,
          limit: 6,
          lang: language,
        },
        timeout: 12000,
      });

      const places = (response.data?.places || []).map((place: any, index: number) => {
        const lat = place.point?.lat ?? place.geometry?.location?.lat ?? 0;
        const lng = place.point?.lon ?? place.geometry?.location?.lng ?? 0;
        const primaryPhoto =
          place.image?.urls?.regular ||
          place.image?.urls?.full ||
          place.image?.urls?.small ||
          place.preview?.source ||
          null;

        return {
          id: place.xid ? `otm-${place.xid}` : `otm-${index}`,
          place_id: place.xid ? `otm-${place.xid}` : `otm-${index}`,
          name: place.name || place.name_en || t('unknown_place'),
          description: place.description || place.description_en || '',
          briefDescription:
            place.description || place.description_en ||
            `${t('located_in')} ${place.address || place.address_en || t('this_destination')}`,
          formatted_address: place.address || place.address_en || t('no_address_available'),
          photos: primaryPhoto ? [primaryPhoto] : [],
          image: place.image || null,
          rating: place.rating || 0,
          types: place.kinds ? place.kinds.split(',') : ["point_of_interest"],
          openingHours: [],
          phoneNumber: "",
          website: place.url || place.sources?.otm || "",
          geometry: {
            location: { lat, lng },
            viewport: {
              northeast: { lat: lat + 0.01, lng: lng + 0.01 },
              southwest: { lat: lat - 0.01, lng: lng - 0.01 },
            },
          },
          reviews: [],
        };
      });

      if (places.length === 0) {
        setError(t('no_places_added'));
      }

      setAiPlaces(places);
      setModalMode("ai");
      setModalVisible(true);
    } catch (error: any) {
      console.error("Error fetching OpenTripMap places:", error.message);
      setError(getErrorMessage(error));
    } finally {
      setAiLoading(false);
    }
  };

  const searchOpenTripMapPlaces = async (query: string) => {
    if (!query || query.trim().length < 3) return;

    setAiLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/api/places/autocomplete`, {
        params: { input: query },
        timeout: 10000,
      });

      const suggestions = response.data?.predictions || [];

      // Fetch details for each suggestion
      const placesPromises = suggestions.slice(0, 10).map(async (feature: any) => {
        try {
          const detailsResponse = await axios.get(`${API_URL}/api/places/details`, {
            params: { place_id: feature.place_id },
            timeout: 5000,
          });

          const place = detailsResponse.data?.result;
          const lat = place?.geometry?.location?.lat;
          const lng = place?.geometry?.location?.lng;

          if (!lat || !lng) return null;
          const photos = Array.isArray(place?.photos)
            ? place.photos
                .map((photo: any) => {
                  if (typeof photo === "string") return photo;
                  return photo?.url || photo?.photo_reference || null;
                })
                .filter(Boolean)
            : [];

          return {
            id: `search-${feature.place_id}`,
            xid: `search-${feature.place_id}`,
            place_id: feature.place_id,
            name: place?.name || feature.description || t('unknown_place'),
            description: place?.editorial_summary?.overview || '',
            briefDescription: place?.editorial_summary?.overview?.slice(0, 200) ||
              `${t('located_in')} ${trip.tripName || 'this area'}`,
            formatted_address: place?.formatted_address || t('no_address_available'),
            address: place?.formatted_address || '',
            photos,
            image: photos[0] || null,
            rating: 0,
            rate: 0,
            kinds: '',
            types: place?.types || ["point_of_interest"],
            openingHours: place?.opening_hours?.weekday_text || [],
            phoneNumber: place?.formatted_phone_number || "",
            website: place?.website || "",
            geometry: {
              location: { lat, lng },
              viewport: {
                northeast: { lat: lat + 0.01, lng: lng + 0.01 },
                southwest: { lat: lat - 0.01, lng: lng - 0.01 },
              },
            },
            reviews: place?.reviews || [],
          };
        } catch (err) {
          console.error('Error fetching place details:', err);
          return null;
        }
      });

      const places = (await Promise.all(placesPromises)).filter(p => p !== null);

      if (places.length === 0) {
        setError(t('no_places_found') || 'No places found');
      }

      setAiPlaces(places);
    } catch (error: any) {
      console.error("Error searching OpenTripMap places:", error.message);
      setError(getErrorMessage(error));
    } finally {
      setAiLoading(false);
    }
  };

  const enrichPlaceWithPhotos = useCallback(
    async (place: any) => {
      const enriched = { ...place };
      if (!enriched.photos || enriched.photos.length === 0) {
        try {
          const photoResponse = await axios.get(`${API_URL}/api/media/place-images`, {
            params: {
              name: enriched.name || trip.tripName || 'Mongolia',
              contextName: trip.tripName || 'Mongolia',
              count: 3,
            },
          });
          if (photoResponse.data?.images?.length > 0) {
            enriched.photos = photoResponse.data.images.filter(
              (url: string) =>
                url &&
                typeof url === "string" &&
                (url.startsWith("http") || url.startsWith("data:image"))
            );
          }
        } catch (photoError) {
          console.log("Could not fetch photos:", photoError);
        }
      }
      return enriched;
    },
    [trip.tripName]
  );

  const handleSinglePlaceMapView = useCallback(
    async (place: any) => {
      const enriched = await enrichPlaceWithPhotos(place);
      navigation.navigate("MapScreen", {
        places: [enriched],
        allowRemove: true,
      });
    },
    [enrichPlaceWithPhotos, navigation]
  );

  const handleAddPlace = async (data: any) => {
    try {
      const placeId = data.place_id || data.id || data.xid;
      if (!placeId && !data.name) {
        setError("Place data missing");
        return;
      }

      const token = await getToken();
      const payload = placeId && !placeId.startsWith('ai-') && !placeId.startsWith('otm-')
        ? { placeId }
        : { placeData: data };

      await axios.post(
        `${API_URL}/api/trips/${trip._id}/places`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      await fetchTrip();
      setModalVisible(false);
      setAiPlaces([]);
      setSearchQuery("");
      setSelectedDate(null);
    } catch (error: any) {
      console.error("Error adding place:", error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);

      if (isNetworkError(error)) {
        console.warn('Backend server is not running. Please start it with: cd api && npm start');
      }
    }
  };

  const handleAddPlaceToItinerary = async (place: any, date: string) => {
    try {
      if (!trip._id || !date) {
        setError("Trip ID or date missing");
        return;
      }

      const token = await getToken();
      const payload =
        place.id || place.place_id
          ? { placeId: place.id || place.place_id, date }
          : { placeData: normalizePlaceForTrip(place, trip.tripName || t('unknown_place')), date };

      await axios.post(
        `${API_URL}/api/trips/${trip._id}/itinerary`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000, // 10 second timeout
        }
      );

      await fetchTrip();
      setModalVisible(false);
      setSelectedDate(null);
    } catch (error: any) {
      console.error("Error adding place to itinerary:", error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);

      if (isNetworkError(error)) {
        console.warn('Backend server is not running. Please start it with: cd api && npm start');
      }
    }
  };

  const handleAddExpense = () => {
    if (
      !expenseForm.description ||
      !expenseForm.category ||
      !expenseForm.amount
    ) {
      setError("Please fill all expense fields");
      return;
    }

    const newExpense = {
      id: Date.now().toString(),
      ...expenseForm,
      price: parseFloat(expenseForm.amount),
      date: dayjs().format("YYYY-MM-DD"),
    };

    setExpenses((prev) => [...prev, newExpense]);
    setExpenseForm({
      description: "",
      category: "",
      amount: "",
      paidBy: "Sujan Anand",
      splitOption: "Don't Split",
    });
    setModalVisible(false);
    setModalMode("place");
  };

  const handleEditExpense = () => {
    if (
      !editingExpense ||
      !expenseForm.description ||
      !expenseForm.category ||
      !expenseForm.amount
    ) {
      setError("Please fill all expense fields");
      return;
    }

    setExpenses((prev) =>
      prev.map((expense) =>
        expense.id === editingExpense.id
          ? {
            ...expense,
            ...expenseForm,
            price: parseFloat(expenseForm.amount),
          }
          : expense
      )
    );
    setExpenseForm({
      description: "",
      category: "",
      amount: "",
      paidBy: "Sujan Anand",
      splitOption: "Don't Split",
    });
    setEditingExpense(null);
    setModalVisible(false);
    setModalMode("place");
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };

  const generateTripDates = () => {
    const start = dayjs(trip.startDate || new Date());
    const end = dayjs(trip.endDate || new Date());
    const days = [];

    for (let d = start; d.isBefore(end) || d.isSame(end); d = d.add(1, "day")) {
      days.push(d);
    }

    return days.map((d) => ({
      label: d.format("ddd D/M"),
      value: d.format("YYYY-MM-DD"),
    }));
  };

  const getCurrentDayHours = (openingHours: string[]) => {
    if (!openingHours || openingHours.length === 0) return t('hours_unavailable');
    const today = dayjs().format("dddd").toLowerCase();
    const todayHours = openingHours.find((line) =>
      line.toLowerCase().startsWith(today)
    );
    return todayHours || openingHours[0] || t('hours_unavailable');
  };

  const handleHighlightPrompt = (prompt: string) => {
    navigation.navigate("AIChat", {
      location: trip.tripName || "Unknown",
      initialPrompt: prompt,
    });
  };

  const getAverageRating = (reviews: any[]): number => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
    return Number((total / reviews.length).toFixed(1));
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={14} color="#FFD700" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={14} color="#FFD700" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={14} color="#FFD700" />
        );
      }
    }
    return stars;
  };

  const renderPlaceTypes = (types: string[]) => {
    const allowedTypes = [
      "rv_park",
      "tourist_attraction",
      "lodging",
      "point_of_interest",
      "establishment",
    ];
    const filteredTypes =
      types?.filter((type) => allowedTypes.includes(type)) || [];
    const typeColors: Record<string, string> = {
      rv_park: "text-green-600",
      tourist_attraction: "text-blue-600",
      lodging: "text-purple-600",
      point_of_interest: "text-orange-600",
      establishment: "text-gray-600",
    };

    return filteredTypes.map((type, index) => (
      <View
        key={index}
        className="bg-gray-100 px-3 py-1 rounded-full mr-2 mb-1"
      >
        <Text
          className={`text-xs font-medium ${typeColors[type] || "text-gray-700"
            } capitalize`}
        >
          {type.replace(/_/g, " ")}
        </Text>
      </View>
    ));
  };

  const renderPlaceCard = (
    place: any,
    index: number,
    isItinerary: boolean = false
  ) => {
    const isActive = activePlace?.name === place.name;
    return (
      <View
        key={index}
        className="mb-4 bg-white rounded-[32px] shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden"
      >
        <TouchableOpacity
          onPress={() => setActivePlace(isActive ? null : place)}
          className="flex-row items-center"
          activeOpacity={0.9}
        >
          {place.photos?.[0] ? (
            <Image
              source={{ uri: place.photos[0] }}
              className="w-32 h-32 rounded-2xl m-2"
              resizeMode="cover"
            />
          ) : (
            <View className="w-32 h-32 rounded-2xl m-2 bg-gradient-to-br from-blue-50 to-indigo-50 items-center justify-center">
              <View className="bg-white/60 p-3 rounded-full">
                <Ionicons name="image" size={24} color="#3B82F6" />
              </View>
            </View>
          )}
          <View className="flex-1 p-3 pr-4">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-gray-900 font-bold text-lg mb-1 tracking-tight" numberOfLines={1}>
                  {place.name || t('unknown_place')}
                </Text>
              </View>
              {place.rating > 0 && (
                <View className="bg-amber-50 px-2 py-1 rounded-lg flex-row items-center border border-amber-100">
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text className="text-[10px] font-bold text-amber-700 ml-1">{place.rating}</Text>
                </View>
              )}
            </View>
            <Text className="text-gray-500 text-xs leading-4 mb-3 italic" numberOfLines={2}>
              {place.briefDescription || t('no_address_available')}
            </Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {place.types?.[0]?.replace('_', ' ') || 'Destination'}
                </Text>
              </View>
              <TouchableOpacity className="bg-blue-50 p-1.5 rounded-full">
                <Ionicons name={isActive ? "chevron-up" : "chevron-down"} size={16} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {isActive && (
          <View className="p-4 bg-gray-50/50 border-t border-gray-100">
            <View className="mb-4">
              <View className="flex-row items-center mb-1">
                <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center mr-2">
                  <Ionicons name="location" size={14} color="#0066CC" />
                </View>
                <Text className="text-sm font-semibold text-gray-800">
                  {t('address') || 'Address'}
                </Text>
              </View>
              <Text className="text-sm text-gray-600 ml-8">
                {place.formatted_address || t('no_address_available')}
              </Text>
            </View>

            {place.openingHours?.length > 0 && (
              <View className="mb-4">
                <View className="flex-row items-center mb-1">
                  <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center mr-2">
                    <Ionicons name="time" size={14} color="#0066CC" />
                  </View>
                  <Text className="text-sm font-semibold text-gray-800">
                    {t('todays_hours') || "Today's Hours"}
                  </Text>
                </View>
                <Text className="text-sm text-gray-600 ml-8">
                  {getCurrentDayHours(place.openingHours)}
                </Text>
              </View>
            )}

            {place.phoneNumber && (
              <View className="mb-4">
                <View className="flex-row items-center mb-1">
                  <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center mr-2">
                    <Ionicons name="call" size={14} color="#0066CC" />
                  </View>
                  <Text className="text-sm font-semibold text-gray-800">
                    {t('phone') || 'Phone'}
                  </Text>
                </View>
                <Text className="text-sm text-gray-600 ml-8">
                  {place.phoneNumber}
                </Text>
              </View>
            )}

            {place.website && (
              <View className="mb-4">
                <View className="flex-row items-center mb-1">
                  <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center mr-2">
                    <Ionicons name="globe" size={14} color="#0066CC" />
                  </View>
                  <Text className="text-sm font-semibold text-gray-800">
                    Website
                  </Text>
                </View>
                <Text
                  className="text-sm text-primary underline ml-8"
                  numberOfLines={1}
                >
                  {place.website}
                </Text>
              </View>
            )}

            {place.reviews?.length > 0 && (
              <View className="mb-4 bg-white p-3 rounded-xl border border-gray-100">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#4B5563" />
                  <Text className="text-xs font-semibold text-gray-700 ml-2">
                    Latest Review
                  </Text>
                </View>
                <Text className="text-xs text-gray-600 italic leading-5">
                  "{place.reviews[0].text.slice(0, 120)}
                  {place.reviews[0].text.length > 120 ? "..." : ""}"
                </Text>
                <View className="flex-row items-center justify-end mt-2">
                  <Text className="text-[10px] text-gray-400 mr-1">
                    — {place.reviews[0].authorName}
                  </Text>
                  {renderStars(place.reviews[0].rating)}
                </View>
              </View>
            )}

            {place.types?.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mt-2">
                {renderPlaceTypes(place.types)}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderItineraryTab = () => {
    const dates = generateTripDates();

    const handleDeleteActivity = async (date: string, idx: number) => {
      try {
        if (!trip._id) return;
        const token = await getToken();
        await axios.delete(`${API_URL}/api/trips/${trip._id}/itinerary`, {
          data: { date, index: idx },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        await fetchTrip();
      } catch (e: any) {
        console.error('Delete activity error:', e);
        const msg = getErrorMessage(e);
        setError(msg);
      }
    };

    const renderCuratedPlanSection = () => {
      if (!activePlan) return null;

      return (
        <View className="mb-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {activePlan.days.map((day) => (
            <View key={day.id} className="px-5 py-4">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1 mr-4">
                  <Text className="text-xs font-bold uppercase text-gray-400 mb-1">
                    {t('curated_plan_day_label')}
                  </Text>
                  <Text className="text-base font-bold text-gray-800">
                    {day.title}
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-2"
                contentContainerStyle={{ paddingRight: 20 }}
              >
                {day.highlights.map((highlight) => {
                  return (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      key={highlight.id}
                      onPress={() => handleHighlightPrompt(highlight.prompt)}
                      className="mr-4 w-60 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
                    >
                      <Image
                        source={{
                          uri:
                            highlightImages[highlight.id] || highlight.image,
                        }}
                        className="w-full h-36"
                        resizeMode="cover"
                      />
                      <View className="p-3">
                        <Text className="text-sm font-bold text-gray-800 mb-2 leading-5">
                          {highlight.title}
                        </Text>
                        <View className="flex-row items-center">
                          <View className="bg-orange-50 px-2 py-1 rounded-full flex-row items-center">
                            <Ionicons name="chatbubble-ellipses-outline" size={12} color="#fb923c" />
                            <Text className="text-[10px] font-medium text-orange-600 ml-1">
                              {t('curated_plan_prompt_cta')}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ))}

          {openTripLoading && (
            <View className="px-5 pb-6">
              <View className="flex-row items-center justify-center bg-gray-50 py-3 rounded-xl">
                <ActivityIndicator size="small" color="#fb923c" />
                <Text className="text-xs text-gray-500 ml-2 font-medium">
                  {t('curated_plan_loading')}
                </Text>
              </View>
            </View>
          )}

          {openTripSuggestions.length > 0 && (
            <View className="px-5 pb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                {t('curated_plan_opentripmap_title')}
              </Text>
              {openTripSuggestions.map((place) => {
                const ratingValue =
                  typeof place.rating === "number"
                    ? place.rating
                    : Number(place.rating || 0);
                return (
                  <View
                    key={place.xid}
                    className="mb-4 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
                  >
                    {place.image?.urls?.regular && (
                      <Image
                        source={{ uri: place.image.urls.regular }}
                        className="w-full h-48"
                        resizeMode="cover"
                      />
                    )}
                    <View className="p-4">
                      <View className="flex-row justify-between items-start mb-2">
                        <Text className="text-lg font-bold text-gray-900 flex-1 mr-2 leading-6">
                          {place.name}
                        </Text>
                        {ratingValue > 0 && (
                          <View className="flex-row items-center bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                            <Ionicons name="star" size={12} color="#fbbf24" />
                            <Text className="text-xs font-bold text-yellow-700 ml-1">
                              {ratingValue.toFixed(1)}
                            </Text>
                          </View>
                        )}
                      </View>

                      {place.description ? (
                        <Text className="text-sm text-gray-600 mb-4 leading-5" numberOfLines={3}>
                          {place.description}
                        </Text>
                      ) : null}

                      <View className="flex-row items-center mb-4 bg-gray-50 p-2 rounded-lg">
                        <Ionicons name="location-outline" size={16} color="#6B7280" />
                        <Text className="text-xs text-gray-500 ml-2 flex-1 font-medium" numberOfLines={1}>
                          {place.address || t('no_address_available')}
                        </Text>
                      </View>

                      <View className="flex-row gap-3">
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate("MapScreen", {
                              places: [
                                {
                                  name: place.name,
                                  formatted_address: place.address,
                                  geometry: {
                                    location: {
                                      lat: place.point?.lat,
                                      lng: place.point?.lon,
                                    },
                                  },
                                  photos: [place.image?.urls?.regular].filter(Boolean),
                                },
                              ],
                            })
                          }
                          className="flex-1 flex-row items-center justify-center bg-white border border-gray-200 py-3 rounded-xl shadow-sm"
                        >
                          <Ionicons name="map-outline" size={18} color="#374151" />
                          <Text className="text-sm font-bold text-gray-700 ml-2">
                            {t('curated_plan_opentripmap_view_map')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            handleHighlightPrompt(
                              `${place.name}: ${place.description || t('ask_ai')}`
                            )
                          }
                          className="flex-1 flex-row items-center justify-center bg-orange-50 border border-orange-100 py-3 rounded-xl shadow-sm"
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#f97316" />
                          <Text className="text-sm font-bold text-orange-600 ml-2">
                            {t('curated_plan_opentripmap_prompt')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View className="mx-5 mb-6 bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Ionicons name="bulb-outline" size={18} color="#2563eb" />
              </View>
              <Text className="text-sm font-bold uppercase text-blue-800 tracking-wide">
                {activePlan.practicalTips.title}
              </Text>
            </View>
            {activePlan.practicalTips.tips.map((tip, index) => (
              <View key={index} className="flex-row items-start mb-3 last:mb-0">
                <View className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 mr-3" />
                <Text className="text-sm text-gray-700 flex-1 leading-6">
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        </View>
      );
    };

    return (
      <ScrollView className="px-4 pt-4 bg-surface">
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => {
              setAiItineraryModalVisible(true);
              setGeneratedItinerary([]);
              setAiItineraryProgress("");
            }}
            className="flex-1 bg-gradient-to-br from-primary to-blue-600 p-4 rounded-3xl shadow-lg relative overflow-hidden"
          >
            <View className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
            <View className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8" />

            <MaterialIcons name="auto-awesome" size={28} color="#fff" className="mb-2" />
            <Text className="text-white font-bold text-lg mb-1">
              {t('generate_itinerary_ai')}
            </Text>
            <Text className="text-blue-100 text-xs leading-4">
              {language === 'mn'
                ? 'AI таны аяллын төлөвлөгөөг автоматаар үүсгэнэ'
                : 'AI will automatically create your travel plan'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={fetchAIPlaces}
            disabled={aiLoading}
            className="w-[40%] bg-white p-4 rounded-3xl shadow-sm border border-gray-100 justify-between"
          >
            <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center">
              {aiLoading ? (
                <ActivityIndicator size="small" color="#fb923c" />
              ) : (
                <Ionicons name="bulb-outline" size={24} color="#fb923c" />
              )}
            </View>
            <View>
              <Text className="text-gray-900 font-bold text-sm mb-1">
                {t('use_ai_create_itinerary')}
              </Text>
              <Text className="text-gray-500 text-[10px]">
                {t('fetching_ai_suggestions')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>


        {/* Curated plan section removed to only show created plan */}

        <View className="mb-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {dates.map((date, index) => {
              const isSelected = selectedDate === date.value;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedDate(date.value)}
                  className={`px-5 py-3 mr-3 rounded-2xl border ${isSelected
                    ? "bg-primary border-primary shadow-md"
                    : "bg-white border-gray-200"
                    }`}
                >
                  <Text
                    className={`font-bold text-sm ${isSelected ? "text-white" : "text-gray-600"
                      }`}
                  >
                    {date.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {dates.map((date, index) => {
          const itineraryForDate = (trip.itinerary || []).find(
            (item: any) => item.date === date.value
          );
          const activities = itineraryForDate?.activities || [];

          return (
            <View key={index} className="mb-8">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                    <Text className="text-gray-900 font-bold text-sm">
                      {dayjs(date.value).format('D')}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-lg font-bold text-gray-900">
                      {date.label}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {activities.length} {t('places')}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity className="bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                  <Text className="text-xs font-semibold text-gray-600">
                    {t('optimize_route')}
                  </Text>
                </TouchableOpacity>
              </View>

              {activities.length > 0 ? (
                <View className="pl-5 border-l-2 border-gray-100 ml-5 space-y-6">
                  {activities.map((place: any, idx: number) => (
                    <View key={idx} className="relative">
                      <View className="absolute -left-[29px] top-6 w-4 h-4 rounded-full bg-white border-2 border-primary z-10" />

                      {renderPlaceCard(place, idx, true)}

                      <View className="flex-row justify-end mt-2">
                        <TouchableOpacity
                          onPress={() => handleDeleteActivity(date.value, idx)}
                          className="flex-row items-center bg-red-50 px-3 py-1.5 rounded-lg"
                        >
                          <Ionicons name="trash-outline" size={14} color="#DC2626" />
                          <Text className="text-red-600 text-xs font-semibold ml-1">
                            {t('delete') || 'Delete'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 items-center justify-center mb-4">
                  <Ionicons name="map-outline" size={32} color="#9CA3AF" className="mb-2" />
                  <Text className="text-sm text-gray-500 font-medium">
                    {t('no_activities_added')}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={() => {
                  setSelectedDate(date.value);
                  setModalMode("place");
                  setModalVisible(true);
                }}
                className="flex-row items-center justify-center bg-white border border-gray-200 rounded-2xl py-4 mt-2 shadow-sm border-dashed"
              >
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-2">
                  <Ionicons name="add" size={20} color="#0066CC" />
                </View>
                <Text className="text-gray-700 font-semibold">
                  {t('add_place')}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
        <View className="h-20" />
      </ScrollView>
    );
  };

  const renderExpenseTab = () => {
    const total = expenses.reduce(
      (sum, expense) => sum + (expense.price || expense.amount || 0),
      0
    );

    return (
      <ScrollView className="px-4 pt-4 bg-surface">
        <View className="mb-6 bg-primary p-6 rounded-3xl shadow-lg">
          <Text className="text-white/80 text-sm font-medium mb-1">{t('total_budget')}</Text>
          <Text className="text-4xl font-bold text-white mb-4">
            ${total.toFixed(2)}
          </Text>
          <View className="flex-row items-center justify-between bg-white/10 p-3 rounded-xl">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center mr-2">
                <Ionicons name="wallet-outline" size={18} color="#fff" />
              </View>
              <Text className="text-white font-medium">{t('track_expenses')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setModalMode("expense");
                setModalVisible(true);
              }}
              className="bg-white px-4 py-2 rounded-lg"
            >
              <Text className="text-primary font-bold text-xs">{t('add_new')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-lg font-bold text-gray-800 mb-4 px-2">{t('transactions')}</Text>

        {expenses.map((expense, index) => (
          <View key={index} className="mb-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3">
                <Ionicons
                  name={
                    expense.category === 'Food' ? 'restaurant' :
                      expense.category === 'Transport' ? 'bus' :
                        expense.category === 'Lodging' ? 'bed' : 'receipt'
                  }
                  size={20}
                  color="#6B7280"
                />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-800 mb-0.5">
                  {expense.description}
                </Text>
                <Text className="text-xs text-gray-500">
                  {expense.paidBy} • {dayjs(expense.date).format("MMM D")}
                </Text>
              </View>
            </View>

            <View className="items-end">
              <Text className="text-base font-bold text-gray-900 mb-1">
                ${(expense.price || expense.amount || 0).toFixed(2)}
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => {
                    setEditingExpense(expense);
                    setExpenseForm({
                      description: expense.description,
                      category: expense.category,
                      amount: (expense.price || expense.amount || 0).toString(),
                      paidBy: expense.paidBy,
                      splitOption: expense.splitOption,
                    });
                    setModalMode("editExpense");
                    setModalVisible(true);
                  }}
                  className="p-1 bg-blue-50 rounded-md"
                >
                  <Ionicons name="pencil" size={14} color="#2563eb" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteExpense(expense.id)}
                  className="p-1 bg-red-50 rounded-md"
                >
                  <Ionicons name="trash" size={14} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        <View className="h-20" />
      </ScrollView>
    );
  };

  const buildViewport = (lat: number, lng: number, delta = 0.01) => ({
    northeast: { lat: lat + delta, lng: lng + delta },
    southwest: { lat: lat - delta, lng: lng - delta },
  });

  const normalizePlaceForTrip = (place: any, fallbackName: string) => {
    const raw = place?.toObject ? place.toObject() : { ...place };
    const lat = raw.geometry?.location?.lat ?? raw.point?.lat ?? 0;
    const lng = raw.geometry?.location?.lng ?? raw.point?.lon ?? 0;
    const viewport = raw.geometry?.viewport;

    return {
      ...raw,
      name: raw.name || fallbackName,
      formatted_address: raw.formatted_address || raw.address || t('no_address_available'),
      photos: Array.isArray(raw.photos) && raw.photos.length ? raw.photos : ["https://placehold.co/400x300"],
      geometry: {
        location: { lat, lng },
        viewport:
          viewport?.northeast && viewport?.southwest
            ? viewport
            : buildViewport(lat, lng),
      },
    };
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="relative w-full h-64">
        <Image
          source={{ uri: trip.background || "https://placehold.co/800x400?text=Trip" }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

        <SafeAreaView className="absolute top-0 left-0 w-full">
          <View className="flex-row justify-between items-center px-4 pt-2">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30"
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View className="flex-row gap-2">
              <TouchableOpacity className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30">
                <Ionicons name="share-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30">
                <Ionicons name="settings-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setResearchModalVisible(true)}
                className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30"
              >
                <Ionicons name="information-circle-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        <View className="absolute bottom-0 left-0 right-0 p-6 pb-8 bg-gradient-to-t from-black/80 to-transparent">
          <Text className="text-white text-3xl font-bold shadow-sm mb-1">
            {trip.tripName || t('unnamed_trip')}
          </Text>
          <View className="flex-row items-center">
            <View className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full mr-3 border border-white/30">
              <Text className="text-white text-xs font-medium">
                {trip.startDate ? dayjs(trip.startDate).format("MMM D") : t('na')} –{" "}
                {trip.endDate ? dayjs(trip.endDate).format("MMM D") : t('na')}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Image
                source={{
                  uri: user?.imageUrl || "https://cdn-icons-png.flaticon.com/128/149/149071.png",
                }}
                className="w-6 h-6 rounded-full border border-white"
              />
            </View>
          </View>
        </View>
      </View>


      {/* Enhanced Error Display */}
      {error && (
        <View className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex-row items-start">
          <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center mr-3 mt-0.5">
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
          </View>
          <View className="flex-1">
            <Text className="text-red-900 font-bold text-sm mb-1">{t('error') || 'Error'}</Text>
            <Text className="text-red-700 text-xs leading-5">{error}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setError(null)}
            className="w-6 h-6 rounded-full bg-red-100 items-center justify-center ml-2"
          >
            <Ionicons name="close" size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs Section */}
      <View className="flex-row bg-slate-100 p-1.5 rounded-3xl mx-6 mb-8 mt-2 shadow-inner">
        {[t('overview'), t('itinerary'), t('budget')].map((tab, index) => {
          const tabKey = index === 0 ? "Overview" : index === 1 ? "Itinerary" : "$";
          const isActive = selectedTab === tabKey;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tabKey)}
              className={`flex-1 py-3 items-center rounded-2xl ${selectedTab === tabKey ? "bg-white shadow-md" : ""
                }`}
            >
              <Text
                className={`text-xs font-black uppercase tracking-widest ${selectedTab === tabKey ? "text-blue-600" : "text-slate-400"
                  }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>


      {selectedTab === "Overview" && (
        <ScrollView className="px-4 pt-4 bg-surface">
          {/* Trip Statistics Cards */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">{t('trip_overview')}</Text>
            <View className="flex-row flex-wrap gap-3">
              {/* Days Count */}
              <View className="flex-1 min-w-[45%] bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg">
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="calendar-outline" size={24} color="#fff" />
                  <View className="bg-white/20 px-2 py-0.5 rounded-full">
                    <Text className="text-white text-[10px] font-bold">{t('days_stats')}</Text>
                  </View>
                </View>
                <Text className="text-3xl font-bold text-white mb-1">
                  {dayjs(trip.endDate).diff(dayjs(trip.startDate), 'day') + 1 || 0}
                </Text>
                <Text className="text-blue-100 text-xs font-medium">{t('total_days')}</Text>
              </View>

              {/* Places Count */}
              <View className="flex-1 min-w-[45%] bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-2xl shadow-lg">
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="location-outline" size={24} color="#fff" />
                  <View className="bg-white/20 px-2 py-0.5 rounded-full">
                    <Text className="text-white text-[10px] font-bold">{t('places_stats')}</Text>
                  </View>
                </View>
                <Text className="text-3xl font-bold text-white mb-1">
                  {(trip.placesToVisit || []).length}
                </Text>
                <Text className="text-orange-100 text-xs font-medium">{t('saved_places_label')}</Text>
              </View>

              {/* Itinerary Count */}
              <View className="flex-1 min-w-[45%] bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl shadow-lg">
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="list-outline" size={24} color="#fff" />
                  <View className="bg-white/20 px-2 py-0.5 rounded-full">
                    <Text className="text-white text-[10px] font-bold">{t('planned_stats')}</Text>
                  </View>
                </View>
                <Text className="text-3xl font-bold text-white mb-1">
                  {(trip.itinerary || []).reduce((sum: number, day: any) => sum + (day.activities?.length || 0), 0)}
                </Text>
                <Text className="text-green-100 text-xs font-medium">{t('planned_activities_label')}</Text>
              </View>

              {/* Budget */}
              <View className="flex-1 min-w-[45%] bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="wallet-outline" size={24} color="#fff" />
                  <View className="bg-white/20 px-2 py-0.5 rounded-full">
                    <Text className="text-white text-[10px] font-bold">{t('budget_stats')}</Text>
                  </View>
                </View>
                <Text className="text-3xl font-bold text-white mb-1">
                  ${expenses.reduce((sum, e) => sum + (e.price || e.amount || 0), 0).toFixed(0)}
                </Text>
                <Text className="text-purple-100 text-xs font-medium">{t('total_spent_label')}</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">{t('quick_actions')}</Text>
            <View className="flex-row justify-between gap-3">
              <TouchableOpacity
                onPress={() => {
                  setSelectedTab("Itinerary");
                }}
                className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200"
                activeOpacity={0.7}
              >
                <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center mb-3">
                  <Ionicons name="calendar" size={24} color="#fff" />
                </View>
                <Text className="font-bold mb-1 text-sm text-gray-900">{t('plan_itinerary')}</Text>
                <Text className="text-xs text-gray-600 mb-3 leading-4">
                  {t('organize_daily_activities')}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-blue-600 text-xs font-bold">{t('start_planning_cta')}</Text>
                  <Ionicons name="arrow-forward" size={12} color="#2563eb" className="ml-1" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setSelectedTab("Explore");
                }}
                className="flex-1 bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-2xl border border-orange-200"
                activeOpacity={0.7}
              >
                <View className="w-12 h-12 rounded-full bg-orange-500 items-center justify-center mb-3">
                  <Ionicons name="compass" size={24} color="#fff" />
                </View>
                <Text className="font-bold mb-1 text-sm text-gray-900">{t('explore_things_to_do')}</Text>
                <Text className="text-xs text-gray-600 mb-3 leading-4">
                  {t('discover_new_places')}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-orange-600 text-xs font-bold">{t('explore_now_cta')}</Text>
                  <Ionicons name="arrow-forward" size={12} color="#ea580c" className="ml-1" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-6 bg-white rounded-lg p-4">
            <Text className="font-semibold mb-3 text-base">
              {t('reservations_attachments')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { label: t('flight'), icon: "airplane" },
                { label: t('lodging'), icon: "bed" },
                { label: t('rental_car'), icon: "car" },
                { label: t('restaurant'), icon: "restaurant" },
                { label: t('attachment'), icon: "attach" },
                { label: t('other'), icon: "ellipsis-horizontal" },
              ].map((item, idx) => (
                <View key={idx} className="items-center mr-6">
                  <Ionicons name={item.icon as any} size={24} />
                  <Text className="text-xs mt-1">{item.label}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View className="border-t border-gray-200 bg-white">
            <TouchableOpacity
              onPress={() => setShowNotes(!showNotes)}
              className="p-4 flex-row justify-between items-center"
            >
              <Text className="text-lg font-semibold">{t('notes')}</Text>
              <Ionicons
                name={showNotes ? "chevron-up" : "chevron-down"}
                size={20}
                color="gray"
              />
            </TouchableOpacity>
            {showNotes && (
              <View className="px-4 pb-4">
                <Text className="text-gray-500 text-sm">
                  {t('write_notes_placeholder')}
                </Text>
              </View>
            )}
          </View>

          <View className="border-t border-gray-200 bg-white">
            <TouchableOpacity
              onPress={() => setShowPlaces(!showPlaces)}
              className="p-4 flex-row justify-between items-center"
            >
              <Text className="text-lg font-semibold">{t('places_to_visit')}</Text>
              <Ionicons
                name={showPlaces ? "chevron-up" : "chevron-down"}
                size={20}
                color="gray"
              />
            </TouchableOpacity>
            {showPlaces && (
              <View className="px-4 pb-4">
                {(trip.placesToVisit || []).map((place: any, index: number) =>
                  renderPlaceCard(place, index)
                )}

                {(!trip.placesToVisit || trip.placesToVisit.length === 0) && (
                  <Text className="text-sm text-gray-500">
                    {t('no_places_added')}
                  </Text>
                )}

                <TouchableOpacity
                  onPress={() => {
                    setSelectedDate(null);
                    setModalMode("place");
                    setModalVisible(true);
                  }}
                  className="border border-gray-300 rounded-lg px-4 py-2"
                >
                  <Text className="text-sm text-gray-500">{t('add_place')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      )}
      {selectedTab === "Itinerary" && renderItineraryTab()}
      {selectedTab === "Explore" && (
        <ScrollView className="px-4 pt-4 bg-surface">
          <View className="mb-6">
            <Text className="text-2xl font-extrabold text-gray-900 mb-2">{t('explore')}</Text>
            <Text className="text-sm text-gray-500 leading-5">
              {t('discover_more_places')}{" "}
              <Text className="font-semibold text-primary">{trip.tripName || t('this_destination')}</Text>.
            </Text>
          </View>

          {/* Quick Actions */}
          <View className="mb-8">
            <Text className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">{t('quick_actions') || 'Quick Actions'}</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={fetchAIPlaces}
                className="flex-1 bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-2xl shadow-md relative overflow-hidden"
              >
                <View className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8" />
                <MaterialIcons name="auto-awesome" size={24} color="#fff" className="mb-2" />
                <Text className="text-white font-bold text-sm">{t('ai_suggested_places')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("AIChat", { location: trip.tripName || "Unknown" })}
                className="flex-1 bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-2xl shadow-md relative overflow-hidden"
              >
                <View className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8" />
                <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" className="mb-2" />
                <Text className="text-white font-bold text-sm">{t('ask_ai') || 'Ask AI'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setResearchModalVisible(true)}
                className="flex-1 bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-md relative overflow-hidden"
              >
                <View className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8" />
                <Ionicons name="bus-outline" size={24} color="#fff" className="mb-2" />
                <Text className="text-white font-bold text-sm">{t('transport') || 'Transport'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* AI Suggested Places */}
          {aiPlaces.length > 0 && (
            <View className="mb-8">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-gray-900">{t('ai_suggested_places')}</Text>
                <View className="bg-purple-100 px-2 py-1 rounded-lg">
                  <Text className="text-xs font-bold text-purple-600">AI Powered</Text>
                </View>
              </View>

              {aiPlaces.map((place: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.9}
                  onPress={() => {
                    setSelectedDate(null);
                    setModalMode("place");
                    setModalVisible(false);
                    // Add place directly to placesToVisit
                    handleAddPlace(place);
                  }}
                  className="mb-4 bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
                >
                  <View className="flex-row">
                    {place.photos?.[0] ? (
                      <Image
                        source={{ uri: place.photos[0] }}
                        className="w-28 h-32"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-28 h-32 bg-gradient-to-br from-purple-100 to-indigo-100 items-center justify-center">
                        <Ionicons name="image-outline" size={32} color="#818cf8" />
                      </View>
                    )}
                    <View className="flex-1 p-4 justify-center">
                      <Text className="text-gray-900 font-bold text-base mb-1 leading-5">
                        {place.name || t('unknown_place')}
                      </Text>
                      <Text className="text-gray-500 text-xs leading-4 mb-2" numberOfLines={2}>
                        {place.briefDescription || place.formatted_address || t('no_address_available')}
                      </Text>
                      {place.rating && (
                        <View className="flex-row items-center bg-yellow-50 self-start px-2 py-1 rounded-lg">
                          <Ionicons name="star" size={12} color="#fbbf24" />
                          <Text className="text-xs font-bold text-yellow-700 ml-1">
                            {place.rating}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="justify-center pr-4">
                      <View className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center border border-gray-200">
                        <Ionicons name="add" size={20} color="#374151" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Popular Places */}
          <View className="mb-8">
            <Text className="text-lg font-bold text-gray-900 mb-4">{t('popular_places') || 'Popular Places'}</Text>
            {(trip.placesToVisit || []).length > 0 ? (
              (trip.placesToVisit || []).map((place: any, index: number) =>
                renderPlaceCard(place, index)
              )
            ) : (
              <View className="bg-white border border-dashed border-gray-200 p-8 rounded-3xl items-center justify-center">
                <View className="w-16 h-16 bg-gray-50 rounded-full items-center justify-center mb-4">
                  <Ionicons name="map-outline" size={32} color="#9CA3AF" />
                </View>
                <Text className="text-sm text-gray-500 text-center font-medium mb-4">
                  {t('no_places_added')}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDate(null);
                    setModalMode("place");
                    setModalVisible(true);
                  }}
                  className="bg-primary px-6 py-3 rounded-xl shadow-lg shadow-blue-200"
                >
                  <Text className="text-white font-bold">{t('add_place')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View className="h-20" />
        </ScrollView>
      )}
      {selectedTab === "$" && renderExpenseTab()}

      {/* Enhanced Floating Action Buttons */}
      <View className="absolute right-4 bottom-24 space-y-3 items-end pointer-events-box-none">
        {/* AI Chat Button */}
        <View className="flex-row items-center">
          <View className="bg-purple-600 px-3 py-1.5 rounded-lg mr-2 shadow-sm opacity-0">
            <Text className="text-white text-xs font-semibold">Ask AI</Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("AIChat", {
                location: trip.tripName || "Unknown",
              })
            }
            className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 items-center justify-center shadow-xl shadow-purple-300/50 border-2 border-white"
            activeOpacity={0.7}
            style={{
              elevation: 8,
            }}
          >
            <MaterialIcons name="auto-awesome" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Map View Button */}
        <View className="flex-row items-center">
          <View className="bg-gray-800 px-3 py-1.5 rounded-lg mr-2 shadow-sm opacity-0">
            <Text className="text-white text-xs font-semibold">View Map</Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("MapScreen", {
                places: trip.placesToVisit || [],
              })
            }
            className="w-14 h-14 rounded-full bg-white items-center justify-center shadow-xl shadow-gray-300/50 border-2 border-gray-100"
            activeOpacity={0.7}
            style={{
              elevation: 8,
            }}
          >
            <Ionicons name="map" size={24} color="#0066CC" />
          </TouchableOpacity>
        </View>

        {/* Add Place Button - Primary Action */}
        <View className="flex-row items-center">
          <View className="bg-primary px-3 py-1.5 rounded-lg mr-2 shadow-sm opacity-0">
            <Text className="text-white text-xs font-semibold">Add Place</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setSelectedDate(null);
              setModalMode("place");
              setModalVisible(true);
            }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 items-center justify-center shadow-xl shadow-blue-300/50 border-2 border-white"
            activeOpacity={0.7}
            style={{
              elevation: 10,
            }}
          >
            <Ionicons name="add" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <AppModal
        isVisible={modalVisible}
        avoidKeyboard
        onBackdropPress={() => {
          setModalVisible(false);
          setSelectedDate(null);
          setModalMode("place");
          setEditingExpense(null);
          setAiPlaces([]);
          setExpenseForm({
            description: "",
            category: "",
            amount: "",
            paidBy: user?.fullName || "",
            splitOption: t('dont_split'),
          });
        }}
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <View className="bg-surface p-0 rounded-t-3xl h-[85%] overflow-hidden">
          <View className="items-center pt-3 pb-2 bg-white border-b border-gray-100">
            <View className="w-12 h-1.5 bg-gray-200 rounded-full" />
          </View>
          <View className="flex-1 p-4 bg-white">
            {modalMode === "place" && selectedTab !== "Itinerary" ? (
              <>
                <Text className="text-xl font-bold text-gray-900 mb-4">
                  {t('search_for_place')}
                </Text>
                <View className="flex-1">
                  <View className="flex-row items-center bg-gray-50 rounded-2xl border border-gray-100 px-4 py-1 mb-4">
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                      className="flex-1 h-12 ml-2 text-gray-900 text-base"
                      placeholder={t('search_for_place')}
                      placeholderTextColor="#9CA3AF"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      onSubmitEditing={() => searchOpenTripMapPlaces(searchQuery)}
                      returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery("")}>
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {aiLoading ? (
                    <ActivityIndicator size="small" color="#0066CC" className="mt-4" />
                  ) : (
                    <ScrollView className="flex-1">
                      {aiPlaces.length > 0 ? (
                        aiPlaces.map((place, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => handleAddPlace(place)}
                            className="flex-row items-center p-3 mb-2 bg-gray-50 rounded-xl border border-gray-100"
                          >
                            <Image
                              source={{ uri: place.photos?.[0] || place.image || "https://placehold.co/400x300" }}
                              className="w-12 h-12 rounded-lg mr-3"
                            />
                            <View className="flex-1">
                              <Text className="text-sm font-bold text-gray-900">{place.name}</Text>
                              <Text className="text-xs text-gray-500" numberOfLines={1}>{place.formatted_address || place.description}</Text>
                            </View>
                            <Ionicons name="add-circle" size={24} color="#0066CC" />
                          </TouchableOpacity>
                        ))
                      ) : (
                        searchQuery.length > 2 && (
                          <TouchableOpacity
                            onPress={() => searchOpenTripMapPlaces(searchQuery)}
                            className="p-4 items-center bg-blue-50 rounded-xl mt-2"
                          >
                            <Text className="text-blue-600 font-bold">Search "{searchQuery}" on map</Text>
                          </TouchableOpacity>
                        )
                      )}
                    </ScrollView>
                  )}
                </View>
              </>
            ) : modalMode === "place" && selectedTab === "Itinerary" ? (
              <>
                <Text className="text-xl font-bold text-gray-900 mb-4">
                  {selectedDate
                    ? `${t('add_place')} ${dayjs(selectedDate).format("ddd D/M")}`
                    : t('search_for_place')}
                </Text>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                    Select Date
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 4,
                      marginBottom: 16,
                    }}
                  >
                    {generateTripDates().map((date, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setSelectedDate(date.value)}
                        className={`px-4 py-2 mr-2 rounded-full border ${selectedDate === date.value
                          ? "bg-primary border-primary"
                          : "bg-white border-gray-200"
                          }`}
                      >
                        <Text
                          className={`text-sm font-medium ${selectedDate === date.value
                            ? "text-white"
                            : "text-gray-600"
                            }`}
                        >
                          {date.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View className="flex-row items-center bg-gray-50 rounded-2xl border border-gray-100 px-4 py-1 mb-4">
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                      className="flex-1 h-12 ml-2 text-gray-900 text-base"
                      placeholder={t('search_for_place')}
                      placeholderTextColor="#9CA3AF"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      onSubmitEditing={() => searchOpenTripMapPlaces(searchQuery)}
                      returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery("")}>
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {aiLoading ? (
                    <ActivityIndicator size="small" color="#0066CC" className="mt-4" />
                  ) : (
                    <View className="flex-1 mb-4">
                      <ScrollView className="flex-1 max-h-64">
                        {aiPlaces.length > 0 ? (
                          aiPlaces.map((place, idx) => (
                            <TouchableOpacity
                              key={idx}
                              onPress={() => {
                                if (selectedDate) {
                                  handleAddPlaceToItinerary(place, selectedDate);
                                } else {
                                  setError(t('select_date_first') || "Please select a date first");
                                }
                              }}
                              className="flex-row items-center p-3 mb-2 bg-gray-50 rounded-xl border border-gray-100"
                            >
                              <Image
                                source={{ uri: place.photos?.[0] || place.image || "https://placehold.co/400x300" }}
                                className="w-12 h-12 rounded-lg mr-3"
                              />
                              <View className="flex-1">
                                <Text className="text-sm font-bold text-gray-900">{place.name}</Text>
                                <Text className="text-xs text-gray-500" numberOfLines={1}>{place.formatted_address || place.description}</Text>
                              </View>
                              <Ionicons name="add-circle" size={24} color="#0066CC" />
                            </TouchableOpacity>
                          ))
                        ) : (
                          searchQuery.length > 2 && (
                            <TouchableOpacity
                              onPress={() => searchOpenTripMapPlaces(searchQuery)}
                              className="p-4 items-center bg-blue-50 rounded-xl mt-2"
                            >
                              <Text className="text-blue-600 font-bold">Search "{searchQuery}" on map</Text>
                            </TouchableOpacity>
                          )
                        )}
                      </ScrollView>
                    </View>
                  )}

                  {(trip.placesToVisit || []).length > 0 && (
                    <View className="flex-1 mt-6">
                      <Text className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                        Previously Added Places
                      </Text>
                      <ScrollView className="flex-1">
                        {trip.placesToVisit.map((place: any, index: number) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => {
                              if (selectedDate) {
                                handleAddPlaceToItinerary(place, selectedDate);
                              } else {
                                setError(
                                  "Please select a date to add this place to the itinerary"
                                );
                              }
                            }}
                            className="flex-row items-center p-3 mb-2 bg-gray-50 rounded-xl border border-gray-100"
                          >
                            <Image
                              source={{
                                uri:
                                  place.photos?.[0] ||
                                  "https://placehold.co/400x300",
                              }}
                              className="w-12 h-12 rounded-lg mr-3"
                              resizeMode="cover"
                            />
                            <View className="flex-1">
                              <Text className="text-sm font-bold text-gray-900">
                                {place.name || t('unknown_place')}
                              </Text>
                              <Text
                                className="text-xs text-gray-500 mt-0.5"
                                numberOfLines={1}
                              >
                                {place.formatted_address || t('no_address_available')}
                              </Text>
                            </View>
                            <View className="w-8 h-8 rounded-full bg-white items-center justify-center border border-gray-200">
                              <Ionicons name="add" size={20} color="#0066CC" />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </>
            ) : modalMode === "ai" ? (
              <>
                <Text className="text-xl font-bold text-gray-900 mb-4">
                  {t('ai_suggested_places')}
                </Text>

                {aiLoading ? (
                  <View className="flex-1 items-center justify-center py-8">
                    <ActivityIndicator size="large" color="#0066CC" />
                    <Text className="text-gray-500 mt-4 font-medium">{t('fetching_ai_suggestions')}</Text>
                  </View>
                ) : aiPlaces.length > 0 ? (
                  <ScrollView className="flex-1">
                    {aiPlaces.map((place, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={async () => {
                          try {
                            await handleAddPlace({
                              place_id: place.place_id || `ai-place-${index}`,
                              description: place.name || '',
                              structured_formatting: {
                                main_text: place.name || '',
                                secondary_text: place.formatted_address || '',
                              },
                            });
                            setModalVisible(false);
                          } catch (err: any) {
                            console.error('Error adding AI place:', err);
                            setError(getErrorMessage(err));
                          }
                        }}
                        className="flex-row items-center p-3 border border-gray-100 bg-white rounded-2xl mb-3 shadow-sm"
                      >
                        <Image
                          source={{
                            uri:
                              place.photos?.[0] ||
                              place.image?.urls?.regular ||
                              "https://placehold.co/400x300",
                          }}
                          className="w-16 h-16 rounded-xl mr-3"
                          resizeMode="cover"
                        />
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-gray-900">
                            {place.name || t('unknown_place')}
                          </Text>
                          <Text
                            className="text-xs text-gray-500 mt-1 leading-4"
                            numberOfLines={2}
                          >
                            {place.formatted_address || place.description || t('no_address_available')}
                          </Text>
                          {place.rating && (
                            <View className="flex-row items-center mt-1.5">
                              <Ionicons name="star" size={12} color="#fbbf24" />
                              <Text className="text-xs font-bold text-gray-600 ml-1">
                                {typeof place.rating === 'number' ? place.rating.toFixed(1) : place.rating}/10
                              </Text>
                            </View>
                          )}
                        </View>
                        <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center ml-2">
                          <Ionicons name="add" size={20} color="#0066CC" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View className="flex-1 items-center justify-center py-8">
                    <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                      <Ionicons name="location-outline" size={32} color="#9CA3AF" />
                    </View>
                    <Text className="text-gray-500 text-center font-medium px-8">
                      {t('no_places_found') || 'No places found. Try fetching AI suggestions first.'}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text className="text-xl font-bold text-gray-900 mb-6">
                  {modalMode === "editExpense"
                    ? t('edit_expense')
                    : t('add_new_expense')}
                </Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="mb-4">
                    <Text className="text-sm font-bold text-gray-700 mb-2">{t('description')}</Text>
                    <TextInput
                      value={expenseForm.description}
                      onChangeText={(text) =>
                        setExpenseForm({ ...expenseForm, description: text })
                      }
                      placeholder={t('enter_expense_description')}
                      className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-900"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-bold text-gray-700 mb-2">{t('category')}</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="mb-2"
                    >
                      {categories.map((category, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() =>
                            setExpenseForm({ ...expenseForm, category })
                          }
                          className={`px-4 py-2.5 mr-2 rounded-xl border ${expenseForm.category === category
                            ? "bg-primary border-primary"
                            : "bg-white border-gray-200"
                            }`}
                        >
                          <Text
                            className={`text-sm font-medium ${expenseForm.category === category
                              ? "text-white"
                              : "text-gray-700"
                              }`}
                          >
                            {category}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-bold text-gray-700 mb-2">{t('amount')}</Text>
                    <View className="relative">
                      <Text className="absolute left-4 top-4 text-gray-500 font-medium">$</Text>
                      <TextInput
                        value={expenseForm.amount}
                        onChangeText={(text) =>
                          setExpenseForm({ ...expenseForm, amount: text })
                        }
                        placeholder="0.00"
                        keyboardType="numeric"
                        className="bg-gray-50 p-4 pl-8 rounded-xl border border-gray-200 text-gray-900 font-medium"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-bold text-gray-700 mb-2">{t('paid_by_label')}</Text>
                    <TextInput
                      value={expenseForm.paidBy}
                      onChangeText={(text) =>
                        setExpenseForm({ ...expenseForm, paidBy: text })
                      }
                      placeholder={t('enter_name')}
                      className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-900"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View className="mb-8">
                    <Text className="text-sm font-bold text-gray-700 mb-2">{t('split_option')}</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {splitOptions.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() =>
                            setExpenseForm({
                              ...expenseForm,
                              splitOption: option.value,
                            })
                          }
                          className={`px-4 py-2.5 mr-2 rounded-xl border ${expenseForm.splitOption === option.value
                            ? "bg-primary border-primary"
                            : "bg-white border-gray-200"
                            }`}
                        >
                          <Text
                            className={`text-sm font-medium ${expenseForm.splitOption === option.value
                              ? "text-white"
                              : "text-gray-700"
                              }`}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <TouchableOpacity
                    onPress={
                      modalMode === "editExpense"
                        ? handleEditExpense
                        : handleAddExpense
                    }
                    className="bg-primary p-4 rounded-2xl items-center shadow-lg shadow-blue-200 mb-6"
                  >
                    <Text className="text-white font-bold text-base">
                      {modalMode === "editExpense"
                        ? t('save_changes')
                        : t('add_expense')}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </AppModal>

      {/* AI Itinerary Generation Modal */}
      <AppModal
        isVisible={aiItineraryModalVisible}
        avoidKeyboard
        onBackdropPress={() => {
          setAiItineraryModalVisible(false);
          setGeneratedItinerary([]);
          setAiItineraryProgress("");
        }}
        style={{ justifyContent: "flex-end", margin: 0 }}
        backdropOpacity={0.6}
      >
        <View className="bg-white rounded-t-3xl h-[92%] overflow-hidden shadow-2xl">
          {/* Enhanced Header with Gradient */}
          <View className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 pt-3 pb-4 px-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1 flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md items-center justify-center mr-3 border border-white/30">
                  <MaterialIcons name="auto-awesome" size={24} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-white mb-0.5">
                    {t('generate_itinerary_ai') || 'AI Trip Planner'}
                  </Text>
                  <Text className="text-xs text-purple-100 font-medium">
                    {trip.tripName} • {dayjs(trip.startDate).format("MMM D")} - {dayjs(trip.endDate).format("MMM D")}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setAiItineraryModalVisible(false);
                  setGeneratedItinerary([]);
                  setAiItineraryProgress("");
                }}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md items-center justify-center border border-white/30"
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Progress Indicator */}
            {generatedItinerary.length > 0 && (
              <View className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 flex-row items-center self-start border border-white/30">
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text className="text-white text-xs font-bold ml-2">
                  {generatedItinerary.length} {language === 'mn' ? 'өдөр төлөвлөгдсөн' : 'days planned'}
                </Text>
              </View>
            )}
          </View>

          {/* Content */}
          <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
            {!aiLoading && generatedItinerary.length === 0 && !aiItineraryProgress && (
              <View className="items-center py-2">
                {/* Hero Section */}
                <View className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 items-center justify-center mb-4 border-2 border-purple-200 shadow-lg">
                  <MaterialIcons name="auto-awesome" size={48} color="#8b5cf6" />
                </View>
                <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
                  {language === 'mn'
                    ? 'AI Төлөвлөгөө Үүсгэх'
                    : 'Create Your Perfect Trip'}
                </Text>
                <Text className="text-sm text-gray-500 text-center mb-8 px-6 leading-6">
                  {language === 'mn'
                    ? 'AI таны сонголтод тулгуурлан хамгийн тохиромжтой аяллын төлөвлөгөөг үүсгэнэ'
                    : 'AI will craft a personalized itinerary based on your preferences'}
                </Text>

                {/* Enhanced Preferences Form */}
                <View className="w-full mb-6">
                  {/* Budget Selection with Gradients */}
                  <View className="mb-6">
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="wallet" size={18} color="#6B7280" />
                      <Text className="text-sm font-bold text-gray-900 ml-2 uppercase tracking-wide">
                        {language === 'mn' ? 'Төсөв' : 'Budget Level'}
                      </Text>
                    </View>
                    <View className="flex-row gap-3">
                      {[
                        { value: 'low', emoji: '💰', gradient: 'from-green-500 to-emerald-600', label: language === 'mn' ? 'Хямд' : 'Budget' },
                        { value: 'medium', emoji: '💰💰', gradient: 'from-blue-500 to-blue-600', label: language === 'mn' ? 'Дунд' : 'Moderate' },
                        { value: 'high', emoji: '💰💰💰', gradient: 'from-purple-500 to-purple-600', label: language === 'mn' ? 'Үнэтэй' : 'Luxury' }
                      ].map((budget) => (
                        <TouchableOpacity
                          key={budget.value}
                          onPress={() => setItineraryPreferences({ ...itineraryPreferences, budget: budget.value })}
                          className={`flex-1 p-4 rounded-2xl border-2 items-center ${itineraryPreferences.budget === budget.value
                            ? `bg-gradient-to-br ${budget.gradient} border-transparent shadow-lg`
                            : 'border-gray-200 bg-white'
                            }`}
                          activeOpacity={0.7}
                        >
                          <Text className="text-2xl mb-2">{budget.emoji}</Text>
                          <Text className={`text-xs font-bold uppercase ${itineraryPreferences.budget === budget.value ? 'text-white' : 'text-gray-600'
                            }`}>
                            {budget.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Interests Selection with Icons */}
                  <View className="mb-6">
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="heart" size={18} color="#6B7280" />
                      <Text className="text-sm font-bold text-gray-900 ml-2 uppercase tracking-wide">
                        {language === 'mn' ? 'Сонирхол' : 'Your Interests'}
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                      {(language === 'mn'
                        ? [
                          { name: 'Соёл', icon: 'color-palette' },
                          { name: 'Түүх', icon: 'book' },
                          { name: 'Байгаль', icon: 'leaf' },
                          { name: 'Хоол', icon: 'restaurant' },
                          { name: 'Худалдаа', icon: 'cart' },
                          { name: 'Хөгжим', icon: 'musical-notes' },
                          { name: 'Спорт', icon: 'football' },
                          { name: 'Урлаг', icon: 'brush' }
                        ]
                        : [
                          { name: 'Culture', icon: 'color-palette' },
                          { name: 'History', icon: 'book' },
                          { name: 'Nature', icon: 'leaf' },
                          { name: 'Food', icon: 'restaurant' },
                          { name: 'Shopping', icon: 'cart' },
                          { name: 'Music', icon: 'musical-notes' },
                          { name: 'Sports', icon: 'football' },
                          { name: 'Art', icon: 'brush' }
                        ]
                      ).map((interest) => {
                        const isSelected = itineraryPreferences.interests.includes(interest.name);
                        return (
                          <TouchableOpacity
                            key={interest.name}
                            onPress={() => {
                              if (isSelected) {
                                setItineraryPreferences({
                                  ...itineraryPreferences,
                                  interests: itineraryPreferences.interests.filter(i => i !== interest.name)
                                });
                              } else {
                                setItineraryPreferences({
                                  ...itineraryPreferences,
                                  interests: [...itineraryPreferences.interests, interest.name]
                                });
                              }
                            }}
                            className={`px-4 py-2.5 rounded-full border-2 flex-row items-center ${isSelected
                              ? 'border-primary bg-primary shadow-md'
                              : 'border-gray-200 bg-white'
                              }`}
                            activeOpacity={0.7}
                          >
                            <Ionicons name={interest.icon as any} size={14} color={isSelected ? '#fff' : '#6B7280'} />
                            <Text className={`text-sm font-semibold ml-1.5 ${isSelected ? 'text-white' : 'text-gray-700'
                              }`}>
                              {interest.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Duration Selection */}
                  <View className="mb-6">
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="time" size={18} color="#6B7280" />
                      <Text className="text-sm font-bold text-gray-900 ml-2 uppercase tracking-wide">
                        {language === 'mn' ? 'Өдөр бүрийн хугацаа' : 'Daily Duration'}
                      </Text>
                    </View>
                    <View className="flex-row gap-3">
                      {(language === 'mn'
                        ? [
                          { value: 'half_day', label: 'Хагас өдөр', icon: 'time-outline', color: 'orange' },
                          { value: 'full_day', label: 'Бүтэн өдөр', icon: 'sunny-outline', color: 'blue' },
                          { value: 'flexible', label: 'Уян хатан', icon: 'shuffle-outline', color: 'purple' }
                        ]
                        : [
                          { value: 'half_day', label: 'Half Day', icon: 'time-outline', color: 'orange' },
                          { value: 'full_day', label: 'Full Day', icon: 'sunny-outline', color: 'blue' },
                          { value: 'flexible', label: 'Flexible', icon: 'shuffle-outline', color: 'purple' }
                        ]
                      ).map((option) => {
                        const isSelected = itineraryPreferences.duration === option.value;
                        return (
                          <TouchableOpacity
                            key={option.value}
                            onPress={() => setItineraryPreferences({ ...itineraryPreferences, duration: option.value })}
                            className={`flex-1 p-4 rounded-2xl border-2 items-center ${isSelected
                              ? `border-${option.color}-500 bg-${option.color}-50 shadow-md`
                              : 'border-gray-200 bg-white'
                              }`}
                            activeOpacity={0.7}
                          >
                            <View className={`w-10 h-10 rounded-full ${isSelected ? `bg-${option.color}-500` : 'bg-gray-100'} items-center justify-center mb-2`}>
                              <Ionicons name={option.icon as any} size={20} color={isSelected ? "#fff" : "#9CA3AF"} />
                            </View>
                            <Text className={`text-xs font-bold text-center ${isSelected ? `text-${option.color}-700` : 'text-gray-600'
                              }`}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Enhanced Additional Options */}
                  <View className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
                      {language === 'mn' ? 'Нэмэлт сонголтууд' : 'Additional Options'}
                    </Text>

                    <TouchableOpacity
                      onPress={() => setItineraryPreferences({ ...itineraryPreferences, includeHotels: !itineraryPreferences.includeHotels })}
                      className="flex-row items-center justify-between mb-5"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 rounded-xl bg-orange-50 items-center justify-center mr-3">
                          <Ionicons name="bed" size={20} color="#f97316" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-gray-900">
                            {language === 'mn' ? 'Зочид буудал' : 'Hotels'}
                          </Text>
                          <Text className="text-xs text-gray-500 mt-0.5">
                            {language === 'mn' ? 'Байрны санал болгох' : 'Include accommodation'}
                          </Text>
                        </View>
                      </View>
                      <View className={`w-14 h-8 rounded-full p-1 transition-all ${itineraryPreferences.includeHotels ? 'bg-primary' : 'bg-gray-200'}`}>
                        <View className={`w-6 h-6 rounded-full bg-white shadow-md transition-all ${itineraryPreferences.includeHotels ? 'self-end' : 'self-start'}`} />
                      </View>
                    </TouchableOpacity>

                    <View className="h-[1px] bg-gray-100 mb-5" />

                    <TouchableOpacity
                      onPress={() => setItineraryPreferences({ ...itineraryPreferences, includeFlights: !itineraryPreferences.includeFlights })}
                      className="flex-row items-center justify-between"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
                          <Ionicons name="airplane" size={20} color="#3b82f6" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-gray-900">
                            {language === 'mn' ? 'Нислэг' : 'Flights'}
                          </Text>
                          <Text className="text-xs text-gray-500 mt-0.5">
                            {language === 'mn' ? 'Нислэгийн мэдээлэл' : 'Include flight info'}
                          </Text>
                        </View>
                      </View>
                      <View className={`w-14 h-8 rounded-full p-1 transition-all ${itineraryPreferences.includeFlights ? 'bg-primary' : 'bg-gray-200'}`}>
                        <View className={`w-6 h-6 rounded-full bg-white shadow-md transition-all ${itineraryPreferences.includeFlights ? 'self-end' : 'self-start'}`} />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={async () => {
                    try {
                      setAiLoading(true);
                      setAiItineraryProgress(language === 'mn' ? 'Төлөвлөгөө үүсгэж байна...' : 'Generating plan...');

                      const res = await axios.post(`${API_URL}/api/ai/itinerary`, {
                        destination: trip.tripName || 'Ulaanbaatar',
                        startDate: trip.startDate,
                        endDate: trip.endDate,
                        budget: itineraryPreferences.budget,
                        interests: itineraryPreferences.interests,
                        duration: itineraryPreferences.duration,
                        includeHotels: itineraryPreferences.includeHotels,
                        includeFlights: itineraryPreferences.includeFlights,
                        language: language,
                      }, {
                        timeout: 30000,
                      });

                      setAiItineraryProgress(language === 'mn' ? 'Төлөвлөгөө бэлэн боллоо!' : 'Plan ready!');
                      const plan = res.data.plan || [];

                      // Enrich activities with photos if missing
                      const enrichedPlan = await Promise.all(
                        plan.map(async (day: any) => {
                          const enrichedActivities = await Promise.all(
                            (day.activities || []).map(async (activity: any) => {
                              const enriched = { ...activity };
                              if (!enriched.photos || enriched.photos.length === 0) {
                                try {
                                  const photoResponse = await axios.get(`${API_URL}/api/media/place-images`, {
                                    params: {
                                      name: enriched.name,
                                      contextName: trip.tripName || 'Mongolia',
                                      count: 2
                                    }
                                  });
                                  if (photoResponse.data?.images?.length > 0) {
                                    enriched.photos = photoResponse.data.images.filter(
                                      (url: string) =>
                                        url &&
                                        typeof url === 'string' &&
                                        (url.startsWith('http') || url.startsWith('data:image'))
                                    );
                                  }
                                } catch (photoError) {
                                  console.log('Could not fetch photos for', enriched.name, photoError);
                                }
                              }
                              return enriched;
                            })
                          );
                          return { ...day, activities: enrichedActivities };
                        })
                      );

                      setGeneratedItinerary(enrichedPlan);
                    } catch (e: any) {
                      console.error("Error generating itinerary:", e);
                      setAiItineraryProgress(language === 'mn' ? 'Алдаа гарлаа' : 'Error occurred');
                      setError(getErrorMessage(e));
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                  className="w-full bg-gradient-to-r from-primary to-blue-600 py-4 rounded-2xl shadow-lg shadow-blue-200 items-center"
                >
                  <Text className="text-white font-bold text-lg">
                    {language === 'mn' ? 'Төлөвлөгөө үүсгэх' : 'Generate Plan'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {aiLoading && (
              <View className="items-center py-20">
                <ActivityIndicator size="large" color="#0066CC" />
                <Text className="text-gray-800 font-semibold mt-6 text-lg text-center">
                  {aiItineraryProgress || (language === 'mn' ? 'Төлөвлөгөө үүсгэж байна...' : 'Generating plan...')}
                </Text>
                <Text className="text-sm text-gray-400 mt-2 text-center px-8 leading-5">
                  {language === 'mn'
                    ? 'Энэ нь хэдэн секунд үргэлжлэх болно. Түр хүлээнэ үү.'
                    : 'This may take a few seconds. Please wait while we craft your perfect trip.'}
                </Text>
              </View>
            )}

            {!aiLoading && generatedItinerary.length > 0 && (
              <View className="pb-10">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-xl font-bold text-gray-900">
                    {language === 'mn' ? 'Үүссэн төлөвлөгөө' : 'Generated Itinerary'}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View className="bg-green-100 px-3 py-1 rounded-full border border-green-200">
                      <Text className="text-green-700 text-xs font-bold uppercase">
                        {language === 'mn' ? 'Бэлэн' : 'Ready'}
                      </Text>
                    </View>
                  </View>
                </View>

                {generatedItinerary.map((day: any, dayIndex: number) => (
                  <View key={dayIndex} className="mb-6">
                    <View className="flex-row items-center mb-3 px-1">
                      <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-3 shadow-sm">
                        <Text className="text-white font-bold text-sm">{dayIndex + 1}</Text>
                      </View>
                      <Text className="text-lg font-bold text-gray-800">
                        {dayjs(day.date).format(language === 'mn' ? 'YYYY-MM-DD dddd' : 'dddd, MMM D')}
                      </Text>
                    </View>

                    <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                      {day.activities && day.activities.length > 0 ? (
                        day.activities.map((activity: any, actIndex: number) => {
                          const activityKey = `${dayIndex}-${actIndex}`;
                          const isSelected = selectedActivities.has(activityKey);
                          const hasLocation = activity.geometry?.location;

                          return (
                            <TouchableOpacity
                              key={actIndex}
                              className={`p-4 border-b border-gray-50 last:border-0 ${isSelected ? 'bg-blue-50/50' : 'bg-white'}`}
                              activeOpacity={0.7}
                              onPress={async () => {
                                if (hasLocation) {
                                  const enrichedActivity = await enrichPlaceWithPhotos(activity);

                                  const updatedSelectedSet = new Set(selectedActivities);
                                  const updatedSelectedData = new Map(selectedActivitiesData);
                                  if (updatedSelectedSet.has(activityKey)) {
                                    updatedSelectedSet.delete(activityKey);
                                    updatedSelectedData.delete(activityKey);
                                  } else {
                                    updatedSelectedSet.add(activityKey);
                                    updatedSelectedData.set(activityKey, enrichedActivity);
                                  }

                                  setSelectedActivities(updatedSelectedSet);
                                  setSelectedActivitiesData(updatedSelectedData);
                                }
                              }}
                            >
                              <View className="flex-row">
                                <Image
                                  source={{
                                    uri: activity.photos?.[0] || "https://placehold.co/100x100?text=Place"
                                  }}
                                  className="w-20 h-20 rounded-xl mr-4 bg-gray-100"
                                  resizeMode="cover"
                                />
                                <View className="flex-1 justify-center">
                                  <View className="flex-row items-start justify-between">
                                    <Text className="text-base font-bold text-gray-900 flex-1 mr-2 leading-5">
                                      {activity.name || t('unknown_place')}
                                    </Text>
                                    {isSelected && (
                                      <View className="bg-primary px-2 py-1 rounded-full">
                                        <Ionicons name="checkmark" size={12} color="#fff" />
                                      </View>
                                    )}
                                  </View>

                                  <Text className="text-xs text-gray-500 mt-1 leading-4" numberOfLines={2}>
                                    {activity.briefDescription || activity.formatted_address || t('no_description')}
                                  </Text>

                                  {hasLocation && (
                                    <TouchableOpacity
                                      className="flex-row items-center mt-2 self-start bg-gray-50 px-2 py-1 rounded-lg border border-gray-100"
                                      onPress={(e) => {
                                        e.stopPropagation();
                                        handleSinglePlaceMapView(activity);
                                      }}
                                    >
                                      <Ionicons name="map" size={12} color="#0066CC" />
                                      <Text className="text-xs text-primary font-semibold ml-1">
                                        {language === 'mn' ? 'Газрын зураг' : 'View Map'}
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <View className="p-6 items-center justify-center">
                          <Text className="text-sm text-gray-400 italic">
                            {language === 'mn' ? 'Үйл ажиллагаа байхгүй' : 'No activities planned for this day'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}

                <View className="flex-row gap-4 mt-4 mb-8 pt-4 border-t border-gray-100">
                  <TouchableOpacity
                    onPress={() => {
                      setAiItineraryModalVisible(false);
                      setGeneratedItinerary([]);
                      setAiItineraryProgress("");
                    }}
                    className="flex-1 bg-white border border-gray-200 py-4 rounded-2xl items-center"
                  >
                    <Text className="text-gray-700 font-bold">
                      {language === 'mn' ? 'Цуцлах' : 'Cancel'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        if (!trip._id || generatedItinerary.length === 0) return;

                        setAiLoading(true);
                        const token = await getToken();

                        for (const day of generatedItinerary) {
                          if (day.activities && day.activities.length > 0) {
                            for (const activity of day.activities) {
                              await axios.post(
                                `${API_URL}/api/trips/${trip._id}/itinerary`,
                                {
                                  date: day.date,
                                  placeData: {
                                    ...activity,
                                    geometry: activity.geometry || {
                                      location: { lat: 0, lng: 0 },
                                      viewport: {
                                        northeast: { lat: 0, lng: 0 },
                                        southwest: { lat: 0, lng: 0 },
                                      },
                                    },
                                  }
                                },
                                {
                                  headers: { Authorization: `Bearer ${token}` },
                                  timeout: 10000,
                                }
                              );
                            }
                          }
                        }

                        await fetchTrip();
                        setAiItineraryModalVisible(false);
                        setGeneratedItinerary([]);
                        setAiItineraryProgress("");
                      } catch (e: any) {
                        console.error("Error applying itinerary:", e);
                        setError(getErrorMessage(e));
                      } finally {
                        setAiLoading(false);
                      }
                    }}
                    className="flex-1 bg-primary py-4 rounded-2xl items-center shadow-lg shadow-blue-200"
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-white font-bold">
                        {language === 'mn' ? 'Хэрэглэх' : 'Apply to Trip'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </AppModal>

      <AppModal
        isVisible={researchModalVisible}
        onBackdropPress={() => setResearchModalVisible(false)}
        style={{ margin: 0, justifyContent: "flex-end" }}
      >
        <View className="bg-white h-[85%] rounded-t-3xl overflow-hidden">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
            <Text className="text-xl font-bold text-gray-900">
              {language === 'mn' ? 'Судалгааны ажил' : 'Research Project'}
            </Text>
            <TouchableOpacity
              onPress={() => setResearchModalVisible(false)}
              className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
            >
              <Ionicons name="close" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pt-4">
            <View className="mb-8">
              <Text className="text-lg font-bold text-primary mb-2">3. Судалгааны тойм</Text>
              <Text className="text-gray-600 leading-6 mb-4">
                Аялж байгаа жуулчдад тулгардаг асуудлууд нь олон янз байдаг. Жишээ нь:
              </Text>

              <View className="bg-red-50 p-4 rounded-xl mb-4">
                <Text className="font-bold text-red-800 mb-2">Тулгардаг асуудлууд:</Text>
                <Text className="text-gray-700 mb-2 leading-5">• <Text className="font-bold">Тээврийн төвөгтэй байдал:</Text> Жуулчид такси, автобусаар явах арга, маршрут, үнэ тарифыг мэдэхгүй, хэлний саад тулгардаг.</Text>
                <Text className="text-gray-700 mb-2 leading-5">• <Text className="font-bold">Газрын мэдээлэл дутмаг:</Text> Хаана очих, ямар үзэсгэлэнт газар, хоолны газар, соёлын газруудыг үзэх талаар мэдээлэл хомс.</Text>
                <Text className="text-gray-700 mb-2 leading-5">• <Text className="font-bold">Үнэлгээ, зөвлөмжийн найдвартай байдал:</Text> Өмнө нь аялсан хүмүүсийн санал, туршлага, баталгаажаагүй эсвэл хуучирсан байж болно.</Text>
                <Text className="text-gray-700 mb-2 leading-5">• <Text className="font-bold">Хэлний саад:</Text> Монгол хэл мэдэхгүй жуулчдад апп болон тэмдэглэгээ ойлгомжгүй байх магадлалтай.</Text>
                <Text className="text-gray-700 leading-5">• <Text className="font-bold">Аюулгүй байдал:</Text> Тээврийн үйлчилгээний үнэ, маршрутын мэдээлэл буруу байх, эсвэл худал мэдээлэл авснаар цаг, мөнгө алдах эрсдэлтэй.</Text>
              </View>

              <Text className="text-gray-600 leading-6 mb-4">
                Эдгээр асуудлыг шийдвэрлэхийн тулд энэхүү аппликейшн нь дараах давуу талтай:
              </Text>

              <View className="bg-green-50 p-4 rounded-xl mb-4">
                <Text className="font-bold text-green-800 mb-2">Шийдэл ба Давуу тал:</Text>
                <Text className="text-gray-700 mb-2 leading-5">• <Text className="font-bold">Тээврийн мэдээллийг нэг дороос авах:</Text> Такси, автобусны маршрут, үнэ тариф, хэрэглэгчийн үнэлгээтэйгээр үзүүлнэ.</Text>
                <Text className="text-gray-700 mb-2 leading-5">• <Text className="font-bold">Үзэсгэлэнт газар ба үйлчилгээний зөвлөмж:</Text> Байршил, зураг, тайлбар, үнэлгээ, зөвлөмжийг нэгтгэн харуулна.</Text>
                <Text className="text-gray-700 mb-2 leading-5">• <Text className="font-bold">Хэрэглэгчийн туршлагад тулгуурласан үнэлгээ:</Text> Өмнө нь аялсан жуулчдын үнэлгээ, зөвлөмжийг системтэйгээр нэгтгэн, баталгаажуулна.</Text>
                <Text className="text-gray-700 leading-5">• <Text className="font-bold">Crowdsourced мэдээлэл:</Text> Жуулчид шинэ маршрут, үнэ тариф, үйлчилгээний мэдээллийг оруулах боломжтой бөгөөд админ/модератор хяналттай.</Text>
              </View>
            </View>

            <View className="mb-8">
              <Text className="text-lg font-bold text-primary mb-2">4. Судалгааны төлөвлөгөө</Text>

              <View className="mb-4">
                <Text className="font-bold text-gray-800 mb-1">① Судалгааны зорилго</Text>
                <Text className="text-gray-600 leading-5 pl-2 border-l-2 border-primary ml-1">
                  Гадаад жуулчдад зориулсан гар утасны аппликейшний загварыг боловсруулж, Монгол дахь аяллын мэдээлэлд хялбар хандалт, найдвартай зөвлөмж өгөх боломжийг бий болгох.
                </Text>
              </View>

              <View className="mb-4">
                <Text className="font-bold text-gray-800 mb-1">② Судалгааны арга</Text>
                <Text className="text-gray-600 leading-5 pl-2 border-l-2 border-blue-500 ml-1 mb-2">
                  <Text className="font-bold">Өмнөх судалгаа:</Text> Гадаадын жишиг аппликейшнүүдийг (TripAdvisor, Google Maps, Klook) судалж, Монгол оронд тохиромжтой шинж чанарыг тодорхойлно.
                </Text>
                <Text className="text-gray-600 leading-5 pl-2 border-l-2 border-blue-500 ml-1 mb-2">
                  <Text className="font-bold">Хэрэглэгчийн шаардлага тодорхойлох:</Text> Монголд аялж байсан болон гадаад жуулчдын санал, туршлагыг судалж, апп-д хэрэгтэй функцуудыг тодорхойлно.
                </Text>
                <Text className="text-gray-600 leading-5 pl-2 border-l-2 border-blue-500 ml-1">
                  <Text className="font-bold">Прототип боловсруулах:</Text> React Native эсвэл Flutter ашиглан гар утасны аппликейшний загвар боловсруулна.
                </Text>
              </View>

              <View className="mb-4">
                <Text className="font-bold text-gray-800 mb-1">③ Хүлээгдэж буй үр дүн</Text>
                <Text className="text-gray-600 leading-5 pl-2 border-l-2 border-green-500 ml-1">
                  Монголд аялж буй гадаад жуулчдад зориулагдсан, энгийн, ойлгомжтой, олон хэлний дэмжлэгтэй гар утасны аппликейшний прототип.
                </Text>
              </View>
            </View>
            <View className="h-20" />
          </ScrollView>
        </View>
      </AppModal>

    </View>
  );
};

export default PlanTripScreen;

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View className="mt-2">
    <Text className="text-xs font-semibold text-gray-600 uppercase">{label}</Text>
    <Text className="text-xs text-gray-600 mt-1">{value}</Text>
  </View>
);
