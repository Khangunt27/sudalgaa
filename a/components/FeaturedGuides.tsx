import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

type Guide = {
  place: string;
  description: string;
  image: string;
  user: {
    name: string;
    avatar: string;
    views: number;
  };
};

interface FeaturedGuidesProps {
  onGuidePress?: (guide: Guide) => void;
}

const guides: Guide[] = [
  {
    place: 'Sukhbaatar Square',
    description:
      'Central square, Government Palace and museums nearby. Great for photos.',
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    user: {
      name: 'Amaraa',
      avatar: 'https://cdn-icons-png.flaticon.com/128/149/149071.png',
      views: 612,
    },
  },
  {
    place: 'Gandantegchinlen Monastery',
    description:
      'See monks chanting and the giant Migjid Janraisig statue.',
    image:
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1200&q=80',
    user: {
      name: 'Bolor',
      avatar: 'https://cdn-icons-png.flaticon.com/128/149/149071.png',
      views: 487,
    },
  },
  {
    place: 'Terelj Day Trip',
    description:
      'Visit Turtle Rock and Aryabal monastery, nature close to UB.',
    image:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
    user: {
      name: 'Ganzorig',
      avatar: 'https://cdn-icons-png.flaticon.com/128/149/149071.png',
      views: 854,
    },
  },
];

const FeaturedGuides: React.FC<FeaturedGuidesProps> = ({ onGuidePress }) => {
  const { t } = useLanguage();
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
        {guides.map((guide, index) => (
          <TouchableOpacity
            key={index}
            className="w-72 mr-5 rounded-3xl overflow-hidden bg-white shadow-md border border-gray-100"
            onPress={() => onGuidePress?.(guide)}
          >
            <View className="relative">
              <Image
                source={{ uri: guide.image }}
                className="w-full h-48"
                resizeMode="cover"
              />
              <View className="absolute top-3 right-3 bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                <Text className="text-white text-xs font-medium">{t('featured') || 'Featured'}</Text>
              </View>
            </View>

            <View className="p-4">
              <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={1}>{guide.place}</Text>
              <Text className="text-sm text-gray-600 leading-5 mb-3" numberOfLines={2}>
                {guide.description}
              </Text>

              <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                <View className="flex-row items-center">
                  <Image
                    source={{ uri: guide.user.avatar }}
                    className="w-9 h-9 rounded-full border-2 border-white shadow-sm mr-2"
                  />
                  <View>
                    <Text className="text-xs font-semibold text-gray-800">{guide.user.name}</Text>
                    <Text className="text-[10px] text-gray-500">{t('guide') || 'Guide'}</Text>
                  </View>
                </View>
                <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-lg">
                  <Text className="text-xs font-medium text-primary">{guide.user.views}</Text>
                  <Text className="text-[10px] text-gray-500 ml-1">{t('views')}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default FeaturedGuides;
