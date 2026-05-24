# 🗺️ Travel Planning Application

A comprehensive travel planning application built with React Native, Expo, Node.js, Express, and MongoDB.

## ✨ Features

### ✅ AI Chat Assistant
- **Location-based AI assistant** to help users plan trips
- Real-time chat interface with travel recommendations
- Curated travel plans for popular destinations (e.g., Ulaanbaatar)
- Context-aware image fetching from Unsplash
- Multi-language support (Mongolian, English, Japanese)
- Email integration to send AI responses

**Implementation:**
- `mongo/screens/AIChatScreen.tsx` - Main AI chat interface
- `mongo/api/server.js` - `/api/ai/chat` endpoint
- OpenAI integration for intelligent responses

### ✅ AI-Generated Itineraries
- **Personalized travel planning** with AI-generated itineraries
- Automatic itinerary generation based on destination, dates, and preferences
- Integration with curated travel plans
- Dynamic activity suggestions

**Implementation:**
- `mongo/screens/PlanTripScreen.tsx` - Itinerary planning interface
- `mongo/api/server.js` - `/api/ai/itinerary` endpoint
- OpenTripMap integration for place suggestions

### ✅ Dedicated Map Screen
- **Interactive map** to explore destinations
- Native maps for iOS/Android (react-native-maps)
- Web maps with Google Maps integration
- Place markers with images
- Aimag (province) exploration for Mongolia
- Location-based place discovery

**Implementation:**
- `mongo/screens/MapScreen.native.tsx` - Native map implementation
- `mongo/screens/MapScreen.web.tsx` - Web map implementation
- OpenTripMap API for place data

### ✅ Trip Management
- **Create, manage & store trips** with full CRUD operations
- Trip creation with date selection and location search
- Add places to visit
- Manage expenses and budget
- Itinerary management with daily activities
- Trip sharing capabilities

**Implementation:**
- `mongo/screens/NewTripScreen.tsx` - Create new trips
- `mongo/screens/PlanTripScreen.tsx` - Manage trip details
- `mongo/api/models/trip.js` - Trip data model
- `mongo/api/server.js` - Trip API endpoints

### ✅ Backend with MongoDB + Node.js + Express
- **Seamless data management** with robust backend
- RESTful API architecture
- MongoDB for persistent storage
- Mongoose for data modeling
- Image enrichment with Unsplash
- Place discovery with OpenTripMap
- Translation support with Google Translate API

**Implementation:**
- `mongo/api/server.js` - Express server
- `mongo/api/models/` - Mongoose models (Trip, User, Aimag)
- `mongo/api/services/external.js` - External API integrations

### ✅ Secure User Authentication & Login System
- **Clerk authentication** for secure user management
- Sign in/Sign up screens
- Session management with SecureStore
- User profile management
- Protected routes and API endpoints

**Implementation:**
- `mongo/screens/SignInScreen.tsx` - Sign in interface
- `mongo/screens/SignUpScreen.tsx` - Sign up interface
- `mongo/App.tsx` - ClerkProvider setup
- `mongo/navigation/RootNavigator.tsx` - Auth-based navigation

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or cloud instance)
- Expo CLI
- npm or yarn

### Installation

1. **Install frontend dependencies:**
   ```bash
   cd mongo
   npm install
   ```

2. **Install backend dependencies:**
   ```bash
   cd mongo/api
   npm install
   ```

3. **Set up environment variables:**
   
   Create `mongo/api/.env`:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/tripPlanner
   OPENAI_API_KEY=your_openai_key_here
   GOOGLE_API_KEY=your_google_api_key_here
   UNSPLASH_ACCESS_KEY=your_unsplash_key_here
   OPENTRIPMAP_API_KEY=your_opentripmap_key_here
   SMTP_USER=your_smtp_user
   SMTP_PASS=your_smtp_password
   ```

4. **Start MongoDB:**
   ```bash
   # Make sure MongoDB is running
   mongod
   ```

5. **Start the backend server:**
   ```bash
   cd mongo/api
   npm start
   ```

6. **Start the frontend:**
   ```bash
   cd mongo
   npm start
   ```

## 📁 Project Structure

```
mongo/
├── api/                    # Backend server
│   ├── models/             # Mongoose models
│   ├── services/           # External API services
│   └── server.js           # Express server
├── screens/                # React Native screens
│   ├── AIChatScreen.tsx    # AI assistant
│   ├── PlanTripScreen.tsx  # Trip planning
│   ├── MapScreen.*.tsx     # Map views
│   └── ...
├── components/            # Reusable components
├── navigation/            # Navigation setup
├── contexts/              # React contexts
└── constants/             # Constants and configs
```

## 🔑 API Endpoints

### Trips
- `POST /api/trips` - Create a new trip
- `GET /api/trips` - Get all trips for a user
- `GET /api/trips/:tripId` - Get a specific trip
- `POST /api/trips/:tripId/places` - Add a place to a trip
- `POST /api/trips/:tripId/itinerary` - Add activity to itinerary
- `DELETE /api/trips/:tripId/itinerary` - Remove activity

### AI Services
- `POST /api/ai/chat` - AI chat assistant
- `POST /api/ai/itinerary` - Generate AI itinerary

### Places & Media
- `GET /api/places/aimags` - Get Mongolian aimags
- `GET /api/media/unsplash` - Fetch images from Unsplash
- `GET /api/opentripmap/places` - Get nearby places
- `GET /api/opentripmap/place/:xid` - Get place details

### Utilities
- `POST /api/send-email` - Send email

## 🌍 Multi-Language Support

The application supports:
- **Mongolian (mn)** - Default
- **English (en)**
- **Japanese (ja)**

Language context: `mongo/contexts/LanguageContext.tsx`

## 🎨 Key Technologies

- **Frontend:**
  - React Native with Expo
  - TypeScript
  - NativeWind (Tailwind CSS)
  - React Navigation
  - Clerk Authentication

- **Backend:**
  - Node.js
  - Express.js
  - MongoDB with Mongoose
  - External APIs (OpenAI, Unsplash, OpenTripMap, Google Translate)

## 📱 Screens

1. **HomeScreen** - Main dashboard with trips and guides
2. **NewTripScreen** - Create new trips
3. **PlanTripScreen** - Manage trip details, itinerary, expenses
4. **AIChatScreen** - AI assistant for travel planning
5. **MapScreen** - Interactive map for exploring destinations
6. **GuideScreen** - Explore Mongolia destinations
7. **ProfileScreen** - User profile and settings

## 🔐 Security

- Clerk authentication with secure token storage
- API endpoints protected with Bearer tokens
- Secure user data handling
- Environment variables for sensitive keys

## 📝 Notes

- All images are dynamically fetched from Unsplash based on context
- OpenTripMap provides place discovery and suggestions
- AI responses are translated based on user language preference
- Curated travel plans available for popular destinations

## 🐛 Troubleshooting

See `README_API.md` for detailed troubleshooting guide.

## 📄 License

This project is part of a travel planning application.

