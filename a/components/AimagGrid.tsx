import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import axios from 'axios';
import { API_URL, getErrorMessage, isNetworkError } from '../constants/api';
import { useLanguage } from '../contexts/LanguageContext';
import { AIMAGS } from '../constants/aimags';

type AimagItem = {
  _id: string;
  name: string;
  nameMn?: string;
  image: string;
  code?: string;
};

const AimagGrid = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<AimagItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/places/aimags`, { timeout: 15000 });
        if (!mounted) return;
        const fromApi = res.data.items || [];
        if (fromApi.length > 0) {
          setItems(fromApi);
          setError(null);
        } else {
          // Fallback to local constants if API returned empty
          const local = (AIMAGS || []).map((a: any, idx: number) => ({
            _id: a.code || String(idx),
            name: a.name,
            nameMn: a.nameMn,
            image: a.image,
            code: a.code,
          }));
          setItems(local);
          setError(null);
        }
      } catch (e: any) {
        if (!mounted) return;
        // Fallback to local constants on error
        const local = (AIMAGS || []).map((a: any, idx: number) => ({
          _id: a.code || String(idx),
          name: a.name,
          nameMn: a.nameMn,
          image: a.image,
          code: a.code,
        }));
        setItems(local);
        const msg = getErrorMessage(e);
        setError(msg);
        if (isNetworkError(e)) {
          console.warn('Backend server is not running. Please start it with: cd api && npm start');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <View className="py-6 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View className="py-4">
        <Text className="text-red-500 text-sm">{error}</Text>
      </View>
    );
  }

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {items.map((aimag) => (
          <TouchableOpacity key={aimag._id} className="mr-4">
            <View className="w-40">
              <Image
                source={{ uri: aimag.image }}
                className="w-40 h-52 rounded-2xl"
                resizeMode="cover"
              />
              <View className="mt-2">
                <Text className="text-base font-semibold" numberOfLines={1}>
                  {aimag.nameMn || aimag.name}
                </Text>
                {aimag.nameMn && (
                  <Text className="text-xs text-gray-500" numberOfLines={1}>
                    {aimag.name}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default AimagGrid;


