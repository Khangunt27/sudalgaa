import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GuideStackParamList } from '../navigation/GuideStack';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '@clerk/clerk-expo';
import axios from 'axios';
import { API_URL } from '../constants/api';
import { LinearGradient } from 'expo-linear-gradient';

type GuideDetailScreenRouteProp = RouteProp<GuideStackParamList, 'GuideDetail'>;

type Props = {
  route: GuideDetailScreenRouteProp;
  navigation: any;
};

const GuideDetailScreen = ({ route, navigation }: Props) => {
  const { place } = route.params;
  const { language } = useLanguage();
  const { user } = useUser();
  const isMongolian = language === 'mn';
  const isJapanese = language === 'ja';
  const copy = {
    error: isMongolian ? 'Алдаа' : isJapanese ? 'エラー' : 'Error',
    success: isMongolian ? 'Амжилттай' : isJapanese ? '成功' : 'Success',
    about: isMongolian ? 'Тухай' : isJapanese ? '概要' : 'About',
    type: isMongolian ? 'Төрөл' : isJapanese ? '種類' : 'Type',
    bestTime: isMongolian ? 'Зочлоход тохиромжтой үе' : isJapanese ? 'おすすめ時期' : 'Best Time',
    keySpots: isMongolian ? 'Гол үзмэрүүд' : isJapanese ? '見どころ' : 'Key Spots',
    writeReview: isMongolian ? 'Сэтгэгдэл үлдээх' : isJapanese ? 'レビューを書く' : 'Write a Review',
    experiencePrompt: isMongolian ? 'Таны аяллын туршлага ямар байсан бэ?' : isJapanese ? '体験はいかがでしたか？' : 'How was your experience?',
    reviewPlaceholder: isMongolian ? 'Сэтгэгдлээ энд бичнэ үү...' : isJapanese ? '感想をここに入力してください...' : 'Share your thoughts here...',
    submitting: isMongolian ? 'Илгээж байна...' : isJapanese ? '送信中...' : 'Submitting...',
    postReview: isMongolian ? 'Сэтгэгдэл нийтлэх' : isJapanese ? 'レビューを投稿' : 'Post Review',
    visitorReviews: isMongolian ? 'Хэрэглэгчийн үнэлгээ' : isJapanese ? '訪問者レビュー' : 'Visitor Reviews',
    reviewCount: isMongolian ? 'сэтгэгдэл' : isJapanese ? '件のレビュー' : 'reviews',
    noReviews: isMongolian ? 'Одоогоор сэтгэгдэл алга' : isJapanese ? 'まだレビューはありません。最初のレビューを書いてみましょう。' : 'No reviews yet. Be the first!',
    commentRequired: isMongolian ? 'Сэтгэгдэл бичнэ үү' : isJapanese ? 'コメントを入力してください' : 'Please enter a comment',
    submitted: isMongolian ? 'Таны сэтгэгдэл илгээгдлээ' : isJapanese ? 'レビューが送信されました' : 'Your review was submitted',
    submitFailed: isMongolian ? 'Сэтгэгдэл илгээж чадсангүй' : isJapanese ? 'レビューを送信できませんでした' : 'Failed to submit review',
    addPhoto: isMongolian ? 'Зураг нэмэх' : isJapanese ? '写真を追加' : 'Add Photo',
    removePhoto: isMongolian ? 'Устгах' : isJapanese ? '削除' : 'Remove',
  };

  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [place.id]);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await axios.get(`${API_URL}/api/reviews/${place.id}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      // In a real app we'd upload this to a server, but for now we'll use base64 or URI
      setSelectedImage(result.assets[0].uri);
    }
  };

  const submitReview = async () => {
    if (!newComment.trim()) {
      Alert.alert(copy.error, copy.commentRequired);
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/api/reviews`, {
        placeId: place.id,
        placeName: place.nameEn || place.name,
        rating: newRating,
        comment: newComment,
        photos: selectedImage ? [selectedImage] : [],
        userName: user?.fullName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Traveler',
        userAvatar: user?.imageUrl,
        location: place.attributes.location,
        category: place.attributes.type,
      });

      setNewComment('');
      setNewRating(5);
      setSelectedImage(null);
      fetchReviews();
      Alert.alert(copy.success, copy.submitted);
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert(copy.error, copy.submitFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && setNewRating(star)}
            disabled={!interactive}
          >
            <Ionicons
              name={star <= (interactive ? newRating : rating) ? "star" : "star-outline"}
              size={interactive ? 32 : 16}
              color="#fb923c"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Image Header */}
        <ImageBackground
          source={{ uri: place.image }}
          className="w-full h-80"
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(15, 23, 42, 0.9)']}
            className="absolute inset-0"
          />

          {/* Back Button */}
          <TouchableOpacity
            className="absolute top-4 left-4 p-2 bg-white/20 blur-sm rounded-full border border-white/30"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Place Name Overlay */}
          <View className="p-6 flex-1 justify-end">
            <Text className="text-white text-3xl font-black">{isMongolian ? place.name : (place.nameEn || place.name)}</Text>
            <View className="flex-row items-center mt-2">
              <Ionicons name="location" size={16} color="#38bdf8" />
              <Text className="text-blue-300 text-sm font-semibold ml-1">
                {isMongolian ? place.attributes.location : (place.attributes.locationEn || place.attributes.location)}
              </Text>
            </View>
          </View>
        </ImageBackground>

        {/* Content Section */}
        <View className="p-6 -mt-6 bg-white rounded-t-3xl shadow-xl">
          {/* About Section */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-slate-900 mb-3">{copy.about}</Text>
            <Text className="text-slate-600 leading-6 text-base italic">
              "{isMongolian ? place.description : (place.descriptionEn || place.description)}"
            </Text>
          </View>

          {/* Quick Info Grid */}
          <View className="flex-row flex-wrap justify-between mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <View className="w-[48%] mb-4">
              <View className="flex-row items-center mb-1">
                <Ionicons name="map" size={18} color="#0ea5e9" />
                <Text className="text-slate-400 text-xs font-bold ml-2 uppercase">{copy.type}</Text>
              </View>
              <Text className="text-slate-800 font-semibold ml-7">
                {isMongolian ? place.attributes.type : (place.attributes.typeEn || place.attributes.type)}
              </Text>
            </View>

            <View className="w-[48%] mb-4">
              <View className="flex-row items-center mb-1">
                <Ionicons name="calendar" size={18} color="#f59e0b" />
                <Text className="text-slate-400 text-xs font-bold ml-2 uppercase">{copy.bestTime}</Text>
              </View>
              <Text className="text-slate-800 font-semibold ml-7">
                {isMongolian ? place.attributes.bestTime : (place.attributes.bestTimeEn || place.attributes.bestTime)}
              </Text>
            </View>

            <View className="w-full">
              <View className="flex-row items-center mb-1">
                <Ionicons name="sparkles" size={18} color="#8b5cf6" />
                <Text className="text-slate-400 text-xs font-bold ml-2 uppercase">{copy.keySpots}</Text>
              </View>
              <Text className="text-slate-800 font-semibold ml-7">
                {isMongolian
                  ? place.attributes.attractions.join(', ')
                  : (place.attributes.attractionsEn || place.attributes.attractions).join(', ')
                }
              </Text>
            </View>
          </View>

          {/* Add Review Section */}
          <View className="mb-8 bg-sky-50/50 p-6 rounded-3xl border border-sky-100">
            <Text className="text-xl font-bold text-slate-900 mb-1">{copy.writeReview}</Text>
            <Text className="text-slate-500 text-sm mb-4">{copy.experiencePrompt}</Text>

            <View className="items-center mb-6">
              {renderStars(newRating, true)}
            </View>

            <TextInput
              className="bg-white border border-slate-200 rounded-2xl p-4 min-h-[100] text-slate-800 text-base"
              placeholder={copy.reviewPlaceholder}
              multiline
              value={newComment}
              onChangeText={setNewComment}
              textAlignVertical="top"
            />


            {/* Image Selection */}
            <View className="mt-4">
              {selectedImage ? (
                <View className="relative w-full h-48 rounded-2xl overflow-hidden mb-2">
                  <Image source={{ uri: selectedImage }} className="w-full h-48" resizeMode="cover" />
                  <TouchableOpacity 
                    onPress={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 bg-black/60 p-2 rounded-full"
                  >
                    <Ionicons name="close" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  onPress={pickImage}
                  className="flex-row items-center justify-center border-2 border-dashed border-sky-200 bg-white p-6 rounded-2xl"
                >
                  <Ionicons name="camera" size={24} color="#0ea5e9" />
                  <Text className="ml-2 text-sky-600 font-bold">{copy.addPhoto}</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              className={`mt-4 rounded-2xl overflow-hidden ${submitting ? 'bg-slate-400' : ''}`}
              onPress={submitReview}
              disabled={submitting}
            >
              <LinearGradient
                colors={['#0ea5e9', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 items-center"
              >
                <Text className="text-white font-bold text-lg">
                  {submitting ? copy.submitting : copy.postReview}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Reviews List Section */}
          <View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-slate-900">{copy.visitorReviews}</Text>
              <Text className="text-sky-600 font-bold">{reviews.length} {copy.reviewCount}</Text>
            </View>

            {loadingReviews ? (
              <ActivityIndicator size="small" color="#0ea5e9" className="my-4" />
            ) : reviews.length > 0 ? (
              reviews.map((rev, idx) => (
                <View key={idx} className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-bold text-slate-800">{rev.userName}</Text>
                    {renderStars(rev.rating)}
                  </View>
                  <Text className="text-slate-600 leading-5 mb-3">{rev.comment}</Text>
                  
                  {rev.photos && rev.photos.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                      {rev.photos.map((photo: string, pIdx: number) => (
                        <Image 
                          key={pIdx} 
                          source={{ uri: photo }} 
                          className="w-24 h-24 rounded-xl mr-2" 
                        />
                      ))}
                    </ScrollView>
                  )}
                  <Text className="text-slate-400 text-[10px] mt-2 italic">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            ) : (
              <View className="items-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Ionicons name="chatbubbles-outline" size={40} color="#cbd5e1" />
                <Text className="text-slate-400 mt-2">{copy.noReviews}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GuideDetailScreen;
