import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GuideStackParamList } from '../navigation/GuideStack';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { API_URL } from '../constants/api';
import { createPlaceholderImage } from '../constants/imageFallback';

// Define navigation prop type
type GuideScreenNavigationProp = NativeStackNavigationProp<GuideStackParamList>;

// Sample data for Mongolia places
const places = [
  {
    id: '1',
    name: 'Сүхбаатарын талбай',
    nameEn: 'Sukhbaatar Square',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    description:
      'Улаанбаатарын төв талбай, Засгийн газрын ордон, музейнууд орчимд байрладаг. Зураг авахад маш тохиромжтой газар.',
    descriptionEn: 'The central square of Ulaanbaatar with the Government Palace and museums nearby. Great for photos.',
    attributes: {
      location: 'Чингэлтэй дүүрэг, Улаанбаатар',
      locationEn: 'Chingeltei District, Ulaanbaatar',
      type: 'Хотын тэмдэглэл',
      typeEn: 'City Landmark',
      bestTime: '5-р сар - 9-р сар',
      bestTimeEn: 'May - September',
      attractions: ['Засгийн газрын ордон', 'Чингис хааны хөшөө', 'Үндэсний музей'],
      attractionsEn: ['Government Palace', 'Chinggis Khaan Statue', 'National Museum'],
    },
  },
  {
    id: '2',
    name: 'Гандантэгчинлэн хийд',
    nameEn: 'Gandantegchinlen Monastery',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1200&q=80',
    description:
      'Монгол улсын хамгийн том хийд, идэвхтэй шашны газар. Лам нарын уншлага, агуу Мигжид Жанрайсиг хөшөөг үзэх боломжтой.',
    descriptionEn: 'Largest monastery in Mongolia, active religious site. See monks chanting and the giant Migjid Janraisig statue.',
    attributes: {
      location: 'Баянгол дүүрэг, Улаанбаатар',
      locationEn: 'Bayangol District, Ulaanbaatar',
      type: 'Хийд',
      typeEn: 'Monastery',
      bestTime: 'Жилийн турш',
      bestTimeEn: 'Year-round',
      attractions: ['Мигжид Жанрайсиг хөшөө', 'Лам нарын уншлага'],
      attractionsEn: ['Migjid Janraisig statue', 'Monk chants'],
    },
  },
  {
    id: '3',
    name: 'Тэрэлж байгалийн цогцолборт газар',
    nameEn: 'Terelj National Park',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
    description:
      'Улаанбаатараас ойрхон байрлах байгалийн цогцолборт газар. Ямаа чулуу, Ариабалагийн сүм зэрэг үзэсгэлэнт газруудтай.',
    descriptionEn: 'Nature getaway with rock formations and temples. Visit Turtle Rock and Aryabal monastery, nature close to UB.',
    attributes: {
      location: 'Горхи-Тэрэлж, Төв аймаг',
      locationEn: 'Gorkhi-Terelj, Töv Aimag',
      type: 'Байгалийн цогцолборт газар',
      typeEn: 'National Park',
      bestTime: '5-р сар - 10-р сар',
      bestTimeEn: 'May - October',
      attractions: ['Ямаа чулуу', 'Ариабалагийн сүм', 'Уулын аялал'],
      attractionsEn: ['Turtle Rock', 'Aryabal Temple', 'Hiking'],
    },
  },
  {
    id: '4',
    name: 'Зайсан толгой',
    nameEn: 'Zaisan Memorial',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
    description:
      'Хотын үзэсгэлэнт панорама бүхий уулын орой дээрх Зөвлөлтийн хөшөө. Нар жаргах үед маш үзэсгэлэнт харагдана.',
    descriptionEn: 'Hilltop Soviet memorial with panoramic city views. Best visited at sunset for stunning views.',
    attributes: {
      location: 'Хан-Уул дүүрэг, Улаанбаатар',
      locationEn: 'Khan-Uul District, Ulaanbaatar',
      type: 'Үзэсгэлэнт газар',
      typeEn: 'Viewpoint',
      bestTime: 'Нар жаргах',
      bestTimeEn: 'Sunset',
      attractions: ['Хөшөөний зураг', 'Хотын панорама'],
      attractionsEn: ['Mural', 'Skyline views'],
    },
  },
  {
    id: '5',
    name: 'Богд хааны ордон',
    nameEn: 'Bogd Khan Palace Museum',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
    description:
      'Монгол улсын сүүлчийн хааны ордон. Монголын түүх, соёлын үнэт дурсгалуудыг хадгалж байна.',
    descriptionEn: 'The palace of Mongolia\'s last king. Houses valuable artifacts of Mongolian history and culture.',
    attributes: {
      location: 'Сүхбаатар дүүрэг, Улаанбаатар',
      locationEn: 'Sükhbaatar District, Ulaanbaatar',
      type: 'Музей',
      typeEn: 'Museum',
      bestTime: 'Жилийн турш',
      bestTimeEn: 'Year-round',
      attractions: ['Хааны ордон', 'Түүхэн дурсгалууд', 'Соёлын үнэт зүйлс'],
      attractionsEn: ['Royal Palace', 'Historical Artifacts', 'Cultural Treasures'],
    },
  },
  {
    id: '6',
    name: 'Монголын үндэсний музей',
    nameEn: 'National Museum of Mongolia',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1200&q=80',
    description:
      'Монгол улсын түүх, соёлыг бүрэн харуулсан музей. Чингис хааны үеэс одоогийн байдал хүртэлх түүхийг судлах боломжтой.',
    descriptionEn: 'Comprehensive museum showcasing Mongolian history and culture. Explore from Genghis Khan era to modern times.',
    attributes: {
      location: 'Сүхбаатар дүүрэг, Улаанбаатар',
      locationEn: 'Sükhbaatar District, Ulaanbaatar',
      type: 'Музей',
      typeEn: 'Museum',
      bestTime: 'Жилийн турш',
      bestTimeEn: 'Year-round',
      attractions: ['Түүхэн үзмэрүүд', 'Соёлын дурсгалууд', 'Орчуулагч'],
      attractionsEn: ['Historical Exhibits', 'Cultural Artifacts', 'Guided Tours'],
    },
  },
];

const GuideScreen = () => {
  const navigation = useNavigation<GuideScreenNavigationProp>();
  const { t, language } = useLanguage();
  const isMongolian = language === 'mn';
  const isJapanese = language === 'ja';
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [placeImages, setPlaceImages] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState(true);
  const screenCopy = {
    title: isMongolian ? 'Монголын онцлох газрууд' : isJapanese ? 'モンゴルの注目スポット' : 'Explore Mongolia',
    subtitle: isMongolian
      ? 'Хот, түүх, байгаль, соёлыг нэг дороос харж болох аяллын цэгүүд'
      : isJapanese
        ? '都市、歴史、自然、文化をまとめて楽しめるモンゴルの見どころ'
        : 'A handpicked collection of city landmarks, culture, history, and nature',
    typeLabel: isMongolian ? 'Төрөл' : isJapanese ? '種類' : 'Type',
    bestTimeLabel: isMongolian ? 'Зочлоход тохиромжтой үе' : isJapanese ? 'おすすめ時期' : 'Best time',
    attractionsLabel: isMongolian ? 'Гол үзмэрүүд' : isJapanese ? '見どころ' : 'Highlights',
  };

  // Fetch relevant images from Unsplash for each place
  useEffect(() => {
    let isMounted = true;
    const fetchImages = async () => {
      try {
        setLoadingImages(true);
        const imagePromises = places.map(async (place) => {
          try {
            const response = await axios.get(`${API_URL}/api/media/place-images`, {
              params: { name: place.nameEn, contextName: 'Mongolia Ulaanbaatar', count: 1 },
              timeout: 8000,
            });
            if (response.data?.images?.[0]) {
              return {
                id: place.id,
                image: response.data.images[0],
              };
            }
          } catch (err) {
            console.warn(`Failed to fetch image for ${place.nameEn}:`, err);
          }
          return { id: place.id, image: place.image || createPlaceholderImage(place.nameEn, 1200, 700) };
        });

        const results = await Promise.all(imagePromises);
        if (!isMounted) return;

        const imagesMap: Record<string, string> = {};
        results.forEach((result) => {
          if (result) {
            imagesMap[result.id] = result.image;
          }
        });
        setPlaceImages(imagesMap);
      } catch (error) {
        console.error('Error fetching guide images:', error);
      } finally {
        if (isMounted) {
          setLoadingImages(false);
        }
      }
    };

    fetchImages();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 py-5 border-b border-orange-100 bg-orange-50">
          <Text className="text-3xl font-black text-gray-900">
            {screenCopy.title}
          </Text>
          <Text className="text-sm font-medium text-gray-600 mt-2 leading-5">
            {screenCopy.subtitle}
          </Text>
        </View>

        {/* Places Cards */}
        {places.map((place) => (
          <Pressable
            key={place.id}
            onPress={() =>
              navigation.navigate('GuideDetail', { place }) // Placeholder screen
            }
            className="mx-4 mt-4 rounded-xl overflow-hidden shadow-sm"
            style={styles.card}
          >
            {(() => {
              const imageUrl = placeImages[place.id] || place.image;
              return imageUrl && !imageErrors.has(imageUrl) ? (
                <ImageBackground
                  source={{ uri: imageUrl }}
                  className="w-full h-full"
                  style={styles.image}
                  imageStyle={{ resizeMode: 'cover' }}
                  onError={() => {
                    setImageErrors(prev => new Set(prev).add(imageUrl));
                  }}
                >
                  {/* Gradient Overlay */}
                  <View className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                  {/* Place Name and Description */}
                  <View className="p-4 flex-1 justify-end">
                    <Text className="text-white text-xl font-bold mb-2">
                      {isMongolian ? place.name : (place.nameEn || place.name)}
                    </Text>
                    <Text className="text-white text-sm font-medium line-clamp-2">
                      {isMongolian ? place.description : (place.descriptionEn || place.description)}
                    </Text>
                  </View>
                </ImageBackground>
              ) : loadingImages ? (
                <View style={styles.image} className="bg-gray-100 items-center justify-center">
                  <ActivityIndicator size="large" color="#fb923c" />
                </View>
              ) : (
                <View style={styles.image} className="bg-gradient-to-br from-orange-400 to-orange-600 items-center justify-center">
                  <Ionicons name="image-outline" size={64} color="#fff" />
                  <Text className="text-white text-lg font-semibold mt-4">
                    {isMongolian ? place.name : (place.nameEn || place.name)}
                  </Text>
                </View>
              );
            })()}

            {/* Attributes Section */}
            <View className="p-4 bg-white">
              <View className="flex-row items-center mb-2">
                <Ionicons name="location-outline" size={16} color="#FF5722" />
                <Text className="text-gray-800 text-sm font-medium ml-2">
                  {isMongolian ? place.attributes.location : (place.attributes.locationEn || place.attributes.location)}
                </Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="map-outline" size={16} color="#FF5722" />
                <Text className="text-gray-800 text-sm font-medium ml-2">
                  {screenCopy.typeLabel}: {isMongolian ? place.attributes.type : (place.attributes.typeEn || place.attributes.type)}
                </Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="calendar-outline" size={16} color="#FF5722" />
                <Text className="text-gray-800 text-sm font-medium ml-2">
                  {screenCopy.bestTimeLabel}: {isMongolian ? place.attributes.bestTime : (place.attributes.bestTimeEn || place.attributes.bestTime)}
                </Text>
              </View>
              <View className="flex-row items-center flex-wrap">
                <Ionicons name="star-outline" size={16} color="#FF5722" />
                <Text className="text-gray-800 text-sm font-medium ml-2">
                  {screenCopy.attractionsLabel}: {isMongolian 
                    ? place.attributes.attractions.join(', ')
                    : (place.attributes.attractionsEn || place.attributes.attractions).join(', ')
                  }
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: {
    height: Dimensions.get('window').height * 0.5, // ~50% of screen height
    marginBottom: 16,
  },
  image: {
    height: '60%', // Image takes 60% of card height
  },
});

export default GuideScreen;
