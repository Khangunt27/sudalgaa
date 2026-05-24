import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Region, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import axios from "axios";
import { API_URL } from "../constants/api";
import { AIMAGS } from "../constants/aimags";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;
const SPACING = 12;
const MARKER_SIZE = 50;

type Place = {
  id: string;
  name: string;
  briefDescription: string;
  photos: string[];
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };
};

type MapRouteParams = {
  MapScreen: { places: Place[] };
};

export default function MapScreen() {
  const { t, language } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MapRouteParams, "MapScreen">>();
  const places = route.params?.places || [];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedPlaceImages, setSelectedPlaceImages] = useState<string[]>([]);
  const [aimags, setAimags] = useState<any[]>([]);
  const [loadingAimags, setLoadingAimags] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [showRoute, setShowRoute] = useState(true);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>(places);
  const [showSearch, setShowSearch] = useState(false);
  const mapRef = useRef<MapView>(null);
  const flatListRef = useRef<FlatList>(null);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const moveToRegion = (place: Place) => {
    const region: Region = {
      latitude: place.geometry?.location.lat,
      longitude: place.geometry?.location.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    mapRef.current?.animateToRegion(region, 350);
  };

  const onMarkerPress = (index: number) => {
    setSelectedIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
    if (filteredPlaces.length > 0) {
      const p = filteredPlaces[index];
      moveToRegion(p);
      if (p.photos && p.photos.length > 0) {
        setSelectedPlaceImages(p.photos);
        setImageModalVisible(true);
      }
    } else if (aimags.length > 0 && aimags[index]?.coordinates) {
      const a = aimags[index];
      const region: Region = {
        latitude: a.coordinates.lat,
        longitude: a.coordinates.lng,
        latitudeDelta: 0.8,
        longitudeDelta: 0.8,
      };
      mapRef.current?.animateToRegion(region, 350);
    }
  };

  const onCardScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / (CARD_WIDTH + SPACING)
    );
    if (index !== selectedIndex && filteredPlaces[index]) {
      setSelectedIndex(index);
      moveToRegion(filteredPlaces[index]);
    }
  };

  // Fetch aimags when no places provided
  useEffect(() => {
    if (places.length === 0) {
      (async () => {
        try {
          setLoadingAimags(true);
          const response = await axios.get(`${API_URL}/api/places/aimags`, { timeout: 5000 });
          setAimags(response.data?.items || AIMAGS);
        } catch (e) {
          setAimags(AIMAGS);
        } finally {
          setLoadingAimags(false);
        }
      })();
    }
  }, [places.length]);

  useEffect(() => {
    if (mapRef.current) {
      if (places.length > 0) {
        const coordinates = places.map((place) => ({
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        }));
        if (coordinates.length) {
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 150, right: 150, bottom: 150, left: 150 },
            animated: true,
          });
        }
      } else if (aimags.length > 0) {
        const coordinates = aimags
          .filter((a) => a.coordinates)
          .map((a) => ({
            latitude: a.coordinates.lat,
            longitude: a.coordinates.lng,
          }));
        if (coordinates.length) {
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
            animated: true,
          });
        }
      }
    }
  }, [places]);

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={{ flex: 1, height: "100%" }}
        initialRegion={{
          latitude: places[0]?.geometry?.location?.lat ?? aimags[0]?.coordinates?.lat ?? 47.8864,
          longitude: places[0]?.geometry?.location?.lng ?? aimags[0]?.coordinates?.lng ?? 106.9057,
          latitudeDelta: places.length > 0 ? 1 : 4,
          longitudeDelta: places.length > 0 ? 1 : 4,
        }}
      >
        {(places.length > 0 ? places : aimags).map((item: any, index: number) => {
          const isPlace = places.length > 0;
          const hasImage = isPlace ? (item.photos && item.photos.length > 0) : Boolean(item.image);
          const isSelected = index === selectedIndex;
          const latitude = isPlace ? item.geometry?.location.lat : item.coordinates?.lat;
          const longitude = isPlace ? item.geometry?.location.lng : item.coordinates?.lng;
          if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;

          return (
            <Marker
              key={index}
              coordinate={{ latitude, longitude }}
              onPress={() => onMarkerPress(index)}
            >
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {hasImage ? (
                  <View
                    style={{
                      width: isSelected ? MARKER_SIZE + 10 : MARKER_SIZE,
                      height: isSelected ? MARKER_SIZE + 10 : MARKER_SIZE,
                      borderRadius: (isSelected ? MARKER_SIZE + 10 : MARKER_SIZE) / 2,
                      borderWidth: 3,
                      borderColor: isSelected ? "#007AFF" : "#FF3B30",
                      overflow: 'hidden',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Image
                      source={{ uri: isPlace ? item.photos[0] : item.image }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View
                    style={{
                      width: isSelected ? MARKER_SIZE + 10 : MARKER_SIZE,
                      height: isSelected ? MARKER_SIZE + 10 : MARKER_SIZE,
                      borderRadius: (isSelected ? MARKER_SIZE + 10 : MARKER_SIZE) / 2,
                      backgroundColor: isSelected ? "#007AFF" : "#FF3B30",
                      borderWidth: 3,
                      borderColor: "#fff",
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name="location"
                      size={isSelected ? 24 : 20}
                      color="#fff"
                    />
                  </View>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {places.length > 0 ? (
        <View className="absolute bottom-6">
          <FlatList
            ref={flatListRef}
            data={places}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            snapToInterval={CARD_WIDTH + SPACING}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: SPACING }}
            onScroll={onCardScroll}
            renderItem={({ item, index }) => {
              const hasImages = item.photos && item.photos.length > 0;
              const isSelected = index === selectedIndex;

              return (
                <TouchableOpacity
                  style={{ width: CARD_WIDTH, marginRight: SPACING }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                  activeOpacity={0.9}
                  onPress={() => {
                    if (hasImages) {
                      setSelectedPlaceImages(item.photos);
                      setImageModalVisible(true);
                    }
                  }}
                >
                  <View className="relative">
                    {hasImages && item.photos[0] ? (
                      <Image
                        source={{ uri: item.photos[0] }}
                        style={{ width: '100%', height: 180 }}
                        resizeMode="cover"
                        onError={() => {
                          // Handle image load error
                        }}
                      />
                    ) : (
                      <View
                        style={{ width: '100%', height: 180 }}
                        className="bg-gray-200 items-center justify-center"
                      >
                        <Ionicons name="image-outline" size={48} color="#999" />
                        <Text className="text-gray-500 text-xs mt-2">{t('no_image_available')}</Text>
                      </View>
                    )}
                    {hasImages && item.photos.length > 1 && (
                      <View className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded-full">
                        <Text className="text-white text-xs font-semibold">
                          +{item.photos.length - 1}
                        </Text>
                      </View>
                    )}
                    {isSelected && (
                      <View className="absolute bottom-2 left-2 bg-orange-500 px-3 py-1 rounded-full">
                        <Text className="text-white text-xs font-semibold">{t('selected')}</Text>
                      </View>
                    )}
                  </View>
                  <View className="p-4">
                    <Text className="text-lg font-semibold text-black">
                      {item.name || t('unknown_place')}
                    </Text>
                    {item.briefDescription && (
                      <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
                        {item.briefDescription}
                      </Text>
                    )}
                    {item.formatted_address && (
                      <View className="flex-row items-center mt-2">
                        <Ionicons name="location-outline" size={14} color="#666" />
                        <Text className="text-xs text-gray-400 ml-1" numberOfLines={1}>
                          {item.formatted_address}
                        </Text>
                      </View>
                    )}
                    {hasImages && (
                      <TouchableOpacity
                        className="mt-2 flex-row items-center"
                        onPress={() => {
                          setSelectedPlaceImages(item.photos);
                          setImageModalVisible(true);
                        }}
                      >
                        <Ionicons name="images-outline" size={16} color="#007AFF" />
                        <Text className="text-xs text-blue-500 ml-1">
                          {item.photos.length} {t('view_photos')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      ) : (
        <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[48%]">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-semibold">Монгол улсын аймгууд</Text>
            {loadingAimags && <Text className="text-xs text-gray-400">{t('loading') || 'Ачааллаж байна...'}</Text>}
          </View>
          <ScrollView>
            {aimags.map((aimag, index) => {
              const isSelected = index === selectedIndex;
              return (
                <TouchableOpacity
                  key={aimag.code || index}
                  className={`p-3 rounded-xl mb-2 ${isSelected ? 'bg-orange-50' : 'bg-white'} border border-gray-100`}
                  onPress={() => {
                    setSelectedIndex(index);
                    if (aimag.coordinates) {
                      const region: Region = {
                        latitude: aimag.coordinates.lat,
                        longitude: aimag.coordinates.lng,
                        latitudeDelta: 0.8,
                        longitudeDelta: 0.8,
                      };
                      mapRef.current?.animateToRegion(region, 350);
                    }
                  }}
                >
                  <View className="flex-row items-center">
                    {aimag.image && !imageErrors.has(aimag.image) ? (
                      <Image
                        source={{ uri: aimag.image }}
                        style={{ width: 72, height: 72, borderRadius: 8 }}
                        resizeMode="cover"
                        onError={() => {
                          setImageErrors(prev => new Set(prev).add(aimag.image));
                        }}
                      />
                    ) : (
                      <View
                        style={{ width: 72, height: 72, borderRadius: 8 }}
                        className="bg-gray-200 items-center justify-center"
                      >
                        <Ionicons name="image-outline" size={24} color="#999" />
                      </View>
                    )}
                    <View className="ml-3 flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-base font-semibold text-black flex-1">
                          {aimag.nameMn || aimag.name}
                        </Text>
                        {isSelected && (
                          <View className="bg-orange-500 px-2 py-1 rounded-full">
                            <Text className="text-white text-xs font-semibold">{t('selected')}</Text>
                          </View>
                        )}
                      </View>
                      {!!aimag.capital && (
                        <View className="flex-row items-center mt-1">
                          <Ionicons name="location-outline" size={14} color="#666" />
                          <Text className="text-xs text-gray-600 ml-1">
                            Нийслэл: {aimag.capitalMn || aimag.capital}
                          </Text>
                        </View>
                      )}
                      {!!aimag.description && (
                        <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
                          {aimag.descriptionMn || aimag.description}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Image Gallery Modal */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View className="flex-1 bg-black/90">
          <View className="flex-row justify-between items-center p-4 pt-12">
            <Text className="text-white text-lg font-semibold">
              {t('photos')} ({selectedPlaceImages.length})
            </Text>
            <TouchableOpacity
              onPress={() => setImageModalVisible(false)}
              className="bg-black/50 p-2 rounded-full"
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            className="flex-1"
          >
            {selectedPlaceImages.map((photo, index) => (
              <View
                key={index}
                style={{ width }}
                className="items-center justify-center"
              >
                <Image
                  source={{ uri: photo }}
                  style={{ width: width - 40, height: '80%' }}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
          <View className="absolute bottom-4 left-0 right-0 items-center">
            <View className="flex-row space-x-2">
              {selectedPlaceImages.map((_, index) => (
                <View
                  key={index}
                  className="h-1 bg-white/50 rounded-full"
                  style={{ width: width / selectedPlaceImages.length - 8 }}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


