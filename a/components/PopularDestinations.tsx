import { View, ScrollView, Image, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../constants/api';
import { useLanguage } from '../contexts/LanguageContext';
import { createPlaceholderImage } from '../constants/imageFallback';

const staticDest = [
  { name: 'Sukhbaatar square', mn: 'Сүхбаатарын талбай' },
  { name: 'Gandan Monastery', mn: 'Гандантэгчинлэн хийд' },
  { name: 'Hustai National Park', mn: 'Хустайн нуруу' },
  { name: 'Genghis Khan Statue', mn: 'Чингис хааны морьт хөшөө' },
  { name: 'Zaisan Memorial', mn: 'Зайсан толгой' },
];

const PopularDestinations = () => {
  const { t } = useLanguage();
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const enriched = await Promise.all(staticDest.map(async (d) => {
          try {
            const res = await axios.get(`${API_URL}/api/media/place-images`, {
              params: { name: d.name, count: 1 },
              timeout: 5000
            });
            const img = res.data.images?.[0] || createPlaceholderImage(d.name, 400, 600);
            return { ...d, image: img };
          } catch (e) {
            return { ...d, image: createPlaceholderImage(d.name, 400, 600) };
          }
        }));
        setDestinations(enriched);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator />;

  return (
    <View className="mt-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20 }}
      >
        {destinations.map((place, index) => (
          <TouchableOpacity key={index} className="mr-4 relative shadow-md active:opacity-90">
            <Image
              source={{ uri: place.image }}
              className="w-44 h-60 rounded-3xl"
              resizeMode="cover"
            />
            <View className="absolute inset-0 rounded-3xl bg-black/20" />
            <View className="absolute bottom-0 left-0 right-0 h-24 rounded-b-3xl justify-end p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <Text className="text-white font-bold text-lg leading-6 shadow-sm">{place.mn || place.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default PopularDestinations;
