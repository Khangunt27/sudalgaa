import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { HomeStackParamList } from "../navigation/HomeStack";
import { useUser } from "@clerk/clerk-expo";
import axios from "axios";
import { API_URL, getErrorMessage, isNetworkError } from "../constants/api";
import { useLanguage } from "../contexts/LanguageContext";
import { curatedPlans } from "../constants/ubPlan";
import { createPlaceholderImage } from "../constants/imageFallback";
import { useIsFocused } from "@react-navigation/native";

const AIChatScreen = () => {
  const { t, language } = useLanguage();
  const route = useRoute<RouteProp<HomeStackParamList, "AIChat">>();
  const { location, initialPrompt } = route.params;
  const navigation = useNavigation();
  const { user } = useUser();

  const suggestions = [
    t('best_places_to_eat'),
    t('day_itinerary'),
    t('top_attractions'),
  ];
  const copy = useMemo(() => ({
    greeting:
      language === "mn"
        ? `Сайн байна уу! Би ${location}-д зориулсан аяллын туслах. Та юу мэдэхийг хүсэж байна?`
        : language === "ja"
          ? `こんにちは。${location}の旅行アシスタントです。何を知りたいですか？`
          : `Hello! I'm your travel assistant for ${location}. What would you like to know?`,
    conversation:
      language === "mn"
        ? ["Сайн байна уу?", "Юу үзэх вэ?", "Хаана явах вэ?", "Хоол хаана идэх вэ?", "Цаг агаар ямар вэ?", "Хэрхэн очих вэ?"]
        : language === "ja"
          ? ["こんにちは", "何を見るべき？", "どこへ行くべき？", "どこで食べる？", "天気はどう？", "どうやって行く？"]
          : ["Hello!", "What to see?", "Where to go?", "Where to eat?", "How is the weather?", "How to get there?"],
    networkError:
      language === "mn"
        ? "Сервертэй холбогдож чадсангүй. Backend сервер ажиллаж байгаа эсэхийг шалгана уу."
        : language === "ja"
          ? "サーバーに接続できませんでした。バックエンドが起動しているか確認してください。"
          : "Couldn't connect to the server. Please check that the backend is running.",
    genericError:
      language === "mn"
        ? "Уучлаарай, яг одоо хариу авч чадсангүй. Дахин оролдоно уу."
        : language === "ja"
          ? "申し訳ありません。今は応答を取得できません。もう一度お試しください。"
          : "Sorry, I couldn't get a response right now. Please try again.",
    errorTitle: language === "mn" ? "Алдаа" : language === "ja" ? "エラー" : "Error",
    successTitle: language === "mn" ? "Амжилттай" : language === "ja" ? "成功" : "Success",
    emailMissing:
      language === "mn"
        ? "Хэрэглэгчийн имэйл олдсонгүй. Нэвтэрсэн эсэхээ шалгана уу."
        : language === "ja"
          ? "ユーザーのメールアドレスが見つかりません。ログイン状態を確認してください。"
          : "User email not found. Please make sure you're signed in.",
    sendEmailTitle: language === "mn" ? "Имэйл рүү илгээх" : language === "ja" ? "メール送信" : "Send to Email",
    cancel: language === "mn" ? "Цуцлах" : language === "ja" ? "キャンセル" : "Cancel",
    send: language === "mn" ? "Илгээх" : language === "ja" ? "送信" : "Send",
    emailLabel: language === "mn" ? "Имэйл" : language === "ja" ? "メール" : "Email",
    travelAssistant: language === "mn" ? "Аяллын туслах" : language === "ja" ? "旅行アシスタント" : "Travel Assistant",
    generateItineraryTitle: language === "mn" ? "Төлөвлөгөө үүсгэх" : language === "ja" ? "旅程を作成" : "Generate Itinerary",
    generateItineraryPrompt:
      language === "mn"
        ? "Төлөвлөгөө үүсгэхийн тулд PlanTrip дэлгэц рүү очих уу?"
        : language === "ja"
          ? "旅程を作成するために PlanTrip 画面へ移動しますか？"
          : "Go to the PlanTrip screen to generate an itinerary?",
    go: language === "mn" ? "Очих" : language === "ja" ? "移動" : "Go",
    planLabel: language === "mn" ? "Төлөвлөгөө" : language === "ja" ? "プラン" : "Plan",
    aiTyping: language === "mn" ? "AI бичиж байна..." : language === "ja" ? "AIが入力中..." : "AI is typing...",
  }), [language, location]);

  // More conversational suggestions
  const conversationalSuggestions = copy.conversation;

  const [messages, setMessages] = useState<
    { from: "user" | "ai"; text: string }[]
  >([
    {
      from: "ai",
      text: copy.greeting
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [highlightImages, setHighlightImages] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState(false);

  const activePlan = useMemo(() => {
    if (!location) return null;
    const lowercaseLocation = location.toLowerCase();
    return (
      curatedPlans.find((plan) =>
        plan.destinationKeywords.some((keyword) =>
          lowercaseLocation.includes(keyword)
        )
      ) || null
    );
  }, [location]);

  const askAI = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }
    setMessages((prev) => [...prev, { from: "user", text: trimmedQuery }]);
    setInput("");
    setLoading(true);

    try {
      const languageInstruction = language === 'mn'
        ? 'Please respond in Mongolian (Монгол хэлээр хариулна уу).'
        : language === 'en'
          ? 'Please respond in English.'
          : 'Please respond in Japanese.';

      const res = await axios.post(
        `${API_URL}/api/ai/chat`,
        {
          messages: [
            { role: "system", content: `You are a travel assistant for ${location}. ${languageInstruction}` },
            { role: "user", content: trimmedQuery },
          ],
          language: language, // Send language preference
          location, // Send explicit location to avoid parsing issues on server
        },
        {
          timeout: 15000, // 15 second timeout
        }
      );

      const reply = res.data.reply || "No response";
      setMessages((prev) => [...prev, { from: "ai", text: reply }]);
    } catch (error: any) {
      console.error("AI chat error:", error);
      const errorMessage = isNetworkError(error)
        ? copy.networkError
        : copy.genericError;
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: errorMessage },
      ]);
    } finally {
      setLoading(false);
    }
  }, [copy.genericError, copy.networkError, language, location]);

  const sendEmail = async (message: string) => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) {
      Alert.alert(copy.errorTitle, copy.emailMissing);
      return;
    }

    Alert.alert(
      copy.sendEmailTitle,
      language === "mn"
        ? `Энэ хариуг ${email} руу илгээх үү?`
        : language === "ja"
          ? `この回答を ${email} に送信しますか？`
          : `Send this reply to ${email}?`,
      [
        { text: copy.cancel, style: "cancel" },
        {
          text: copy.send,
          onPress: async () => {
            try {
              const response = await axios.post(
                `${API_URL}/api/send-email`,
                {
                  email,
                  subject: `${location} - ${t("ai_assistant")}`,
                  message,
                },
                {
                  timeout: 10000, // 10 second timeout
                }
              );
              Alert.alert(copy.successTitle, response.data.message);
            } catch (error: any) {
              console.error("Error sending email:", error);
              const errorMessage = getErrorMessage(error);
              Alert.alert(copy.errorTitle, errorMessage);
            }
          },
        },
      ]
    );
  };

  const lastInitialPrompt = useRef<string | null>(null);

  // Fetch relevant images from Unsplash for the curated plan
  useEffect(() => {
    if (!activePlan) return;

    let isMounted = true;
    const fetchImages = async () => {
      try {
        setLoadingImages(true);

        // Fetch hero image
        try {
          const heroRes = await axios.get(`${API_URL}/api/media/place-images`, {
            params: { name: location, contextName: "Mongolia travel landscape", count: 1 },
            timeout: 8000,
          });
          if (isMounted) {
            setHeroImage(heroRes.data?.images?.[0] || createPlaceholderImage(location, 1200, 700));
          }
        } catch (err) {
          console.warn('Failed to fetch hero image:', err);
          if (isMounted) {
            setHeroImage(createPlaceholderImage(location, 1200, 700));
          }
        }

        // Fetch images for each highlight with contextually appropriate English queries
        const allHighlights = activePlan.days.flatMap(day => day.highlights);
        const imagePromises = allHighlights.map(async (highlight) => {
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
              // Fallback: use location with generic travel terms
              query = `${location} Mongolia travel`;
            }

            const response = await axios.get(`${API_URL}/api/media/place-images`, {
              params: { name: query, contextName: location, count: 1 },
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
          return {
            id: highlight.id,
            image: highlight.image || createPlaceholderImage(highlight.title, 1200, 700),
          };
        });

        const results = await Promise.all(imagePromises);
        if (!isMounted) return;

        const imagesMap: Record<string, string> = {};
        results.forEach((result) => {
          if (result) {
            imagesMap[result.id] = result.image;
          }
        });
        setHighlightImages(imagesMap);
      } catch (error) {
        console.error('Error fetching AI chat images:', error);
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
  }, [activePlan, location]);

  useEffect(() => {
    if (initialPrompt && lastInitialPrompt.current !== initialPrompt) {
      lastInitialPrompt.current = initialPrompt;
      askAI(initialPrompt);
    }
  }, [askAI, initialPrompt]);

  const scrollViewRef = useRef<ScrollView>(null);

  // Hide tab bar when focused on this screen
  useEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: 'none' }
      });
    }
    return () => {
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            backgroundColor: '#fffbeb',
            borderTopWidth: 0,
            height: 72,
            paddingTop: 8,
            paddingBottom: 10,
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 16,
            borderRadius: 24,
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.12,
            shadowRadius: 18,
            elevation: 16,
          }
        });
      }
    };
  }, [navigation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, loading]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      className="flex-1 bg-gradient-to-b from-orange-50 to-white"
    >
      <View className="flex-1">
        {/* Fixed Header with Gradient */}
        <View className="pt-12 px-4 pb-3 bg-gradient-to-r from-orange-500 via-pink-500 to-orange-500">
          <View className="flex-row items-center mb-3">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-full bg-white/30 items-center justify-center mr-2">
                  <Text className="text-white text-xs font-bold">AI</Text>
                </View>
                <Text className="text-white text-lg font-bold">{t('ai_assistant')}</Text>
              </View>
              <Text className="text-white/90 text-xs mt-0.5">
                {location}
              </Text>
            </View>
          </View>

          {/* Info Banner */}
          <View className="bg-white/20 backdrop-blur-sm p-3 rounded-xl mb-2 border border-white/30">
            <View className="flex-row items-center">
              <Ionicons name="sparkles" size={16} color="#fff" />
              <Text className="text-white text-xs font-medium ml-2 flex-1">
                {t('messages_left')}<Text className="underline font-bold">{t('get_more')}</Text>
              </Text>
            </View>
          </View>

          <View className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={16} color="#fff" style={{ marginTop: 2 }} />
              <View className="ml-2 flex-1">
                <Text className="text-white text-xs leading-4">
                  {t('ai_info_1')}
                </Text>
                <Text className="text-white/90 text-xs mt-1 leading-4">
                  {t('ai_info_2')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {activePlan && (
            <View className="mb-4">
              <View className="rounded-3xl overflow-hidden border border-orange-200 bg-white">
                {heroImage || activePlan.heroImage ? (
                  <Image
                    source={{ uri: heroImage || activePlan.heroImage }}
                    className="w-full h-44"
                    resizeMode="cover"
                  />
                ) : loadingImages ? (
                  <View className="w-full h-44 bg-gray-100 items-center justify-center">
                    <ActivityIndicator size="large" color="#fb923c" />
                  </View>
                ) : (
                  <View className="w-full h-44 bg-gradient-to-br from-orange-400 to-orange-600 items-center justify-center">
                    <Ionicons name="image-outline" size={48} color="#fff" />
                  </View>
                )}
                <View className="p-4 bg-orange-50">
                  <Text className="text-xs font-semibold uppercase text-orange-500">
                    {t('curated_plan_title')}
                  </Text>
                  <Text className="text-base font-semibold text-gray-800 mt-1">
                    {location}
                  </Text>
                  <Text className="text-sm text-gray-600 mt-2">
                    {activePlan.intro}
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-3"
              >
                {activePlan.days.map((day) => {
                  const firstHighlight = day.highlights[0];
                  const highlightImage = firstHighlight
                    ? (highlightImages[firstHighlight.id] || firstHighlight.image)
                    : null;

                  return (
                    <View
                      key={day.id}
                      className="mr-3 w-64 rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm"
                    >
                      {highlightImage ? (
                        <Image
                          source={{ uri: highlightImage }}
                          className="w-full h-32"
                          resizeMode="cover"
                        />
                      ) : loadingImages ? (
                        <View className="w-full h-32 bg-gray-100 items-center justify-center">
                          <ActivityIndicator size="small" color="#fb923c" />
                        </View>
                      ) : (
                        <View className="w-full h-32 bg-gradient-to-br from-orange-200 to-orange-300" />
                      )}
                      <View className="p-3">
                        <Text className="text-xs font-semibold text-orange-500 uppercase">
                          {t('curated_plan_day_label')}
                        </Text>
                        <Text className="text-base font-semibold text-gray-800 mt-1">
                          {day.title}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <View className="mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <Text className="text-sm font-semibold text-gray-700 uppercase">
                  {activePlan.practicalTips.title}
                </Text>
                {activePlan.practicalTips.tips.map((tip, index) => (
                  <View key={index} className="flex-row items-start mt-2">
                    <Text className="text-orange-500 font-semibold mr-2">•</Text>
                    <Text className="flex-1 text-sm text-gray-600">{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Suggestions */}
          {messages.length <= 1 && (
            <View className="mb-4">
              <View className="flex-row items-center mb-3">
                <View className="w-1 h-4 bg-orange-500 rounded-full mr-2" />
                <Text className="font-bold text-gray-800 text-base">
                  {t('dont_know_what_to_ask')}
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {conversationalSuggestions.map((q, index) => {
                  const icons = ['chatbubble', 'eye', 'location', 'restaurant', 'cloud', 'car'];
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => askAI(q)}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2.5 rounded-full mb-2 shadow-sm active:opacity-80"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name={icons[index] as any} size={14} color="#fff" />
                        <Text className="text-sm text-white font-semibold ml-2">
                          {q}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Quick Actions */}
          {messages.length > 1 && (
            <View className="mb-3">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                {suggestions.slice(0, 3).map((q, index) => {
                  const icons = ['restaurant', 'calendar', 'star'];
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => askAI(`${q} ${location}`)}
                      className="bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm active:opacity-80"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name={icons[index] as any} size={14} color="#fb923c" />
                        <Text className="text-xs text-gray-700 font-medium ml-1.5">
                          {q}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Chat messages */}
          <View className="mb-3">
            {messages.map((msg, idx) => (
              <View key={idx} className={`mb-4 ${msg.from === "user" ? "items-end" : "items-start"}`}>
                {msg.from === "ai" && (
                  <View className="flex-row items-center mb-2">
                    <View className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 items-center justify-center mr-2 shadow-sm">
                      <Text className="text-white text-xs font-bold">AI</Text>
                    </View>
                    <Text className="text-xs text-gray-500 font-medium">
                      {copy.travelAssistant}
                    </Text>
                  </View>
                )}
                <View
                  className={`p-4 rounded-[24px] max-w-[85%] shadow-sm ${msg.from === "user"
                      ? "bg-[#007AFF] rounded-tr-sm shadow-blue-200"
                      : "bg-white rounded-tl-sm border border-gray-100 shadow-gray-100"
                    }`}
                >
                  <Text className={`text-[15px] leading-[22px] ${msg.from === "user" ? "text-white font-medium" : "text-gray-800"}`}>
                    {msg.text}
                  </Text>
                </View>
                {msg.from === "ai" && (
                  <View className="flex-row items-center gap-2 mt-2 flex-wrap">
                    <TouchableOpacity
                      onPress={() => sendEmail(msg.text)}
                      className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 active:opacity-80"
                    >
                      <Ionicons name="mail-outline" size={14} color="#007AFF" />
                      <Text className="text-xs text-blue-600 ml-1 font-semibold">
                        {copy.emailLabel}
                      </Text>
                    </TouchableOpacity>
                    {msg.text.toLowerCase().includes('төлөвлөгөө') ||
                      msg.text.toLowerCase().includes('itinerary') ||
                      msg.text.toLowerCase().includes('plan') ||
                      msg.text.toLowerCase().includes('旅程') ? (
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            copy.generateItineraryTitle,
                            copy.generateItineraryPrompt,
                            [
                              { text: copy.cancel, style: 'cancel' },
                              {
                                text: copy.go,
                                onPress: () => {
                                  navigation.navigate('Home' as any);
                                }
                              }
                            ]
                          );
                        }}
                        className="flex-row items-center bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-1.5 rounded-full shadow-sm active:opacity-80"
                      >
                        <Ionicons name="sparkles" size={14} color="#fff" />
                        <Text className="text-xs text-white ml-1 font-bold">
                          {copy.planLabel}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}
              </View>
            ))}
            {loading && (
              <View className="bg-white self-start p-4 rounded-3xl mb-3 border-2 border-orange-100 shadow-sm">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-orange-400 mr-1.5" style={{ opacity: 0.4 }} />
                  <View className="w-2 h-2 rounded-full bg-orange-400 mr-1.5" style={{ opacity: 0.6 }} />
                  <View className="w-2 h-2 rounded-full bg-orange-400" style={{ opacity: 1 }} />
                  <Text className="text-xs text-gray-500 ml-3">
                    {copy.aiTyping}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Fixed Input Box */}
        <View className="px-4 pb-4 bg-white border-t border-gray-200 shadow-lg">
          <View className="flex-row items-center bg-white border-2 border-gray-200 rounded-full px-4 py-3 shadow-sm">
            <Ionicons name="chatbubble-outline" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput
              className="flex-1 text-sm text-gray-800"
              placeholder={t('ask_travel_questions')}
              placeholderTextColor="#9ca3af"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={() => askAI(input)}
              disabled={!input.trim() || loading}
              className={`w-10 h-10 rounded-full items-center justify-center ${input.trim() && !loading
                  ? "bg-gradient-to-r from-orange-500 to-pink-500"
                  : "bg-gray-200"
                }`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={input.trim() ? "#fff" : "#9ca3af"}
                />
              )}
            </TouchableOpacity>
          </View>
          {input.length > 0 && (
            <Text className="text-xs text-gray-400 text-right mt-1 px-2">
              {input.length}/500
            </Text>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AIChatScreen;
