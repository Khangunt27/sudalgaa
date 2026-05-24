import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ProfileScreen from '../screens/ProfileScreen';
import HomeStack from './HomeStack';
import GuideStack from './GuideStack';
import { useLanguage } from '../contexts/LanguageContext';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { language } = useLanguage();
  const labels = {
    home: language === 'mn' ? 'Нүүр' : language === 'ja' ? 'ホーム' : 'Home',
    guides: language === 'mn' ? 'Гайд' : language === 'ja' ? 'ガイド' : 'Guides',
    profile: language === 'mn' ? 'Профайл' : language === 'ja' ? 'プロフィール' : 'Profile',
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#0f172a',
        tabBarInactiveTintColor: '#64748b',
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
        },
        tabBarIconStyle: { marginBottom: -2 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '800' },
        headerShown:false
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: labels.home,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Guides"
        component={GuideStack}
        options={{
          tabBarLabel: labels.guides,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: labels.profile,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
