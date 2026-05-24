import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../constants/api';
import { useLanguage } from '../contexts/LanguageContext';
import { createPlaceholderImage } from '../constants/imageFallback';

const staticPlaces = [
  { name: 'Choijin Lama Temple', mn: 'Чойжин ламын сүм' },
  { name: 'National Museum of Mongolia', mn: 'Үндэсний түүхийн музей' },
  { name: 'Bogd Khan Palace Museum', mn: 'Богд хааны ордон музей' },
  { name: 'Zaisan Memorial', mn: 'Зайсан толгой' },
  { name: 'Terelj National Park', mn: 'Тэрэлж байгалийн цогцолборт газар' },
];

const WeekendTrips = () => {
  const { t } = useLanguage();
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const enriched = await Promise.all(staticPlaces.map(async (p) => {
          try {
            const res = await axios.get(`${API_URL}/api/media/place-images`, {
              params: { name: p.name, count: 1 },
              timeout: 5000
            });
            const img = res.data.images?.[0] || createPlaceholderImage(p.name, 400, 600);
            return { ...p, image: img };
          } catch (e) {
            return { ...p, image: createPlaceholderImage(p.name, 400, 600) };
          }
        }));
        setPlaces(enriched);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator />;

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {places.map((place, index) => (
          <TouchableOpacity key={index} className="mr-5 relative shadow-sm active:opacity-90">
            <Image
              source={{ uri: place.image }}
              className="w-44 h-60 rounded-3xl"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/20 rounded-3xl" />
            <View className="absolute bottom-0 left-0 right-0 h-24 rounded-b-3xl justify-end p-4">
              <Text className="text-white font-bold text-lg leading-6 shadow-sm">{place.mn || place.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default WeekendTrips;
