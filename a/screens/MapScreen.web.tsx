import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, Dimensions, Image, TouchableOpacity, Modal } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../contexts/LanguageContext";
import axios from "axios";
import { API_URL } from "../constants/api";
import { AIMAGS } from "../constants/aimags";

const { width } = Dimensions.get("window");

// Smart interactive map component using Leaflet for web
const SmartMap: React.FC<{ lat: number; lng: number; zoom?: number; language?: string; places?: Place[]; aimags?: any[]; selectedIndex?: number; onLocationChange?: (lat: number, lng: number) => void; localPlaces?: Place[] }> = ({ 
  lat, 
  lng, 
  zoom = 10,
  language = 'mn',
  places = [],
  aimags = [],
  selectedIndex = 0,
  onLocationChange,
  localPlaces = places
    }) => {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);
  const markersRef = React.useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get or create map container
    let container = document.getElementById('leaflet-map-container');
    if (!container) {
      const wrapper = document.getElementById('map-container-wrapper');
      if (wrapper) {
        container = document.createElement('div');
        container.id = 'leaflet-map-container';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.minHeight = '400px';
        container.style.borderRadius = '8px';
        container.style.overflow = 'hidden';
        wrapper.appendChild(container);
      } else {
        return;
      }
    }

    mapContainerRef.current = container as any;

    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      // Check if Leaflet is already loaded
      if ((window as any).L && mapInstanceRef.current) {
        // Update existing map
        mapInstanceRef.current.setView([lat, lng], zoom);
        return;
      }

      // Load CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }

      // Load JS
      if (!(window as any).L) {
        return new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
          script.crossOrigin = '';
          script.onload = () => resolve();
          script.onerror = () => resolve(); // Continue even if fails
          document.body.appendChild(script);
        });
      }
    };

    loadLeaflet().then(() => {
      if (!(window as any).L || !mapContainerRef.current) return;
      
      const L = (window as any).L;
      
      // Initialize map if not exists
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
        }).setView([lat, lng], zoom);

        // Add tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);
      } else {
        mapInstanceRef.current.setView([lat, lng], zoom);
      }

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add markers for places
      const placesToShow = localPlaces.length > 0 ? localPlaces : places;
      if (placesToShow.length > 0) {
        placesToShow.forEach((place, index) => {
          if (place.geometry?.location) {
            const isSelected = index === selectedIndex;
            const marker = L.marker([place.geometry.location.lat, place.geometry.location.lng], {
              icon: L.divIcon({
                className: `custom-marker ${isSelected ? 'selected' : ''}`,
                html: `<div style="background-color: ${isSelected ? '#FF5722' : '#007AFF'}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })
            })
              .addTo(mapInstanceRef.current)
              .bindPopup(`<b>${place.name || 'Unknown'}</b><br>${place.briefDescription || ''}`);
            
            if (isSelected) {
              marker.openPopup();
              mapInstanceRef.current.setView([place.geometry.location.lat, place.geometry.location.lng], 14);
            }
            
            markersRef.current.push(marker);
          }
        });
      } else if (aimags.length > 0) {
        aimags.forEach((aimag, index) => {
          if (aimag.coordinates) {
            const isSelected = index === selectedIndex;
            const aimagName = language === 'mn' && aimag.nameMn ? aimag.nameMn : aimag.name;
            const marker = L.marker([aimag.coordinates.lat, aimag.coordinates.lng], {
              icon: L.divIcon({
                className: `custom-marker ${isSelected ? 'selected' : ''}`,
                html: `<div style="background-color: ${isSelected ? '#FF5722' : '#4CAF50'}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })
            })
              .addTo(mapInstanceRef.current)
              .bindPopup(`<b>${aimagName}</b><br>${aimag.capital || ''}`);
            
            if (isSelected) {
              marker.openPopup();
              mapInstanceRef.current.setView([aimag.coordinates.lat, aimag.coordinates.lng], 8);
            }
            
            markersRef.current.push(marker);
          }
        });
      }

      // Fit bounds if multiple markers
      if (markersRef.current.length > 1) {
        const group = new L.FeatureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    });
  }, [lat, lng, zoom, places, aimags, selectedIndex, language]);

  return (
    <View 
      id="map-container-wrapper"
      style={{ width: '100%', height: '100%', position: 'relative' }}
    />
  );
};

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
  MapScreen: { places: Place[]; allowRemove?: boolean; onRemove?: (index: number) => void };
};

export default function MapScreen() {
  const { t, language } = useLanguage();
  const isMongolian = language === "mn";
  const isJapanese = language === "ja";
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MapRouteParams, "MapScreen">>();
  const places = route.params?.places || [];
  const allowRemove = route.params?.allowRemove || false;
  const onRemove = route.params?.onRemove;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedPlaceImages, setSelectedPlaceImages] = useState<string[]>([]);
  const [aimags, setAimags] = useState<any[]>([]);
  const [loadingAimags, setLoadingAimags] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [localPlaces, setLocalPlaces] = useState<Place[]>(places);
  const copy = {
    aimags: isMongolian ? "аймаг" : isJapanese ? "県" : "aimags",
    aimagsTitle: isMongolian ? "Монголын аймгууд" : isJapanese ? "モンゴルの県" : "Mongolia Aimags",
    loading: isMongolian ? "Ачааллаж байна..." : isJapanese ? "読み込み中..." : "Loading...",
    capital: isMongolian ? "Нийслэл" : isJapanese ? "県庁所在地" : "Capital",
    attractions: isMongolian ? "Сонирхолтой газрууд" : isJapanese ? "見どころ" : "Attractions",
  };
  
  // Update local places when route params change
  useEffect(() => {
    setLocalPlaces(places);
  }, [places]);

  // Fetch aimags when no places are available
  useEffect(() => {
    if (places.length === 0) {
      fetchAimags();
    }
  }, [places.length]);

  const fetchAimags = async () => {
    try {
      setLoadingAimags(true);
      const response = await axios.get(`${API_URL}/api/places/aimags`, {
        timeout: 5000,
      });
      setAimags(response.data?.items || AIMAGS);
    } catch (error) {
      console.error('Error fetching aimags:', error);
      // Fallback to local data
      setAimags(AIMAGS);
    } finally {
      setLoadingAimags(false);
    }
  };

  // For web, we'll use a link to Google Maps since iframe embedding has limitations
  const openInGoogleMaps = (lat?: number, lng?: number) => {
    if (localPlaces.length > 0) {
      const place = localPlaces[selectedIndex] || localPlaces[0];
      const placeLat = lat || place.geometry?.location?.lat || 47.8864;
      const placeLng = lng || place.geometry?.location?.lng || 106.9057;
      window.open(`https://www.google.com/maps?q=${placeLat},${placeLng}`, '_blank');
    } else if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    } else {
      window.open('https://www.google.com/maps/@47.8864,106.9057,12z', '_blank');
    }
  };

  // Get current location for map
  const getCurrentMapLocation = () => {
    if (localPlaces.length > 0) {
      const place = localPlaces[selectedIndex] || localPlaces[0];
      return {
        lat: place.geometry?.location?.lat || 47.8864,
        lng: place.geometry?.location?.lng || 106.9057,
      };
    } else if (aimags.length > 0 && aimags[selectedIndex]?.coordinates) {
      return aimags[selectedIndex].coordinates;
    }
    return { lat: 47.8864, lng: 106.9057 }; // Default to Ulaanbaatar
  };

  const currentLocation = getCurrentMapLocation();

  return (
    <View className="flex-1 bg-white">
      {/* Smart Interactive Map Section */}
      <View style={{ height: '50%', width: '100%', position: 'relative', backgroundColor: '#f0f0f0' }}>
        {typeof window !== 'undefined' ? (
          <SmartMap
            lat={currentLocation.lat}
            lng={currentLocation.lng}
            zoom={localPlaces.length > 0 ? 12 : 6}
            language={language}
            places={localPlaces}
            aimags={aimags}
            selectedIndex={selectedIndex}
            localPlaces={localPlaces}
            onLocationChange={(newLat, newLng) => {
              // Update location if needed
            }}
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-gray-100">
            <Ionicons name="map" size={64} color="#9ca3af" />
            <Text className="text-gray-500 text-lg mt-4 mb-2">{t('interactive_map')}</Text>
          </View>
        )}
        {/* Map Controls Overlay */}
        <View className="absolute top-4 right-4 flex-col gap-2">
          <TouchableOpacity
            onPress={() => {
              if (localPlaces.length > 0) {
                openInGoogleMaps();
              } else if (aimags.length > 0 && aimags[selectedIndex]?.coordinates) {
                const aimag = aimags[selectedIndex];
                openInGoogleMaps(aimag.coordinates.lat, aimag.coordinates.lng);
              } else {
                openInGoogleMaps();
              }
            }}
            className="bg-blue-500 px-4 py-2 rounded-lg shadow-lg"
          >
            <Text className="text-white font-semibold text-sm">{t('open_in_google_maps')}</Text>
          </TouchableOpacity>
          {(places.length > 0 || aimags.length > 0) && (
            <View className="bg-white/90 px-3 py-2 rounded-lg shadow-lg">
              <Text className="text-gray-700 text-xs font-medium">
                {places.length > 0 
                  ? `${places.length} ${t('places_on_map')}`
                  : `${aimags.length} ${copy.aimags}`
                }
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Places List */}
      <View className="flex-1 bg-white">
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-lg font-semibold">
            {places.length > 0 
              ? `${t('places')} (${places.length})`
              : `${copy.aimagsTitle} (${aimags.length})`
            }
          </Text>
        </View>
        <ScrollView className="flex-1">
          {places.length === 0 ? (
            loadingAimags ? (
              <View className="flex-1 justify-center items-center py-20">
                <Text className="text-gray-500 text-lg">{t('loading') || copy.loading}</Text>
              </View>
            ) : (
              <View className="p-4">
                <Text className="text-lg font-semibold mb-4">
                  {copy.aimagsTitle} ({aimags.length})
                </Text>
                {aimags.map((aimag, index) => {
                  const aimagName = language === 'mn' && aimag.nameMn ? aimag.nameMn : aimag.name;
                  const aimagCapital = language === 'mn' && aimag.capitalMn ? aimag.capitalMn : aimag.capital;
                  const aimagDesc = language === 'mn' && aimag.descriptionMn ? aimag.descriptionMn : aimag.description;
                  
                  return (
                    <TouchableOpacity
                      key={aimag.code || index}
                      className={`p-4 border-b border-gray-100 ${index === selectedIndex ? 'bg-orange-50' : 'bg-white'}`}
                      onPress={() => {
                        setSelectedIndex(index);
                        if (aimag.coordinates) {
                          openInGoogleMaps(aimag.coordinates.lat, aimag.coordinates.lng);
                        }
                      }}
                    >
                      <View className="flex-row">
                        {aimag.image && !imageErrors.has(aimag.image) ? (
                          <Image
                            source={{ uri: aimag.image }}
                            style={{ width: 100, height: 100, borderRadius: 8 }}
                            resizeMode="cover"
                            onError={() => {
                              setImageErrors(prev => new Set(prev).add(aimag.image));
                            }}
                          />
                        ) : (
                          <View 
                            style={{ width: 100, height: 100, borderRadius: 8 }}
                            className="bg-gray-200 items-center justify-center"
                          >
                            <Ionicons name="image-outline" size={32} color="#999" />
                          </View>
                        )}
                        <View className="flex-1 ml-4">
                          <View className="flex-row items-center">
                            <Text className="text-base font-semibold text-black flex-1">
                              {aimagName}
                            </Text>
                            {index === selectedIndex && (
                              <View className="bg-orange-500 px-2 py-1 rounded-full">
                                <Text className="text-white text-xs font-semibold">{t('selected')}</Text>
                              </View>
                            )}
                          </View>
                          {aimagCapital && (
                            <View className="flex-row items-center mt-1">
                              <Ionicons name="location-outline" size={14} color="#666" />
                              <Text className="text-xs text-gray-600 ml-1">
                                {copy.capital}: {aimagCapital}
                              </Text>
                            </View>
                          )}
                          {aimagDesc && (
                            <Text className="text-sm text-gray-500 mt-2" numberOfLines={2}>
                              {aimagDesc}
                            </Text>
                          )}
                          {aimag.attractions && aimag.attractions.length > 0 && (
                            <View className="mt-2">
                              <Text className="text-xs text-gray-400">
                                {copy.attractions}: {aimag.attractions.slice(0, 2).join(', ')}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
          ) : (
            localPlaces.map((place, index) => {
              const hasImages = place.photos && place.photos.length > 0;
              const isSelected = index === selectedIndex;
              
  return (
                <TouchableOpacity
                  key={index}
                  className={`p-4 border-b border-gray-100 ${isSelected ? 'bg-orange-50' : 'bg-white'}`}
                  onPress={() => setSelectedIndex(index)}
                >
                  <View className="flex-row">
                    {hasImages && place.photos[0] && !imageErrors.has(place.photos[0]) ? (
                      <Image
                        source={{ uri: place.photos[0] }}
                        style={{ width: 100, height: 100, borderRadius: 8 }}
                        resizeMode="cover"
                        onError={() => {
                          setImageErrors(prev => new Set(prev).add(place.photos[0]));
                        }}
                        onLoadStart={() => {
                          // Image is loading
                        }}
                      />
                    ) : (
                      <View 
                        style={{ width: 100, height: 100, borderRadius: 8 }}
                        className="bg-gray-200 items-center justify-center"
                      >
                        <Ionicons name="image-outline" size={32} color="#999" />
                      </View>
                    )}
                    <View className="flex-1 ml-4">
                      <View className="flex-row items-center">
                        <Text className="text-base font-semibold text-black flex-1">
                          {place.name || t('unknown_place')}
                        </Text>
                        {isSelected && (
                          <View className="bg-orange-500 px-2 py-1 rounded-full">
                            <Text className="text-white text-xs font-semibold">{t('selected')}</Text>
                          </View>
                        )}
                        {allowRemove && (
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              const newPlaces = localPlaces.filter((_, i) => i !== index);
                              setLocalPlaces(newPlaces);
                              if (onRemove) {
                                onRemove(index);
                              }
                              if (selectedIndex >= newPlaces.length && newPlaces.length > 0) {
                                setSelectedIndex(newPlaces.length - 1);
                              } else if (newPlaces.length === 0) {
                                navigation.goBack();
                              }
                            }}
                            className="ml-2 bg-red-100 px-2 py-1 rounded-full"
                          >
                            <Ionicons name="close" size={16} color="#dc2626" />
                          </TouchableOpacity>
                        )}
                      </View>
                      {place.briefDescription && (
                        <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
                          {place.briefDescription}
                        </Text>
                      )}
                      {place.formatted_address && (
                        <View className="flex-row items-center mt-2">
                          <Ionicons name="location-outline" size={14} color="#666" />
                          <Text className="text-xs text-gray-400 ml-1" numberOfLines={1}>
                            {place.formatted_address}
                          </Text>
                        </View>
                      )}
                      {hasImages && (
                        <TouchableOpacity 
                          className="mt-2 flex-row items-center"
                          onPress={() => {
                            setSelectedPlaceImages(place.photos);
                            setImageModalVisible(true);
                          }}
                        >
                          <Ionicons name="images-outline" size={16} color="#007AFF" />
                          <Text className="text-xs text-blue-500 ml-1">
                            {place.photos.length} {t('view_photos')}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

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
        </View>
      </Modal>
    </View>
  );
}
