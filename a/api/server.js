import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import axios from 'axios';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import {
  fetchUnsplashImages,
  fetchOpenTripMapRadius,
  fetchOpenTripMapPlace,
  fetchOpenTripMapGeo,
  fetchWikimediaGeoImages,
  resolvePlaceImages,
  translateIfNeeded,
} from './services/external.js';
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

import Trip from './models/trip.js';
import User from './models/user.js';
import Aimag from './models/aimag.js';
import TransportOption from './models/transport.js';
import ExperienceReview from './models/review.js';
import CommunityContribution from './models/contribution.js';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection with Mongoose
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/tripPlanner";
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });






// Nodemailer configuration
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const transporter = nodemailer.createTransport(
  smtpUser && smtpPass
    ? {
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass },
    }
    : {}
);

const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

const requireAdmin = (req, res, next) => {
  if (!ADMIN_SECRET) {
    console.warn("ADMIN_SECRET not configured. Skipping admin check.");
    return next();
  }
  const headerSecret = req.headers["x-admin-secret"];
  if (headerSecret !== ADMIN_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
};

const DEFAULT_TRANSPORT_OPTIONS = [
  {
    mode: "taxi",
    provider: "Ulaanbaatar Taxi 1998",
    routeName: "Airport → Sukhbaatar Square",
    origin: "Chinggis Khaan International Airport",
    destination: "Sukhbaatar Square",
    durationMinutes: 45,
    price: 45000,
    currency: "MNT",
    schedule: {
      frequency: "On-demand 24/7",
      firstDeparture: "00:00",
      lastDeparture: "23:59",
    },
    amenities: ["English-speaking drivers", "Card payment"],
    rating: 4.7,
    ratingCount: 128,
    reviews: [
      {
        authorName: "Enkhbayar",
        rating: 5,
        comment: "Reliable pickup even after midnight flight.",
        source: "seed",
      },
    ],
    source: "seed",
  },
  {
    mode: "bus",
    provider: "City Bus #7",
    routeName: "Zaisan ↔️ State Department Store",
    origin: "Zaisan",
    destination: "State Department Store",
    durationMinutes: 35,
    price: 1200,
    currency: "MNT",
    schedule: {
      frequency: "Every 8 minutes",
      firstDeparture: "06:30",
      lastDeparture: "22:30",
    },
    amenities: ["Real-time GPS", "Wheelchair access"],
    rating: 4.3,
    ratingCount: 212,
    source: "seed",
  },
  {
    mode: "shuttle",
    provider: "Terelj Express Shuttle",
    routeName: "Downtown → Terelj National Park",
    origin: "Peace Avenue, UB",
    destination: "Terelj National Park",
    durationMinutes: 70,
    price: 28000,
    currency: "MNT",
    schedule: {
      frequency: "Every 2 hours",
      firstDeparture: "07:00",
      lastDeparture: "19:00",
    },
    amenities: ["Wi-Fi", "Luggage space"],
    rating: 4.6,
    ratingCount: 64,
    source: "seed",
  },
];

let transportSeedPromise = null;

async function ensureTransportSeeded() {
  if (transportSeedPromise) return transportSeedPromise;
  transportSeedPromise = (async () => {
    const count = await TransportOption.countDocuments();
    if (count === 0) {
      await TransportOption.insertMany(
        DEFAULT_TRANSPORT_OPTIONS.map((item) => ({
          ...item,
          isCrowdsourced: false,
        }))
      );
      console.log("Seeded default transport options");
    }
  })().catch((err) => {
    console.error("Failed to seed transport options", err);
    transportSeedPromise = null;
  });
  return transportSeedPromise;
}

const CURATED_RECOMMENDATIONS = [
  {
    name: "Sukhbaatar Square",
    city: "Ulaanbaatar",
    category: "landmark",
    description: "Central square surrounded by museums and government palace.",
    avgSpend: "Free",
    tags: ["history", "city"],
    coordinates: { lat: 47.9203, lng: 106.9170 },
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/0/0b/Sukhbaatar_Square_2015.jpg",
    ],
  },
  {
    name: "Gandan Monastery",
    city: "Ulaanbaatar",
    category: "culture",
    description: "Largest Buddhist monastery in Mongolia, morning chanting ritual.",
    avgSpend: "₮5,000 entry",
    tags: ["culture", "religion"],
    coordinates: { lat: 47.9221, lng: 106.8945 },
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/6/6b/Gandantegchinlen_Monastery%2C_Ulaanbaatar.jpg",
    ],
  },
  {
    name: "Terelj National Park",
    city: "Ulaanbaatar",
    category: "nature",
    description: "Granite formations, Turtle Rock, and Aryabal Meditation Temple.",
    avgSpend: "₮25,000 day trip",
    tags: ["nature", "hiking"],
    coordinates: { lat: 47.9101, lng: 107.5290 },
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/7/7d/Turtle_Rock_Terelj.jpg",
    ],
  },
  {
    name: "Bogd Khan Palace Museum",
    city: "Ulaanbaatar",
    category: "museum",
    description: "Winter palace of the last Mongolian king.",
    avgSpend: "₮15,000 entry",
    tags: ["history", "museum"],
    coordinates: { lat: 47.9023, lng: 106.9183 },
    photos: [
      "https://upload.wikimedia.org/wikipedia/commons/0/0e/Bogd_Khaan_Palace_Museum.jpg",
    ],
  },
];

async function buildReviewStats(filter = {}) {
  const pipeline = [];
  if (filter.placeId) {
    pipeline.push({ $match: { placeId: filter.placeId } });
  }
  if (filter.placeName) {
    pipeline.push({
      $match: { placeName: { $regex: filter.placeName, $options: "i" } },
    });
  }
  if (filter.category) {
    pipeline.push({ $match: { category: filter.category } });
  }
  pipeline.push({
    $group: {
      _id: { placeId: "$placeId", placeName: "$placeName" },
      avgRating: { $avg: "$rating" },
      reviewCount: { $sum: 1 },
      lastReview: { $max: "$createdAt" },
    },
  });
  return ExperienceReview.aggregate(pipeline);
}

async function buildPlaceRecommendations({ city, category, limit = 10 }) {
  const normalizedCity = city?.toLowerCase();
  const curated = CURATED_RECOMMENDATIONS.filter((item) => {
    const matchesCity = normalizedCity
      ? item.city?.toLowerCase().includes(normalizedCity)
      : true;
    const matchesCat = category ? item.category === category : true;
    return matchesCity && matchesCat;
  });

  const reviewStats = await buildReviewStats({ category });
  const reviewBased = reviewStats.map((stat) => ({
    name: stat._id.placeName,
    placeId: stat._id.placeId,
    avgRating: Number(stat.avgRating?.toFixed(2) || 0),
    reviewCount: stat.reviewCount,
    source: "community",
  }));

  const tripPlaces = await Trip.find({}, "placesToVisit")
    .limit(50)
    .lean()
    .catch(() => []);

  const tripBasedMap = new Map();
  tripPlaces.forEach((trip) => {
    (trip.placesToVisit || []).forEach((place) => {
      if (!place?.name) return;
      const key = place.name.toLowerCase();
      if (!tripBasedMap.has(key)) {
        tripBasedMap.set(key, {
          name: place.name,
          location: place.formatted_address,
          photos: place.photos,
          description: place.briefDescription,
          source: "trip",
        });
      }
    });
  });

  const combined = [
    ...curated.map((item) => ({ ...item, source: "curated" })),
    ...reviewBased,
    ...Array.from(tripBasedMap.values()),
  ];

  const uniqueMap = new Map();
  for (const place of combined) {
    const key = (place.placeId || place.name || "").toLowerCase();
    if (!key) continue;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, place);
    }
  }

  return Array.from(uniqueMap.values()).slice(0, Number(limit) || 10);
}
async function enrichPlacesWithImages(places = [], contextName = '') {
  const enriched = [];
  for (const place of places) {
    const placeObj = place?.toObject ? place.toObject() : { ...place };
    if (!Array.isArray(placeObj.photos) || placeObj.photos.length === 0) {
      try {
        placeObj.photos = await resolvePlaceImages({
          name: placeObj.name,
          contextName,
          count: 3,
        });
      } catch (error) {
        console.warn('Failed to fetch Unsplash images for place', placeObj.name, error.message);
        placeObj.photos = [];
      }
    }
    enriched.push(placeObj);
  }
  return enriched;
}

async function enrichTripMedia(tripDoc) {
  if (!tripDoc) return tripDoc;
  const tripObj = tripDoc.toObject ? tripDoc.toObject() : { ...tripDoc };
  const tripName = tripObj.tripName || 'Mongolia trip';

  // Ensure hero background
  if (!tripObj.background) {
    try {
      const hero = await resolvePlaceImages({
        name: tripName,
        contextName: 'landscape',
        count: 1,
      });
      if (hero.length > 0) {
        tripObj.background = hero[0];
      }
    } catch (error) {
      console.warn('Failed to fetch hero image for trip', tripName, error.message);
    }
  }

  tripObj.placesToVisit = await enrichPlacesWithImages(
    tripObj.placesToVisit || [],
    tripName
  );

  if (Array.isArray(tripObj.itinerary)) {
    tripObj.itinerary = await Promise.all(
      tripObj.itinerary.map(async (day) => {
        const dayObj = day?.toObject ? day.toObject() : { ...day };
        dayObj.activities = await enrichPlacesWithImages(
          dayObj.activities || [],
          `${tripName} itinerary`
        );
        return dayObj;
      })
    );
  }

  return tripObj;
}

// Root Route
app.get('/', (req, res) => {
  res.send('Trip Planner API');
});

// AI Status Endpoint - Check if AI is configured correctly
app.get('/api/ai/status', (req, res) => {
  const hasOpenAIKey = !!OPENAI_API_KEY;
  const hasGroqKey = !!GROQ_API_KEY;

  res.json({
    status: 'ok',
    ai: {
      openai: {
        configured: hasOpenAIKey,
      },
      groq: {
        configured: hasGroqKey,
      },
      mode: hasOpenAIKey ? 'openai' : (hasGroqKey ? 'groq' : 'mock'),
      message: hasOpenAIKey
        ? 'OpenAI API бэлэн байна'
        : hasGroqKey
          ? 'Groq API (Llama-3) бэлэн байна'
          : 'API key олдсонгүй - Mock хариу ашиглана',
    }
  });
});

app.get('/api/media/unsplash', async (req, res) => {
  try {
    const { query, count = '6' } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const images = await fetchUnsplashImages(query.toString(), Number(count));
    res.json({ images });
  } catch (error) {
    console.error('Unsplash fetch error:', error.message);
    res.json({ images: [], error: 'Failed to fetch Unsplash images', details: error.message });
  }
});

app.get('/api/media/place-images', async (req, res) => {
  try {
    const { name, contextName = '', count = '3', lat, lon } = req.query;
    if (!name && (!lat || !lon)) {
      return res.status(400).json({ error: 'name or lat/lon query parameters are required' });
    }

    let images = [];
    if (lat && lon) {
      images = await fetchWikimediaGeoImages(Number(lat), Number(lon), Number(count));
    }

    if (images.length === 0 && name) {
      images = await resolvePlaceImages({
        name: name.toString(),
        contextName: contextName.toString(),
        count: Number(count),
      });
    }

    res.json({ images });
  } catch (error) {
    console.error('Place image fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch place images', details: error.message });
  }
});

app.get('/api/opentripmap/geoname', async (req, res) => {
  try {
    const { name, country = 'MN' } = req.query;
    if (!name) {
      return res.status(400).json({ error: 'name query parameter is required' });
    }
    const data = await fetchOpenTripMapGeo(name.toString(), country.toString());
    res.json(data);
  } catch (error) {
    console.error('OpenTripMap geoname error:', error.message);
    res.status(500).json({ error: 'Failed to fetch geoname data', details: error.message });
  }
});

app.get('/api/opentripmap/places', async (req, res) => {
  try {
    const {
      lat,
      lon,
      radius = '5000',
      limit = '8',
      lang = 'mn',
      includeImages = 'true',
    } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon query parameters are required' });
    }

    const numericLimit = Math.min(Number(limit) || 8, 15);

    const basePlaces = await fetchOpenTripMapRadius({
      lat,
      lon,
      radius: Number(radius) || 5000,
      limit: numericLimit,
      lang: 'en', // fetch base data in English for consistency
    });

    const detailedPlaces = (
      await Promise.all(
        basePlaces.map(async (place) => {
          try {
            // Check if XID exists
            if (!place.xid) return null;

            const detail = await fetchOpenTripMapPlace(place.xid, 'en');
            if (!detail) return null;

            const nameEn = detail.name || place.name || '';
            const descEn =
              detail.wikipedia_extracts?.text ||
              detail.info?.descr ||
              detail.otm?.descr ||
              '';
            const addressEn = detail.address?.freeform || detail.address?.road || '';

            // Robust translation with individual try-catches
            let translatedName = nameEn;
            let translatedDesc = descEn;
            let translatedAddress = addressEn;

            if (lang !== 'en') {
              try {
                translatedName = await translateIfNeeded(nameEn, lang.toString());
              } catch (e) { console.warn('Name translation failed'); }

              try {
                translatedDesc = await translateIfNeeded(descEn, lang.toString());
              } catch (e) { console.warn('Desc translation failed'); }

              try {
                translatedAddress = await translateIfNeeded(addressEn, lang.toString());
              } catch (e) { console.warn('Address translation failed'); }
            }

            let image = null;
            if (includeImages !== 'false') {
              try {
                const images = await resolvePlaceImages({
                  name: nameEn || 'Mongolia attraction',
                  contextName: 'landscape',
                  count: 1,
                });
                if (images && images.length > 0) {
                  image = { urls: { regular: images[0] } };
                }
              } catch (photoError) {
                console.warn('Unsplash lookup failed for', nameEn, photoError.message);
              }
            }

            return {
              xid: place.xid,
              kinds: place.kinds,
              name: translatedName || nameEn,
              name_en: nameEn,
              description: translatedDesc || descEn,
              description_en: descEn,
              address: translatedAddress || addressEn,
              address_en: addressEn,
              point: detail.point || place.point,
              rating: detail.rate || place.rate || 0,
              image,
              wiki: detail.wikipedia,
              url: detail.url,
              preview: detail.preview,
              sources: detail.sources,
            };
          } catch (err) {
            console.warn(`OpenTripMap detail failed for ${place.xid}:`, err.message);
            return null;
          }
        })
      )
    ).filter(Boolean);

    res.json({ places: detailedPlaces });
  } catch (error) {
    console.error('OpenTripMap radius error:', error.message);
    res.json({ places: [], error: 'Failed to search places', details: error.message });
  }
});

app.get('/api/opentripmap/place/:xid', async (req, res) => {
  try {
    const { xid } = req.params;
    const { lang = 'mn', includeImages = 'true' } = req.query;
    if (!xid) {
      return res.status(400).json({ error: 'xid parameter is required' });
    }

    const detail = await fetchOpenTripMapPlace(xid, 'en');
    const nameEn = detail.name || '';
    const descEn =
      detail.wikipedia_extracts?.text || detail.info?.descr || detail.otm?.descr || '';
    const addressEn = detail.address?.freeform || detail.address?.road || '';

    const translatedName = lang !== 'en' ? await translateIfNeeded(nameEn, lang.toString()) : nameEn;
    const translatedDesc =
      lang !== 'en' ? await translateIfNeeded(descEn, lang.toString()) : descEn;
    const translatedAddress =
      lang !== 'en' ? await translateIfNeeded(addressEn, lang.toString()) : addressEn;

    let image = null;
    if (includeImages !== 'false') {
      try {
        const images = await resolvePlaceImages({
          name: nameEn,
          count: 1,
        });
        if (images.length > 0) {
          image = { urls: { regular: images[0] } };
        }
      } catch (photoError) {
        console.warn('Unsplash lookup failed for', nameEn, photoError.message);
      }
    }

    res.json({
      xid,
      kinds: detail.kinds,
      name: translatedName,
      name_en: nameEn,
      description: translatedDesc,
      description_en: descEn,
      address: translatedAddress,
      address_en: addressEn,
      point: detail.point,
      rating: detail.rate,
      image,
      wiki: detail.wikipedia,
      url: detail.url,
      sources: detail.sources,
      preview: detail.preview,
    });
  } catch (error) {
    console.error('OpenTripMap xid error:', error.message);
    res.status(500).json({ error: 'Failed to fetch OpenTripMap place', details: error.message });
  }
});

// Transport endpoints
app.get('/api/transport', async (req, res) => {
  try {
    await ensureTransportSeeded();
    const {
      mode,
      origin,
      destination,
      minRating,
      sortBy = "price",
      limit = "20",
    } = req.query;
    const filter = {};
    if (mode) filter.mode = mode;
    if (origin) filter.origin = { $regex: origin, $options: "i" };
    if (destination) filter.destination = { $regex: destination, $options: "i" };
    if (minRating) filter.rating = { $gte: Number(minRating) };

    const transports = await TransportOption.find(filter)
      .limit(Math.min(Number(limit) || 20, 50))
      .lean();

    const sorted = transports.sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "duration") return (a.durationMinutes || 0) - (b.durationMinutes || 0);
      return (a.price || 0) - (b.price || 0);
    });

    res.json({
      items: sorted,
      meta: { count: sorted.length },
    });
  } catch (error) {
    console.error("Transport fetch error:", error);
    res.status(500).json({ error: "Failed to fetch transport options" });
  }
});

app.post('/api/transport', requireAdmin, async (req, res) => {
  try {
    const option = new TransportOption({
      ...req.body,
      isCrowdsourced: false,
      source: req.body.source || "admin",
    });
    await option.save();
    res.status(201).json({ message: "Transport option added", option });
  } catch (error) {
    console.error("Transport create error:", error);
    res.status(500).json({ error: "Failed to create transport option" });
  }
});

app.patch('/api/transport/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const option = await TransportOption.findByIdAndUpdate(
      id,
      { ...req.body, lastUpdated: new Date() },
      { new: true }
    );
    if (!option) return res.status(404).json({ error: "Transport option not found" });
    res.json({ message: "Transport option updated", option });
  } catch (error) {
    console.error("Transport update error:", error);
    res.status(500).json({ error: "Failed to update transport option" });
  }
});

app.post('/api/transport/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { authorName, rating, comment, source } = req.body;
    if (!rating) return res.status(400).json({ error: "rating is required" });
    const option = await TransportOption.findById(id);
    if (!option) return res.status(404).json({ error: "Transport option not found" });
    option.reviews.push({ authorName, rating, comment, source });
    option.ratingCount = option.reviews.length;
    option.rating =
      option.reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
      option.ratingCount;
    await option.save();
    res.status(201).json({ message: "Review added", option });
  } catch (error) {
    console.error("Transport review error:", error);
    res.status(500).json({ error: "Failed to add review" });
  }
});

// Place recommendations
app.get('/api/recommendations/places', async (req, res) => {
  try {
    const { city, category, limit } = req.query;
    const items = await buildPlaceRecommendations({ city, category, limit });
    res.json({ items });
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ error: "Failed to build recommendations" });
  }
});

// Experience Reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const { placeId, placeName, category, limit = "50" } = req.query;
    const filter = {};
    if (placeId) filter.placeId = placeId;
    if (placeName)
      filter.placeName = { $regex: placeName.toString(), $options: "i" };
    if (category) filter.category = category;

    const reviews = await ExperienceReview.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 100))
      .lean();

    const stats = reviews.reduce(
      (acc, review) => {
        acc.count += 1;
        acc.sum += review.rating || 0;
        const bucket = Math.round(review.rating || 0);
        acc.breakdown[bucket] = (acc.breakdown[bucket] || 0) + 1;
        return acc;
      },
      { count: 0, sum: 0, breakdown: {} }
    );

    res.json({
      reviews,
      stats: {
        total: stats.count,
        average: stats.count ? Number((stats.sum / stats.count).toFixed(2)) : 0,
        breakdown: stats.breakdown,
      },
    });
  } catch (error) {
    console.error("Review fetch error:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const {
      placeId,
      placeName,
      location,
      category,
      rating,
      comment,
      photos = [],
      visitedOn,
      travelerType,
      user = {},
      verifiedTripId,
    } = req.body;

    if (!placeName) return res.status(400).json({ error: "placeName is required" });
    if (!rating) return res.status(400).json({ error: "rating is required" });

    const review = new ExperienceReview({
      placeId,
      placeName,
      location,
      category,
      rating,
      comment,
      photos,
      visitedOn,
      travelerType,
      userName: user.name,
      userAvatar: user.avatar,
      verifiedTripId,
    });
    await review.save();
    res.status(201).json({ message: "Review submitted", review });
  } catch (error) {
    console.error("Review submit error:", error);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// Crowdsourced contributions
app.post('/api/community/contributions', async (req, res) => {
  try {
    const { type, payload, submittedBy } = req.body;
    if (!type || !payload) {
      return res.status(400).json({ error: "type and payload are required" });
    }
    const contribution = new CommunityContribution({
      type,
      payload,
      submittedBy,
    });
    await contribution.save();
    res
      .status(201)
      .json({ message: "Contribution received", contribution });
  } catch (error) {
    console.error("Contribution error:", error);
    res.status(500).json({ error: "Failed to submit contribution" });
  }
});

app.get('/api/community/contributions', requireAdmin, async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    const contributions = await CommunityContribution.find({ status })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items: contributions });
  } catch (error) {
    console.error("Contribution fetch error:", error);
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
});

async function applyContribution(contribution) {
  if (contribution.type === "transport") {
    const option = new TransportOption({
      ...contribution.payload,
      isCrowdsourced: true,
      source: "community",
    });
    await option.save();
    return option;
  }
  return null;
}

app.patch('/api/community/contributions/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, moderatorNotes } = req.body;
    const contribution = await CommunityContribution.findById(id);
    if (!contribution)
      return res.status(404).json({ error: "Contribution not found" });

    contribution.status = status || contribution.status;
    contribution.moderatorNotes = moderatorNotes;
    await contribution.save();

    let applied = null;
    if (status === "approved") {
      applied = await applyContribution(contribution);
    }

    res.json({
      message: "Contribution updated",
      contribution,
      applied,
    });
  } catch (error) {
    console.error("Contribution update error:", error);
    res.status(500).json({ error: "Failed to update contribution" });
  }
});
// Create Trip Endpoint
app.post('/api/trips', async (req, res) => {
  try {
    const {
      tripName,
      startDate,
      endDate,
      startDay,
      endDay,
      background,
      budget = 0,
      expenses = [],
      placesToVisit = [],
      itinerary = [],
      travelers = [],
      clerkUserId,
      userData = {},
    } = req.body;

    if (!clerkUserId) {
      return res.status(401).json({ error: 'User ID is required' });
    }
    if (!tripName || !startDate || !endDate || !startDay || !endDay || !background) {
      return res.status(400).json({ error: 'Missing required trip fields' });
    }

    let user = await User.findOne({ clerkUserId });
    if (!user) {
      const { email, name } = userData;
      if (!email) {
        return res.status(400).json({ error: 'User email is required' });
      }
      user = new User({ clerkUserId, email, name });
      await user.save();
    }

    const trip = new Trip({
      tripName,
      startDate,
      endDate,
      startDay,
      endDay,
      background,
      host: user._id,
      travelers: [user._id, ...travelers],
      budget,
      expenses,
      placesToVisit,
      itinerary,
    });

    await trip.save();
    res.status(201).json({ message: 'Trip created successfully', trip });
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// Get Trips for Current User Endpoint
app.get('/api/trips', async (req, res) => {
  try {
    const { clerkUserId, email } = req.query;
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    let user = await User.findOne({ clerkUserId });
    if (!user) {
      if (!email) {
        return res.status(400).json({ error: 'User email is required' });
      }
      user = new User({ clerkUserId, email: email.toString(), name: '' });
      await user.save();
    }

    const trips = await Trip.find({
      $or: [{ host: user._id }, { travelers: user._id }],
    }).populate('host travelers');
    res.status(200).json({ trips });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Get Single Trip Endpoint
app.get('/api/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { clerkUserId } = req.query;

    if (!clerkUserId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const user = await User.findOne({ clerkUserId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const trip = await Trip.findById(tripId).populate('host travelers');
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const enrichedTrip = await enrichTripMedia(trip);

    res.status(200).json({ trip: enrichedTrip });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// Update Trip Endpoint
app.put('/api/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { clerkUserId, ...updateData } = req.body || {};

    if (!clerkUserId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const user = await User.findOne({ clerkUserId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Ensure user has permission to update this trip
    if (trip.host.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to update this trip' });
    }

    // Ensure all places have viewport
    if (updateData.places && Array.isArray(updateData.places)) {
      updateData.places.forEach((place) => {
        if (place.geometry) {
          place.geometry = ensureViewport(place.geometry);
        }
      });
    }

    // Ensure all itinerary activities have viewport
    if (updateData.itinerary && Array.isArray(updateData.itinerary)) {
      updateData.itinerary.forEach((itineraryDay) => {
        if (itineraryDay.activities && Array.isArray(itineraryDay.activities)) {
          itineraryDay.activities.forEach((activity) => {
            if (activity.geometry) {
              activity.geometry = ensureViewport(activity.geometry);
            }
          });
        }
      });
    }

    // Ensure placesToVisit have viewport
    if (updateData.placesToVisit && Array.isArray(updateData.placesToVisit)) {
      updateData.placesToVisit.forEach((place) => {
        if (place.geometry) {
          place.geometry = ensureViewport(place.geometry);
        }
      });
    }

    // Update trip fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        trip[key] = updateData[key];
      }
    });

    await trip.save();

    res.status(200).json({ message: 'Trip updated successfully', trip });
  } catch (error) {
    console.error('Error updating trip:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update trip', details: error.message });
  }
});

// Add Place to Trip Endpoint
app.post('/api/trips/:tripId/places', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { placeId, placeData } = req.body;
    const API_KEY = GOOGLE_MAPS_API_KEY || '';

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    let finalPlaceData;

    if (placeData) {
      finalPlaceData = {
        name: placeData.name || 'Unknown Place',
        phoneNumber: placeData.phoneNumber || '',
        website: placeData.website || '',
        openingHours: placeData.openingHours || [],
        photos: placeData.photos || [],
        reviews: placeData.reviews || [],
        types: placeData.types || [],
        formatted_address: placeData.formatted_address || 'No address available',
        briefDescription: placeData.briefDescription || 'No description available',
        geometry: ensureViewport(placeData.geometry),
      };
    } else if (placeId) {
      let details = null;
      let status = 'ZERO_RESULTS';

      // Try Google Places API if key is available
      if (API_KEY && API_KEY !== 'abc') {
        try {
          const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_KEY}`;
          const response = await axios.get(url);
          status = response.data.status;
          details = response.data.result;
        } catch (error) {
          console.warn('Google Places API error, using fallback:', error.message);
        }
      }

      // Try OpenTripMap if Google fails or no key
      if (status !== 'OK' || !details) {
        try {
          const otmDetail = await fetchOpenTripMapPlace(placeId, 'en');
          if (otmDetail && otmDetail.xid) {
            const lat = otmDetail.point?.lat || 0;
            const lon = otmDetail.point?.lon || 0;
            details = {
              name: otmDetail.name || 'Unknown Place',
              formatted_address: otmDetail.address?.freeform || otmDetail.address?.road || 'No address available',
              photos: otmDetail.preview?.source ? [{ photo_reference: otmDetail.preview.source }] : [],
              opening_hours: { weekday_text: [] },
              formatted_phone_number: '',
              website: otmDetail.url || '',
              geometry: {
                location: { lat, lng: lon },
                viewport: {
                  northeast: { lat: lat + 0.005, lng: lon + 0.005 },
                  southwest: { lat: lat - 0.005, lng: lon - 0.005 },
                },
              },
              types: otmDetail.kinds ? otmDetail.kinds.split(',') : ['point_of_interest'],
              reviews: [],
              editorial_summary: { overview: otmDetail.wikipedia_extracts?.text || '' },
            };
            status = 'OK';
          }
        } catch (otmError) {
          console.warn('OpenTripMap lookup failed for', placeId, otmError.message);
        }
      }

      // Fallback to Nominatim if others fail
      if (status !== 'OK' || !details) {
        try {
          const types = ['N', 'W', 'R'];
          let found = null;
          for (const t of types) {
            const cleanId = placeId.replace(/^[NWR]/, '');
            const lu = `https://nominatim.openstreetmap.org/lookup?osm_ids=${t}${cleanId}&format=json&addressdetails=1`;
            const lr = await axios.get(lu, { headers: { 'User-Agent': 'trip-planner' } });
            if (Array.isArray(lr.data) && lr.data.length) { found = lr.data[0]; break; }
          }

          if (found) {
            details = {
              name: found.display_name?.split(',')[0] || 'Unknown Place',
              formatted_address: found.display_name,
              photos: [],
              opening_hours: { weekday_text: [] },
              formatted_phone_number: '',
              website: '',
              geometry: {
                location: { lat: Number(found.lat) || 0, lng: Number(found.lon) || 0 },
                viewport: {
                  northeast: { lat: Number(found.lat) + 0.005, lng: Number(found.lon) + 0.005 },
                  southwest: { lat: Number(found.lat) - 0.005, lng: Number(found.lon) - 0.005 },
                },
              },
              types: ['point_of_interest'],
              reviews: [],
              editorial_summary: { overview: '' },
            };
            status = 'OK';
          }
        } catch (error) {
          console.error('Fallback lookup error:', error);
        }
      }

      if (status !== 'OK' || !details) {
        return res.status(400).json({ error: `Unable to fetch place details for ID ${placeId}.` });
      }

      finalPlaceData = {
        name: details.name || 'Unknown Place',
        phoneNumber: details.formatted_phone_number || '',
        website: details.website || '',
        openingHours: details.opening_hours?.weekday_text || [],
        photos: details.photos?.map((photo) => {
          if (typeof photo.photo_reference === 'string' && photo.photo_reference.startsWith('http')) {
            return photo.photo_reference;
          }
          if (API_KEY && API_KEY !== 'abc') {
            return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${API_KEY}`;
          }
          return null;
        }).filter(Boolean) || [],
        reviews: details.reviews?.map(review => ({
          authorName: review.author_name || 'Unknown',
          rating: review.rating || 0,
          text: review.text || '',
        })) || [],
        types: details.types || [],
        formatted_address: details.formatted_address || 'No address available',
        briefDescription:
          details?.editorial_summary?.overview?.slice(0, 200) ||
          details?.reviews?.[0]?.text?.slice(0, 200) ||
          `Located in ${details.formatted_address || "this area"}.`,
        geometry: ensureViewport(details.geometry),
      };
    } else {
      return res.status(400).json({ error: 'Place ID or placeData is required' });
    }

    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      { $push: { placesToVisit: finalPlaceData } },
      { new: true }
    );

    res.status(200).json({ message: 'Place added successfully', trip: updatedTrip });
  } catch (error) {
    console.error('Error adding place to trip:', error);
    res.status(500).json({ error: 'Failed to add place to trip' });
  }
});

// Add Place to Itinerary Endpoint
app.post('/api/trips/:tripId/itinerary', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { placeId, date, placeData } = req.body;
    const API_KEY = GOOGLE_MAPS_API_KEY || '';

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    if (!placeId && !placeData) {
      return res.status(400).json({ error: 'Either placeId or placeData is required' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    let activityData;

    if (placeData) {
      // Ensure geometry has viewport
      const geometry = ensureViewport(placeData.geometry || {
        location: { lat: 0, lng: 0 },
        viewport: {
          northeast: { lat: 0, lng: 0 },
          southwest: { lat: 0, lng: 0 },
        },
      });

      activityData = {
        date,
        name: placeData.name || 'Unknown Place',
        phoneNumber: placeData.phoneNumber || '',
        website: placeData.website || '',
        openingHours: placeData.openingHours || [],
        photos: Array.isArray(placeData.photos) ? placeData.photos : [],
        reviews: Array.isArray(placeData.reviews) ? placeData.reviews : [],
        types: Array.isArray(placeData.types) ? placeData.types : [],
        formatted_address: placeData.formatted_address || 'No address available',
        briefDescription: placeData.briefDescription || 'No description available',
        geometry: geometry,
      };
    } else {
      let details = null;
      let status = 'ZERO_RESULTS';

      // Try Google Places API if key is available
      if (API_KEY && API_KEY !== 'abc') {
        try {
          const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_KEY}`;
          const response = await axios.get(url);
          status = response.data.status;
          details = response.data.result;
        } catch (error) {
          console.warn('Google Places API error, using fallback:', error.message);
        }
      }

      // Try OpenTripMap if Google fails or no key
      if (status !== 'OK' || !details) {
        try {
          const otmDetail = await fetchOpenTripMapPlace(placeId, 'en');
          if (otmDetail && otmDetail.xid) {
            const lat = otmDetail.point?.lat || 0;
            const lon = otmDetail.point?.lon || 0;
            details = {
              name: otmDetail.name || 'Unknown Place',
              formatted_address: otmDetail.address?.freeform || otmDetail.address?.road || 'No address available',
              photos: otmDetail.preview?.source ? [{ photo_reference: otmDetail.preview.source }] : [],
              opening_hours: { weekday_text: [] },
              formatted_phone_number: '',
              website: otmDetail.url || '',
              geometry: {
                location: { lat, lng: lon },
                viewport: {
                  northeast: { lat: lat + 0.005, lng: lon + 0.005 },
                  southwest: { lat: lat - 0.005, lng: lon - 0.005 },
                },
              },
              types: otmDetail.kinds ? otmDetail.kinds.split(',') : ['point_of_interest'],
              reviews: [],
              editorial_summary: { overview: otmDetail.wikipedia_extracts?.text || '' },
            };
            status = 'OK';
          }
        } catch (otmError) {
          console.warn('OpenTripMap lookup failed for', placeId, otmError.message);
        }
      }

      // Fallback to Nominatim if others fail
      if (status !== 'OK' || !details) {
        try {
          const types = ['N', 'W', 'R'];
          let found = null;
          for (const t of types) {
            const cleanId = placeId.replace(/^[NWR]/, '');
            const lu = `https://nominatim.openstreetmap.org/lookup?osm_ids=${t}${cleanId}&format=json&addressdetails=1`;
            const lr = await axios.get(lu, { headers: { 'User-Agent': 'trip-planner' } });
            if (Array.isArray(lr.data) && lr.data.length) { found = lr.data[0]; break; }
          }

          if (found) {
            details = {
              name: found.display_name?.split(',')[0] || 'Unknown Place',
              formatted_address: found.display_name,
              photos: [],
              opening_hours: { weekday_text: [] },
              formatted_phone_number: '',
              website: '',
              geometry: {
                location: { lat: Number(found.lat) || 0, lng: Number(found.lon) || 0 },
                viewport: {
                  northeast: { lat: Number(found.lat) + 0.005, lng: Number(found.lon) + 0.005 },
                  southwest: { lat: Number(found.lat) - 0.005, lng: Number(found.lon) - 0.005 },
                },
              },
              types: ['point_of_interest'],
              reviews: [],
              editorial_summary: { overview: '' },
            };
            status = 'OK';
          }
        } catch (error) {
          console.error('Fallback lookup error:', error);
        }
      }

      if (status !== 'OK' || !details) {
        return res.status(400).json({ error: `Unable to fetch place details for ID ${placeId}.` });
      }

      activityData = {
        date,
        name: details.name || 'Unknown Place',
        phoneNumber: details.formatted_phone_number || '',
        website: details.website || '',
        openingHours: details.opening_hours?.weekday_text || [],
        photos: details.photos?.map((photo) => {
          if (typeof photo.photo_reference === 'string' && photo.photo_reference.startsWith('http')) {
            return photo.photo_reference;
          }
          if (API_KEY && API_KEY !== 'abc') {
            return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${API_KEY}`;
          }
          return null;
        }).filter(Boolean) || [],
        reviews: details.reviews?.map(review => ({
          authorName: review.author_name || 'Unknown',
          rating: review.rating || 0,
          text: review.text || '',
        })) || [],
        types: details.types || [],
        formatted_address: details.formatted_address || 'No address available',
        briefDescription:
          details?.editorial_summary?.overview?.slice(0, 200) ||
          details?.reviews?.[0]?.text?.slice(0, 200) ||
          `Located in ${details.formatted_address || "this area"}.`,
        geometry: ensureViewport(details.geometry),
      };
    }

    const existingItinerary = trip.itinerary.find(item => item.date === date);
    let updatedTrip;
    if (existingItinerary) {
      updatedTrip = await Trip.findByIdAndUpdate(
        tripId,
        { $push: { 'itinerary.$[elem].activities': activityData } },
        { arrayFilters: [{ 'elem.date': date }], new: true }
      );
    } else {
      updatedTrip = await Trip.findByIdAndUpdate(
        tripId,
        { $push: { itinerary: { date, activities: [activityData] } } },
        { new: true }
      );
    }

    // Ensure all activities have viewport after saving
    if (updatedTrip) {
      let needsSave = false;
      updatedTrip.itinerary.forEach((itineraryDay) => {
        if (itineraryDay.activities && Array.isArray(itineraryDay.activities)) {
          itineraryDay.activities.forEach((activity) => {
            // Convert subdocument to plain object if needed
            const activityObj = activity.toObject ? activity.toObject() : (activity._doc || activity);
            if (activityObj.geometry) {
              const fixedGeometry = ensureViewport(activityObj.geometry);
              if (JSON.stringify(fixedGeometry) !== JSON.stringify(activityObj.geometry)) {
                activityObj.geometry = fixedGeometry;
                Object.assign(activity, activityObj);
                needsSave = true;
              }
            }
          });
        }
      });
      if (needsSave) {
        await updatedTrip.save();
      }
    }

    res.status(200).json({ message: 'Activity added to itinerary successfully', trip: updatedTrip });
  } catch (error) {
    console.error('Error adding activity to itinerary:', error);
    res.status(500).json({ error: 'Failed to add activity to itinerary' });
  }
});

// Helper function to ensure viewport exists in geometry
function ensureViewport(geometry, defaultLat = 47.9203, defaultLng = 106.9170) {
  if (!geometry) {
    return {
      location: { lat: defaultLat, lng: defaultLng },
      viewport: {
        northeast: { lat: defaultLat + 0.005, lng: defaultLng + 0.005 },
        southwest: { lat: defaultLat - 0.005, lng: defaultLng - 0.005 },
      }
    };
  }

  const lat = geometry?.location?.lat || defaultLat;
  const lng = geometry?.location?.lng || defaultLng;

  if (!geometry.viewport || !geometry.viewport.northeast || !geometry.viewport.southwest) {
    // Create a default viewport (about 500m radius)
    const offset = 0.005; // ~500 meters
    geometry.viewport = {
      northeast: {
        lat: lat + offset,
        lng: lng + offset,
      },
      southwest: {
        lat: lat - offset,
        lng: lng - offset,
      },
    };
  }

  return geometry;
}

// Update an activity in itinerary
app.patch('/api/trips/:tripId/itinerary', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { date, index, updates = {} } = req.body || {};
    if (!date || typeof index !== 'number') {
      return res.status(400).json({ error: 'date and index are required' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const day = trip.itinerary.find((d) => d.date === date);
    if (!day) return res.status(404).json({ error: 'Itinerary day not found' });
    if (!day.activities?.[index]) return res.status(404).json({ error: 'Activity not found' });

    const activityDoc = day.activities[index];
    const activityData = activityDoc.toObject ? activityDoc.toObject() : (activityDoc._doc || activityDoc);
    day.activities[index] = { ...activityData, ...updates };

    // Ensure geometry has viewport before saving
    if (day.activities[index].geometry) {
      day.activities[index].geometry = ensureViewport(day.activities[index].geometry);
    }

    // Ensure all activities have viewport before saving
    trip.itinerary.forEach((itineraryDay) => {
      if (itineraryDay.activities && Array.isArray(itineraryDay.activities)) {
        itineraryDay.activities.forEach((activity) => {
          // Convert subdocument to plain object if needed
          const activityObj = activity.toObject ? activity.toObject() : (activity._doc || activity);
          if (activityObj.geometry) {
            activityObj.geometry = ensureViewport(activityObj.geometry);
            // Update the activity with fixed geometry
            Object.assign(activity, activityObj);
          }
        });
      }
    });

    await trip.save();
    return res.json({ message: 'Activity updated', trip });
  } catch (e) {
    console.error('Update itinerary error:', e);
    console.error('Error details:', e.message, e.stack);
    return res.status(500).json({ error: 'Failed to update itinerary', details: e.message });
  }
});

// --- Review Endpoints ---

/**
 * Get all reviews for a specific place
 */
app.get('/api/reviews/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const reviews = await ExperienceReview.find({ placeId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * Post a new review for a place
 */
app.post('/api/reviews', async (req, res) => {
  try {
    const {
      placeId,
      placeName,
      rating,
      comment,
      userName,
      userAvatar,
      location,
      category,
      travelerType,
      visitedOn
    } = req.body;

    if (!placeId || !rating) {
      return res.status(400).json({ error: 'placeId and rating are required' });
    }

    const newReview = new ExperienceReview({
      placeId,
      placeName: placeName || 'Unknown Place',
      rating,
      comment,
      userName: userName || 'Anonymous',
      userAvatar,
      location,
      category,
      travelerType,
      visitedOn: visitedOn || new Date()
    });

    await newReview.save();
    res.status(201).json({ message: 'Review submitted successfully', review: newReview });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Delete an activity from itinerary
app.delete('/api/trips/:tripId/itinerary', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { date, index } = req.body || {};
    if (!date || typeof index !== 'number') {
      return res.status(400).json({ error: 'date and index are required' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const day = trip.itinerary.find((d) => d.date === date);
    if (!day) return res.status(404).json({ error: 'Itinerary day not found' });
    if (index < 0 || index >= day.activities.length) return res.status(400).json({ error: 'Invalid index' });

    day.activities.splice(index, 1);
    if (day.activities.length === 0) {
      trip.itinerary = trip.itinerary.filter((d) => d.date !== date);
    }

    // Ensure all remaining activities have viewport before saving
    trip.itinerary.forEach((itineraryDay) => {
      if (itineraryDay.activities && Array.isArray(itineraryDay.activities)) {
        itineraryDay.activities.forEach((activity) => {
          // Convert subdocument to plain object if needed
          const activityObj = activity.toObject ? activity.toObject() : (activity._doc || activity);
          if (activityObj.geometry) {
            activityObj.geometry = ensureViewport(activityObj.geometry);
            // Update the activity with fixed geometry
            Object.assign(activity, activityObj);
          }
        });
      }
    });

    // Also ensure placesToVisit have viewport
    if (trip.placesToVisit && trip.placesToVisit.length > 0) {
      trip.placesToVisit.forEach((place) => {
        if (place.geometry) {
          place.geometry = ensureViewport(place.geometry);
        }
      });
    }

    await trip.save();
    return res.json({ message: 'Activity deleted', trip });
  } catch (e) {
    console.error('Delete itinerary error:', e);
    console.error('Error details:', e.message, e.stack);
    return res.status(500).json({ error: 'Failed to delete itinerary activity', details: e.message });
  }
});

// Send Email Endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ error: 'Email, subject, and message are required' });
    }

    const mailOptions = {
      from: 'sujananand0@gmail.com',
      to: email,
      subject: subject,
      text: message,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// AI: simple provider wrapper using global keys
const OPENTRIPMAP_API_KEY = process.env.OPENTRIPMAP_API_KEY || '';

// Log AI configuration status on startup
console.log('🤖 AI Configuration:');
console.log(`   OpenAI API Key: ${OPENAI_API_KEY ? '✅ Найдсан (' + OPENAI_API_KEY.substring(0, 10) + '...)' : '❌ Олдсонгүй'}`);
console.log(`   Groq API Key: ${GROQ_API_KEY ? '✅ Найдсан (' + GROQ_API_KEY.substring(0, 10) + '...)' : '❌ Олдсонгүй (Үнэгүй: https://console.groq.com)'}`);
console.log(`   AI Mode: ${OPENAI_API_KEY ? 'OpenAI API (Бодит AI)' : (GROQ_API_KEY ? 'Groq API (Үнэгүй AI)' : 'Mock Responses (Тестлэх систем)')}`);

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages = [], language = 'mn', location: explicitLocation = '' } = req.body || {};
    const isMongolian = language === 'mn';
    const lastMessage = messages[messages.length - 1]?.content || '';
    const loc = explicitLocation || 'Mongolia';

    // Professional system prompt
    const systemPrompt = `You are a premium AI Travel Assistant for Mongolia. 
    Respond in ${isMongolian ? 'polite, professional Mongolian' : 'Professional English'}. 
    Provide specific costs in MNT/USD, durations, and less-known local gems. 
    Context: ${loc}.`;

    const enrichedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.filter(m => m.role !== 'system')
    ];

    // 1. Try OpenAI
    if (OPENAI_API_KEY) {
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4o-mini', messages: enrichedMessages, temperature: 0.7, max_tokens: 800
        }, { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }, timeout: 15000 });
        const reply = response.data?.choices?.[0]?.message?.content;
        if (reply) return res.json({ reply });
      } catch (err) { console.error('OpenAI failed:', err.message); }
    }

    // 2. Try Gemini (Free Tier)
    if (GEMINI_API_KEY) {
      try {
        const contents = messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.role === 'user' && m === messages[0] ? `${systemPrompt}\n\n${m.content}` : m.content }]
        }));
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          { contents, generationConfig: { temperature: 0.7, maxOutputTokens: 1000 } }, { timeout: 15000 });
        const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return res.json({ reply });
      } catch (err) { console.error('Gemini failed:', err.message); }
    }

    // 3. Try Groq (Llama 3 Free)
    if (GROQ_API_KEY) {
      try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.1-70b-versatile', messages: enrichedMessages, temperature: 0.7, max_tokens: 800
        }, { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }, timeout: 15000 });
        const reply = response.data?.choices?.[0]?.message?.content;
        if (reply) return res.json({ reply });
      } catch (err) { console.error('Groq failed:', err.message); }
    }
    // 4. Premium Local Knowledge Base (Guaranteed Fallback)
    const query = lastMessage.toLowerCase();
    let reply = isMongolian
      ? `Уучлаарай, AI систем ачаалалтай байна. Гэхдээ би ${loc}-ын талаар тусалж чадна. \n\n📍 Очих газрууд: Сүхбаатарын талбай, Тэрэлж, Гандан хийд.\n💰 Төсөв: Өдөрт 50,000₮ - 150,000₮.\n🚕 Тээвэр: UB Taxi (1998), Автобус (500₮).`
      : `The AI is currently busy, but I can still help with ${loc}. \n\n📍 Must See: Sukhbaatar Square, Terelj, Gandan Monastery.\n💰 Budget: $20 - $60 per day.\n🚕 Transport: UB Taxi, Local Bus.`;

    if (query.match(/plan|төлөвлөгөө|өдөр/)) {
      reply = isMongolian
        ? "3 өдрийн төлөвлөгөө:\nӨдөр 1: Хотын төв\nӨдөр 2: Тэрэлж байгалийн цогцолборт газар\nӨдөр 3: Гандан хийд болон Дэлгүүр."
        : "3-Day Plan:\nDay 1: City Center\nDay 2: Terelj National Park\nDay 3: Monastery & Shopping.";
    } else if (query.match(/food|хоол|идэх/)) {
      reply = isMongolian
        ? "Туршиж үзэх хоол: Хуушуур, Бууз, Цуйван. Сайн ресторан: Modern Nomads, The Bull."
        : "Food to try: Khuushuur, Buuz, Tsuivan. Recommended: Modern Nomads, The Bull.";
    }

    return res.json({ reply });
  } catch (err) {
    console.error('AI chat routing error:', err);
    res.status(500).json({ error: 'System error' });
  }
});

app.post('/api/ai/itinerary', async (req, res) => {
  try {
    const { destination = 'Mongolia', startDate, endDate, budget = 'medium', interests = [], language = 'mn' } = req.body || {};
    const isMongolian = language === 'mn';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
    const days = diffDays || 1;

    const itPrompt = `Create a ${days}-day itinerary for ${destination}. 
    Budget: ${budget}. Interests: ${interests.join(', ')}. 
    Return JSON only: {"plan": [{"date": "YYYY-MM-DD", "activities": [{"name": "Place", "formatted_address": "Address", "briefDescription": "Desc", "geometry": {"location": {"lat": 47.9, "lng": 106.9}}}]}]}`;

    // 1. Try OpenAI
    if (OPENAI_API_KEY) {
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are a JSON travel planner.' }, { role: 'user', content: itPrompt }],
          response_format: { type: "json_object" }
        }, { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }, timeout: 20000 });
        const data = JSON.parse(response.data?.choices?.[0]?.message?.content);
        if (data.plan) return res.json({ destination, plan: data.plan });
      } catch (e) { console.error('Itinerary OpenAI failed'); }
    }

    // 2. Try Gemini
    if (GEMINI_API_KEY) {
      try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          contents: [{ parts: [{ text: itPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }, { timeout: 20000 });
        const data = JSON.parse(response.data?.candidates?.[0]?.content?.parts?.[0]?.text);
        if (data.plan) return res.json({ destination, plan: data.plan });
      } catch (e) { console.error('Itinerary Gemini failed'); }
    }

    // 3. Try Groq
    if (GROQ_API_KEY) {
      try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.1-70b-versatile', messages: [{ role: 'user', content: itPrompt }],
          response_format: { type: "json_object" }
        }, { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }, timeout: 20000 });
        const data = JSON.parse(response.data?.choices?.[0]?.message?.content);
        if (data.plan) return res.json({ destination, plan: data.plan });
      } catch (e) { console.error('Itinerary Groq failed'); }
    }

    // Final Fallback: Structured Mock Plan
    const mockPlan = Array.from({ length: days }, (_, i) => ({
      date: new Date(start.getTime() + i * 86400000).toISOString().split('T')[0],
      activities: [
        { name: 'Sukhbaatar Square', formatted_address: 'Central UB', briefDescription: isMongolian ? 'Төв талбай үзэх' : 'Visit central square', geometry: { location: { lat: 47.92, lng: 106.91 } } },
        { name: 'Gandan Monastery', formatted_address: 'UB', briefDescription: isMongolian ? 'Гандан хийдээр зочлох' : 'Visit Monastery', geometry: { location: { lat: 47.92, lng: 106.89 } } }
      ]
    }));
    return res.json({ destination, plan: mockPlan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create itinerary' });
  }
});

// AI-powered preference discovery endpoint
app.post('/api/ai/discover-preferences', async (req, res) => {
  try {
    const { destination = 'Ulaanbaatar', language = 'mn', conversation = [] } = req.body || {};
    const isMongolian = language === 'mn';

    if (!GROQ_API_KEY) {
      return res.status(400).json({ error: 'GROQ_API_KEY is required' });
    }

    // Build conversation context
    const systemPrompt = isMongolian
      ? `Та аяллын туслах AI юм. Хэрэглэгчийн сонирхол, дуртай зүйлсийг олохын тулд асуултууд асуу. 
Хэрэглэгчдэд ямар газрууд дуртай, юу идэх дуртай, ямар үйл ажиллагаа сонирхож байгааг асуу.
Богино, товч асуултууд асуу. Зөвхөн асуулт өг, бусад текст битгий бич.`
      : `You are a travel assistant AI. Ask questions to discover user preferences, interests, and favorite things.
Ask about what places they like, what food they prefer, what activities interest them.
Keep questions short and concise. Only provide questions, no other text.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation.map(msg => ({
        role: msg.from === 'user' ? 'user' : 'assistant',
        content: msg.text
      }))
    ];

    // If no conversation yet, start with initial questions
    if (conversation.length === 0) {
      const initialQuestions = isMongolian
        ? [
          'Та ямар төрлийн газрууд сонирхож байна? (Соёл, түүх, байгаль, хоол, худалдаа)',
          'Та ямар хоол дуртай вэ? (Монгол хоол, европ хоол, ази хоол)',
          'Та ямар үйл ажиллагаа сонирхож байна? (Музей, байгаль, хөгжим, спорт)'
        ]
        : [
          'What types of places interest you? (Culture, history, nature, food, shopping)',
          'What food do you like? (Local, European, Asian)',
          'What activities interest you? (Museums, nature, music, sports)'
        ];

      return res.json({
        questions: initialQuestions,
        conversation: conversation
      });
    }

    // Use Groq to generate follow-up questions based on conversation
    try {
      const groqResponse = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: messages,
          temperature: 0.7,
          max_tokens: 200,
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const reply = groqResponse.data?.choices?.[0]?.message?.content || '';
      const questions = reply.split('\n').filter(q => q.trim().length > 0).slice(0, 3);

      return res.json({
        questions: questions.length > 0 ? questions : (isMongolian ? ['Бусад сонирхол байна уу?'] : ['Any other interests?']),
        conversation: conversation
      });
    } catch (groqError) {
      console.error('❌ Groq API алдаа:', groqError.response?.data || groqError.message);
      return res.status(500).json({ error: 'Failed to generate questions' });
    }
  } catch (e) {
    console.error('AI discover preferences error:', e);
    res.status(500).json({ error: 'AI discover preferences failed' });
  }
});

// AI-powered place suggestions based on discovered preferences
app.post('/api/ai/suggest-places', async (req, res) => {
  try {
    const {
      destination = 'Ulaanbaatar',
      preferences = {},
      conversation = [],
      language = 'mn'
    } = req.body || {};
    const isMongolian = language === 'mn';

    if (!GROQ_API_KEY) {
      return res.status(400).json({ error: 'GROQ_API_KEY is required' });
    }

    // Extract preferences from conversation
    const preferencesText = Object.entries(preferences)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n');

    const conversationText = conversation
      .map(msg => `${msg.from === 'user' ? 'Хэрэглэгч' : 'AI'}: ${msg.text}`)
      .join('\n');

    const prompt = isMongolian
      ? `${destination}д зориулсан газрууд санал болго. 
Хэрэглэгчийн сонирхол:
${preferencesText}
${conversationText ? '\nХувилбар:\n' + conversationText : ''}

5-10 газрын жагсаалт өг. Газр бүрт:
- Нэр
- Тайлбар (яагаад санал болгож байгаа)
- Төрөл (музей, соёлын газар, хоолны газар, байгаль, гэх мэт)
- Ойролцоо үнэ (хэрэв байвал)

JSON форматтайгаар буцаа:
{
  "places": [
    {
      "name": "Газрын нэр",
      "description": "Тайлбар",
      "type": "музей",
      "price": "Үнэгүй эсвэл үнэ",
      "whyRecommended": "Яагаад санал болгож байгаа"
    }
  ]
}
Зөвхөн JSON хариу өг.`
      : `Suggest 5-10 places for ${destination} based on user preferences:
${preferencesText}
${conversationText ? '\nConversation:\n' + conversationText : ''}

For each place provide:
- Name
- Description (why recommended)
- Type (museum, cultural site, restaurant, nature, etc.)
- Approximate price (if available)

Return in JSON format:
{
  "places": [
    {
      "name": "Place name",
      "description": "Description",
      "type": "museum",
      "price": "Free or price",
      "whyRecommended": "Why recommended"
    }
  ]
}
Return only JSON.`;

    try {
      const groqResponse = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: isMongolian
                ? 'Та аяллын туслах AI юм. JSON форматтай хариу өг.'
                : 'You are a travel assistant AI. Respond in JSON format only.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        }
      );

      const content = groqResponse.data?.choices?.[0]?.message?.content || '{}';
      let parsedResponse;
      try {
        parsedResponse = typeof content === 'string' ? JSON.parse(content) : content;
      } catch (parseError) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse JSON response');
        }
      }

      if (parsedResponse.places && Array.isArray(parsedResponse.places)) {
        console.log(`✅ Groq API ${parsedResponse.places.length} газрын санал амжилттай үүсгэлээ`);
        return res.json({ places: parsedResponse.places });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (groqError) {
      console.error('❌ Groq API алдаа:', groqError.response?.data || groqError.message);
      return res.status(500).json({ error: 'Failed to generate place suggestions' });
    }
  } catch (e) {
    console.error('AI suggest places error:', e);
    res.status(500).json({ error: 'AI suggest places failed' });
  }
});

// Get detailed place information using APIs from .env
app.post('/api/ai/place-details', async (req, res) => {
  try {
    const { placeName, destination = 'Ulaanbaatar' } = req.body || {};

    if (!placeName) {
      return res.status(400).json({ error: 'placeName is required' });
    }

    const placeDetails = {
      name: placeName,
      formatted_address: destination,
      briefDescription: '',
      geometry: {
        location: { lat: 47.9203, lng: 106.9170 },
        viewport: {
          northeast: { lat: 47.9253, lng: 106.9220 },
          southwest: { lat: 47.9153, lng: 106.9120 },
        }
      },
      types: ['point_of_interest'],
      photos: [],
      reviews: []
    };

    // Try Google Places API first (from GOOGLE_MAPS_API_KEY in .env)
    if (GOOGLE_MAPS_API_KEY) {
      try {
        console.log(`🔍 Google Places API ашиглан "${placeName}" газрын мэдээлэл хайж байна...`);

        // Search for place
        const searchResponse = await axios.get(
          'https://maps.googleapis.com/maps/api/place/textsearch/json',
          {
            params: {
              query: `${placeName} ${destination}`,
              key: GOOGLE_MAPS_API_KEY,
              language: 'mn',
            },
            timeout: 60000, // Increased to 60000ms (60 seconds) for better reliability
          }
        );

        if (searchResponse.data?.results?.length > 0) {
          const place = searchResponse.data.results[0];

          // Get detailed information
          const detailsResponse = await axios.get(
            'https://maps.googleapis.com/maps/api/place/details/json',
            {
              params: {
                place_id: place.place_id,
                key: GOOGLE_MAPS_API_KEY,
                language: 'mn',
                fields: 'name,formatted_address,geometry,types,photos,reviews,rating,opening_hours,price_level',
              },
              timeout: 60000, // Increased to 60000ms (60 seconds) for better reliability
            }
          );

          const details = detailsResponse.data?.result;
          if (details) {
            placeDetails.name = details.name || placeName;
            placeDetails.formatted_address = details.formatted_address || destination;
            // Ensure geometry has viewport
            placeDetails.geometry = ensureViewport(details.geometry || placeDetails.geometry);
            placeDetails.types = details.types || ['point_of_interest'];
            placeDetails.rating = details.rating;
            placeDetails.price_level = details.price_level;
            placeDetails.opening_hours = details.opening_hours;

            // Get photos
            if (details.photos && details.photos.length > 0) {
              placeDetails.photos = details.photos.slice(0, 3).map((photo) => ({
                photo_reference: photo.photo_reference,
                url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
              }));
            }

            // Get reviews
            if (details.reviews && details.reviews.length > 0) {
              placeDetails.reviews = details.reviews.slice(0, 5).map((review) => ({
                authorName: review.author_name || 'Unknown',
                rating: review.rating || 0,
                text: review.text || '',
              }));
            }

            // Build description
            let description = '';
            if (details.rating) {
              description += `${details.rating}/5 ⭐ `;
            }
            if (details.price_level !== undefined) {
              const priceSymbols = ['Үнэгүй', 'Хямд', 'Дунд', 'Үнэтэй', 'Маш үнэтэй'];
              description += `${priceSymbols[details.price_level] || ''} `;
            }
            if (details.opening_hours?.open_now !== undefined) {
              description += details.opening_hours.open_now ? 'Одоо нээлттэй' : 'Одоо хаалттай';
            }
            placeDetails.briefDescription = description || 'Газар олдлоо';

            console.log(`✅ Google Places API амжилттай: ${placeDetails.name}`);
            return res.json({ place: placeDetails });
          }
        }
      } catch (googleError) {
        console.error('❌ Google Places API алдаа:', googleError.response?.data || googleError.message);
        // Continue to OpenTripMap
      }
    }

    // Try OpenTripMap API as fallback (from OPENTRIPMAP_API_KEY in .env)
    if (OPENTRIPMAP_API_KEY) {
      try {
        console.log(`🔍 OpenTripMap API ашиглан "${placeName}" газрын мэдээлэл хайж байна...`);

        // Use radius search around Ulaanbaatar center (default destination)
        const defaultLat = 47.9203;
        const defaultLng = 106.9170;
        const searchRadius = 10000; // 10km radius

        // Search for places in the area using radius search
        const placesResponse = await axios.get(
          'https://api.opentripmap.com/0.1/en/places/radius',
          {
            params: {
              radius: searchRadius,
              lat: defaultLat,
              lon: defaultLng,
              limit: 50, // Get more results to find a match
              apikey: OPENTRIPMAP_API_KEY,
            },
            timeout: 60000, // Increased to 60000ms (60 seconds) for better reliability
            validateStatus: (status) => status < 500, // Accept 404 as valid
          }
        );

        if (placesResponse.status === 200 && Array.isArray(placesResponse.data) && placesResponse.data.length > 0) {
          // Find the best matching place by name
          const matchingPlace = placesResponse.data.find((p) => {
            const placeNameLower = placeName.toLowerCase();
            const pNameLower = (p.name || '').toLowerCase();
            return pNameLower.includes(placeNameLower) ||
              placeNameLower.includes(pNameLower) ||
              placeNameLower.split(' ').some(word => pNameLower.includes(word));
          }) || placesResponse.data[0]; // If no match, use first result

          if (matchingPlace?.xid) {
            // Get detailed place info
            try {
              const detailResponse = await axios.get(
                `https://api.opentripmap.com/0.1/en/places/xid/${matchingPlace.xid}`,
                {
                  params: {
                    apikey: OPENTRIPMAP_API_KEY,
                  },
                  timeout: 60000, // Increased to 60000ms (60 seconds) for better reliability
                  validateStatus: (status) => status < 500,
                }
              );

              if (detailResponse.status === 200 && detailResponse.data) {
                const detail = detailResponse.data;
                const lat = detail.point?.lat || matchingPlace.point?.lat || defaultLat;
                const lng = detail.point?.lon || matchingPlace.point?.lon || defaultLng;

                placeDetails.name = detail.name || matchingPlace.name || placeName;
                placeDetails.formatted_address = detail.address?.freeform || detail.address?.road || destination;
                placeDetails.briefDescription = detail.wikipedia_extracts?.text || detail.info?.descr || detail.otm?.descr || '';
                placeDetails.rating = detail.rate || 0;

                placeDetails.geometry = {
                  location: { lat, lng },
                  viewport: {
                    northeast: { lat: lat + 0.005, lng: lng + 0.005 },
                    southwest: { lat: lat - 0.005, lng: lng - 0.005 },
                  }
                };

                if (detail.preview?.source) {
                  placeDetails.photos = [{
                    url: detail.preview.source,
                    photo_reference: detail.preview.source
                  }];
                }

                // Ensure viewport exists before returning
                placeDetails.geometry = ensureViewport(placeDetails.geometry);
                console.log(`✅ OpenTripMap API амжилттай: ${placeDetails.name}`);
                return res.json({ place: placeDetails });
              }
            } catch (detailError) {
              // If detail fetch fails (404), use the basic result from radius search
              if (matchingPlace.point) {
                const lat = matchingPlace.point.lat || defaultLat;
                const lng = matchingPlace.point.lon || defaultLng;
                placeDetails.name = matchingPlace.name || placeName;
                placeDetails.formatted_address = destination;
                placeDetails.briefDescription = '';
                placeDetails.geometry = {
                  location: { lat, lng },
                  viewport: {
                    northeast: { lat: lat + 0.005, lng: lng + 0.005 },
                    southwest: { lat: lat - 0.005, lng: lng - 0.005 },
                  }
                };
                placeDetails.geometry = ensureViewport(placeDetails.geometry);
                console.log(`✅ OpenTripMap radius search амжилттай: ${placeDetails.name}`);
                return res.json({ place: placeDetails });
              }
            }
          }
        }
      } catch (openTripError) {
        // Don't log 404 as error, it's expected if place not found
        if (openTripError.response?.status !== 404) {
          console.error('❌ OpenTripMap API алдаа:', openTripError.response?.data || openTripError.message);
        }
      }
    }

    // Return basic place info if APIs fail - ensure viewport exists
    console.log(`⚠️  API-ууд амжилтгүй, үндсэн мэдээлэл буцааж байна`);
    placeDetails.geometry = ensureViewport(placeDetails.geometry);
    return res.json({ place: placeDetails });
  } catch (e) {
    console.error('AI place details error:', e);
    res.status(500).json({ error: 'AI place details failed' });
  }
});

/**
 * UB city-only structured plan with approximate costs, durations, transport and photos
 * No external API keys required. Static curated data suitable for quick-start.
 */
app.post('/api/ub/plan', async (req, res) => {
  try {
    const { startDate, endDate, budget = 'medium', days = 2 } = req.body || {};
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // Curated Ulaanbaatar POIs
    const POIS = [
      {
        name: 'Sukhbaatar Square',
        formatted_address: 'Chingeltei, Ulaanbaatar',
        briefDescription: 'Улаанбаатарын төв талбай. Засгийн газрын ордон, музей, театртай ойрхон.',
        photos: ['https://upload.wikimedia.org/wikipedia/commons/0/0b/Sukhbaatar_Square_2015.jpg'],
        geometry: { location: { lat: 47.9203, lng: 106.9170 } },
        durationMins: 60,
        transport: 'Walk/Taxi',
        costMnt: 0,
        types: ['landmark']
      },
      {
        name: 'Gandan Monastery',
        formatted_address: 'Bayangol, Ulaanbaatar',
        briefDescription: 'Буддын том хийд. Лам нарын уншлага, Мигжид Жанрайсиг хөшөө.',
        photos: ['https://upload.wikimedia.org/wikipedia/commons/6/6b/Gandantegchinlen_Monastery%2C_Ulaanbaatar.jpg'],
        geometry: { location: { lat: 47.9221, lng: 106.8945 } },
        durationMins: 90,
        transport: 'Taxi (10-15 мин)',
        costMnt: 5000,
        types: ['monastery']
      },
      {
        name: 'National Museum of Mongolia',
        formatted_address: 'Sükhbaatar District, Ulaanbaatar',
        briefDescription: 'Монголын түүх, соёлыг нэг дор үзэх том музей.',
        photos: ['https://upload.wikimedia.org/wikipedia/commons/5/5e/National_Museum_of_Mongolia.jpg'],
        geometry: { location: { lat: 47.9195, lng: 106.9179 } },
        durationMins: 120,
        transport: 'Walk/Taxi',
        costMnt: 15000,
        types: ['museum']
      },
      {
        name: 'Zaisan Memorial',
        formatted_address: 'Khan-Uul, Ulaanbaatar',
        briefDescription: 'Хотын панорама харагдах алдартай цэг. Нар мандах/шингэхэд сайхан.',
        photos: ['https://upload.wikimedia.org/wikipedia/commons/0/0f/Zaisan_Memorial_Ulaanbaatar.jpg'],
        geometry: { location: { lat: 47.8798, lng: 106.9514 } },
        durationMins: 90,
        transport: 'Taxi (15-25 мин)',
        costMnt: 0,
        types: ['viewpoint']
      },
      {
        name: 'Bogd Khan Palace Museum',
        formatted_address: 'Bayanzurkh/Khan-Uul, Ulaanbaatar',
        briefDescription: 'Богд хааны ордон музей – Монголын сүүлчийн хааны өв.',
        photos: ['https://upload.wikimedia.org/wikipedia/commons/0/0e/Bogd_Khaan_Palace_Museum.jpg'],
        geometry: { location: { lat: 47.9023, lng: 106.9183 } },
        durationMins: 90,
        transport: 'Taxi (10-20 мин)',
        costMnt: 20000,
        types: ['museum', 'palace']
      },
      {
        name: 'Choijin Lama Temple Museum',
        formatted_address: 'Sükhbaatar District, Ulaanbaatar',
        briefDescription: 'Шашны урлагийн гайхамшигт цуглуулгатай музей.',
        photos: ['https://upload.wikimedia.org/wikipedia/commons/a/ad/Choijin_Lama_Temple_Museum.jpg'],
        geometry: { location: { lat: 47.9169, lng: 106.9244 } },
        durationMins: 75,
        transport: 'Walk/Taxi',
        costMnt: 15000,
        types: ['museum', 'temple']
      }
    ];

    // Simple splitter for days
    const all = [...POIS];
    const plan = [];
    const dayjs = (d) => new Date(d);
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const totalDays = Math.max(1, Math.min(days, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1));
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(start.getTime());
      date.setDate(start.getDate() + i);
      const take = all.splice(0, Math.ceil(POIS.length / totalDays)) || [];
      plan.push({
        date: date.toISOString().slice(0, 10),
        activities: take.map(a => ({
          name: a.name,
          formatted_address: a.formatted_address,
          photos: a.photos,
          briefDescription: a.briefDescription,
          geometry: a.geometry,
          types: a.types,
          openingHours: [],
          phoneNumber: '',
          website: '',
          meta: {
            durationMins: a.durationMins,
            transport: a.transport,
            costMnt: a.costMnt,
            budget
          }
        }))
      });
    }

    const lodging = [
      {
        name: 'Kempinski Hotel Khan Palace',
        priceRange: budget === 'low' ? '300-400k MNT' : budget === 'high' ? '700k+ MNT' : '450-650k MNT',
        address: 'Bayanzurkh, Ulaanbaatar',
        photos: ['https://cf.bstatic.com/xdata/images/hotel/max1280x900/14532880.jpg?k=4a2f2e...'],
      },
      {
        name: 'Holiday Inn Ulaanbaatar',
        priceRange: budget === 'low' ? '200-300k MNT' : budget === 'high' ? '450k+ MNT' : '300-450k MNT',
        address: 'Sükhbaatar District, Ulaanbaatar',
        photos: ['https://cf.bstatic.com/xdata/images/hotel/max1280x900/97155727.jpg?k=...'],
      }
    ];

    return res.json({
      destination: 'Ulaanbaatar', plan, lodging, tips: [
        'Такси: InDrive, UBCab ашигла.',
        'Оройн зураг авах бол Зайсан/Сүхбаатарын талбай сайхан.',
        'Музейн цагийн хуваарийг урьдчилан шалга.'
      ]
    });
  } catch (e) {
    console.error('UB plan error:', e);
    res.status(500).json({ error: 'UB plan failed' });
  }
});

// Google Places proxy (avoid CORS; hide API key)
app.get('/api/places/autocomplete', async (req, res) => {
  try {
    const input = (req.query.input || '').toString();
    if (!input) return res.json({ predictions: [] });

    if (GOOGLE_MAPS_API_KEY) {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}`;
      const r = await axios.get(url);
      return res.json(r.data);
    }

    // Fallback: Nominatim autocomplete scoped to Mongolia (countrycodes=mn)
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&addressdetails=1&limit=5&countrycodes=mn`;
    const nr = await axios.get(nomUrl, { headers: { 'User-Agent': 'trip-planner' } });
    const predictions = (nr.data || []).map((p) => ({
      description: p.display_name,
      place_id: String(p.osm_id),
    }));
    return res.json({ predictions });
  } catch (e) {
    console.error('places autocomplete error:', e?.response?.data || e.message);
    res.status(500).json({ error: 'autocomplete failed' });
  }
});

app.get('/api/places/details', async (req, res) => {
  try {
    const place_id = (req.query.place_id || '').toString();
    if (GOOGLE_MAPS_API_KEY) {
      const fields = (req.query.fields || 'name,formatted_address,photos,opening_hours,formatted_phone_number,website,geometry,types,reviews,editorial_summary').toString();
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=${encodeURIComponent(fields)}&key=${GOOGLE_MAPS_API_KEY}`;
      const r = await axios.get(url);
      return res.json(r.data);
    }

    // Fallback: Nominatim lookup (transform to Google-like schema)
    // Nominatim requires prefix for osm type, but autocomplete only gave osm_id.
    // Try all common types (N, W, R) until found.
    const types = ['N', 'W', 'R'];
    let found = null;
    for (const t of types) {
      const lu = `https://nominatim.openstreetmap.org/lookup?osm_ids=${t}${place_id}&format=json&addressdetails=1`;
      const lr = await axios.get(lu, { headers: { 'User-Agent': 'trip-planner' } });
      if (Array.isArray(lr.data) && lr.data.length) { found = lr.data[0]; break; }
    }
    if (!found) return res.json({ status: 'ZERO_RESULTS' });

    // Try to fetch nearby Wikimedia images to provide photos
    let photos = [];
    try {
      const lat = Number(found.lat) || 0;
      const lon = Number(found.lon) || 0;
      const wmUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${lat}|${lon}&ggsradius=10000&ggslimit=6&prop=pageimages&piprop=thumbnail&pithumbsize=800&format=json&origin=*`;
      const wr = await axios.get(wmUrl);
      const pages = wr.data?.query?.pages || {};
      photos = Object.values(pages)
        .map((p) => p.thumbnail?.source)
        .filter(Boolean)
        .slice(0, 6);
    } catch (e) {
      // ignore image fetch errors
    }

    const result = {
      name: found.display_name?.split(',')[0] || 'Unknown Place',
      formatted_address: found.display_name,
      photos,
      opening_hours: { weekday_text: [] },
      formatted_phone_number: '',
      website: '',
      geometry: {
        location: { lat: Number(found.lat) || 0, lng: Number(found.lon) || 0 },
        viewport: {
          northeast: { lat: Number(found.lat) + 0.005, lng: Number(found.lon) + 0.005 },
          southwest: { lat: Number(found.lat) - 0.005, lng: Number(found.lon) - 0.005 },
        },
      },
      types: ['point_of_interest'],
      reviews: [],
      editorial_summary: { overview: '' },
    };
    return res.json({ status: 'OK', result });
  } catch (e) {
    console.error('places details error:', e?.response?.data || e.message);
    res.status(500).json({ error: 'details failed' });
  }
});

// Comprehensive list: 21 aimags of Mongolia with detailed information
export const MONGOLIA_AIMAGS = [
  {
    name: 'Arkhangai',
    nameMn: 'Архангай',
    code: 'AR',
    capital: 'Tsetserleg',
    capitalMn: 'Цэцэрлэг',
    coordinates: { lat: 47.4750, lng: 101.4542 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Tsetserleg_Mongolia.jpg',
    description: 'Mountainous province in central Mongolia, known for its beautiful landscapes and traditional culture.',
    descriptionMn: 'Төв Монголын уулархаг аймаг, үзэсгэлэнт байгаль, уламжлалт соёлоор алдартай.',
    attractions: ['Tsenkher Hot Springs', 'Khorgo Volcano', 'Terkhiin Tsagaan Lake', 'Chuluut River'],
    attractionsMn: ['Цэнхэр рашаан', 'Хорго хөх', 'Тэрхийн цагаан нуур', 'Чулуут гол'],
    area: '55,300 km²',
    population: '94,000',
  },
  {
    name: 'Bayan-Ölgii',
    nameMn: 'Баян-Өлгий',
    code: 'BO',
    capital: 'Ölgii',
    capitalMn: 'Өлгий',
    coordinates: { lat: 48.9683, lng: 89.9686 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Altai_Tavan_Bogd.jpg',
    description: 'Westernmost province, home to Kazakh culture, Altai mountains, and Tavan Bogd peak.',
    descriptionMn: 'Хамгийн баруун аймаг, казах соёл, Алтайн нуруу, Таван богд оргил.',
    attractions: ['Tavan Bogd National Park', 'Potanin Glacier', 'Altai Tavan Bogd', 'Kazakh Eagle Festival'],
    attractionsMn: ['Таван богд байгалийн цогцолборт газар', 'Потанины мөсөн гол', 'Алтайн таван богд', 'Казах бүргэдийн баяр'],
    area: '45,700 km²',
    population: '103,000',
  },
  {
    name: 'Bayankhongor',
    nameMn: 'Баянхонгор',
    code: 'BH',
    capital: 'Bayankhongor',
    capitalMn: 'Баянхонгор',
    coordinates: { lat: 46.1944, lng: 100.7181 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Bayankhongor_landscape.jpg',
    description: 'Central province with diverse landscapes from mountains to desert, rich in wildlife.',
    descriptionMn: 'Төв аймаг, уул, цөлөөр баялаг, ан амьтнаар баялаг.',
    attractions: ['Ikh Bogd Mountain', 'Ongi Monastery ruins', 'Gobi Gurvansaikhan National Park', 'Bayankhongor Museum'],
    attractionsMn: ['Их богд уул', 'Онгийн хийд', 'Говь гурван сайхан байгалийн цогцолборт газар', 'Баянхонгор музей'],
    area: '116,000 km²',
    population: '84,000',
  },
  {
    name: 'Bulgan',
    nameMn: 'Булган',
    code: 'BU',
    capital: 'Bulgan',
    capitalMn: 'Булган',
    coordinates: { lat: 48.8125, lng: 103.5347 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Bulgan_Aimag_scenery.jpg',
    description: 'Northern province with forests, rivers, and historical sites.',
    descriptionMn: 'Хойд аймаг, ой, гол, түүхэн дурсгалт газрууд.',
    attractions: ['Amarbayasgalant Monastery', 'Selenge River', 'Khanui River', 'Bulgan Museum'],
    attractionsMn: ['Амарбаясгалант хийд', 'Сэлэнгэ мөрөн', 'Хануй гол', 'Булган музей'],
    area: '48,700 km²',
    population: '61,000',
  },
  {
    name: 'Darkhan-Uul',
    nameMn: 'Дархан-Уул',
    code: 'DU',
    capital: 'Darkhan',
    capitalMn: 'Дархан',
    coordinates: { lat: 49.4867, lng: 105.9228 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Darkhan_city.jpg',
    description: 'Industrial city and province, second largest city in Mongolia.',
    descriptionMn: 'Аж үйлдвэрийн хот, аймаг, Монголын хоёр дахь том хот.',
    attractions: ['Darkhan Museum', 'Kharagiin Monastery', 'Amgalan Monastery', 'Darkhan Industrial Complex'],
    attractionsMn: ['Дархан музей', 'Харагийн хийд', 'Амгалан хийд', 'Дархан үйлдвэрийн цогцолбор'],
    area: '3,280 km²',
    population: '100,000',
  },
  {
    name: 'Dornod',
    nameMn: 'Дорнод',
    code: 'DO',
    capital: 'Choibalsan',
    capitalMn: 'Чойбалсан',
    coordinates: { lat: 48.0756, lng: 114.5325 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Dornod_steppe.jpg',
    description: 'Easternmost province, vast steppes, important historical region.',
    descriptionMn: 'Хамгийн зүүн аймаг, өргөн тал, чухал түүхэн бүс.',
    attractions: ['Kherlen River', 'Buir Lake', 'Dornod Mongol Steppe', 'Choibalsan Museum'],
    attractionsMn: ['Хэрлэн мөрөн', 'Буйр нуур', 'Дорнод монгол тал', 'Чойбалсан музей'],
    area: '123,600 km²',
    population: '76,000',
  },
  {
    name: 'Dornogovi',
    nameMn: 'Дорноговь',
    code: 'DG',
    capital: 'Sainshand',
    capitalMn: 'Сайншанд',
    coordinates: { lat: 44.8958, lng: 110.1417 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Dornogovi_desert.jpg',
    description: 'Eastern Gobi province, desert landscapes, dinosaur fossils.',
    descriptionMn: 'Зүүн говь аймаг, цөлийн байгаль, динозаврын олдворууд.',
    attractions: ['Khamaryn Khiid', 'Moltsog Els sand dunes', 'Sainshand city', 'Gobi dinosaur fossils'],
    attractionsMn: ['Хамарын хийд', 'Молцог элс', 'Сайншанд хот', 'Говь динозаврын олдвор'],
    area: '109,500 km²',
    population: '69,000',
  },
  {
    name: 'Dundgovi',
    nameMn: 'Дундговь',
    code: 'DD',
    capital: 'Mandalgovi',
    capitalMn: 'Мандалговь',
    coordinates: { lat: 45.7667, lng: 106.2667 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Dundgovi_Aimag.jpg',
    description: 'Central Gobi province, semi-desert, nomadic culture.',
    descriptionMn: 'Төв говь аймаг, хагас цөл, нүүдэлчдийн соёл.',
    attractions: ['Ikh Gazryn Chuluu', 'Delgerkhaan Uul', 'Mandalgovi city', 'Gobi landscapes'],
    attractionsMn: ['Их газрын чулуу', 'Дэлгэрхаан уул', 'Мандалговь хот', 'Говь байгаль'],
    area: '74,700 km²',
    population: '42,000',
  },
  {
    name: 'Govi-Altai',
    nameMn: 'Говь-Алтай',
    code: 'GA',
    capital: 'Altai',
    capitalMn: 'Алтай',
    coordinates: { lat: 46.3722, lng: 96.2583 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Govi-Altai_mountains.jpg',
    description: 'Southwestern province, Altai mountains, desert and mountain landscapes.',
    descriptionMn: 'Баруун өмнөд аймаг, Алтайн нуруу, цөл, уулын байгаль.',
    attractions: ['Great Gobi Strictly Protected Area', 'Altai Mountains', 'Khar Us Lake', 'Govi-Altai Museum'],
    attractionsMn: ['Их говь хамгаалалттай газар', 'Алтайн нуруу', 'Хар ус нуур', 'Говь-Алтай музей'],
    area: '141,400 km²',
    population: '58,000',
  },
  {
    name: 'Govisümber',
    nameMn: 'Говьсүмбэр',
    code: 'GS',
    capital: 'Choir',
    capitalMn: 'Чойр',
    coordinates: { lat: 46.3611, lng: 108.3611 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Govisumber_landscape.jpg',
    description: 'Smallest province, located in central Mongolia, mining region.',
    descriptionMn: 'Хамгийн жижиг аймаг, төв Монголд байрладаг, уул уурхайн бүс.',
    attractions: ['Choir city', 'Govisümber landscapes', 'Mining sites', 'Local museums'],
    attractionsMn: ['Чойр хот', 'Говьсүмбэрийн байгаль', 'Уул уурхайн байгуулагууд', 'Орон нутгийн музей'],
    area: '5,500 km²',
    population: '17,000',
  },
  {
    name: 'Khentii',
    nameMn: 'Хэнтий',
    code: 'HE',
    capital: 'Öndörkhaan',
    capitalMn: 'Өндөрхаан',
    coordinates: { lat: 47.3194, lng: 110.6556 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Khentii_mountains.jpg',
    description: 'Birthplace of Genghis Khan, mountainous province with forests and rivers.',
    descriptionMn: 'Чингис хааны төрсөн нутаг, ой, голтой уулархаг аймаг.',
    attractions: ['Genghis Khan Birthplace', 'Khentii Mountains', 'Baldan Bereeven Monastery', 'Onon River'],
    attractionsMn: ['Чингис хааны төрсөн газар', 'Хэнтийн нуруу', 'Балдан бэрээвэн хийд', 'Онон мөрөн'],
    area: '80,300 km²',
    population: '71,000',
  },
  {
    name: 'Khovd',
    nameMn: 'Ховд',
    code: 'HO',
    capital: 'Khovd',
    capitalMn: 'Ховд',
    coordinates: { lat: 48.0056, lng: 91.6417 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Khar-Us_Nuur_National_Park.jpg',
    description: 'Western province, diverse ethnic groups, lakes and mountains.',
    descriptionMn: 'Баруун аймаг, олон үндэстэн, нуур, уул.',
    attractions: ['Khar-Us Lake', 'Khar Nuur', 'Khovd River', 'Khovd Museum'],
    attractionsMn: ['Хар ус нуур', 'Хар нуур', 'Ховд гол', 'Ховд музей'],
    area: '76,100 km²',
    population: '88,000',
  },
  {
    name: 'Khovsgol',
    nameMn: 'Хөвсгөл',
    code: 'HG',
    capital: 'Mörön',
    capitalMn: 'Мөрөн',
    coordinates: { lat: 49.6347, lng: 100.1625 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Khuvsgul_Lake.jpg',
    description: 'Northern province, home to Khövsgöl Lake, one of the largest freshwater lakes.',
    descriptionMn: 'Хойд аймаг, Хөвсгөл нуурын нутаг, хамгийн том цэнгэг усны нуур.',
    attractions: ['Khövsgöl Lake', 'Darkhad Valley', 'Reindeer herders', 'Mörön city'],
    attractionsMn: ['Хөвсгөл нуур', 'Дархад хөндий', 'Цаатан ард түмэн', 'Мөрөн хот'],
    area: '100,600 km²',
    population: '132,000',
  },
  {
    name: 'Orkhon',
    nameMn: 'Орхон',
    code: 'OR',
    capital: 'Erdenet',
    capitalMn: 'Эрдэнэт',
    coordinates: { lat: 49.0278, lng: 104.0444 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Orkhon_river.jpg',
    description: 'Industrial province, home to Erdenet, major mining city.',
    descriptionMn: 'Аж үйлдвэрийн аймаг, Эрдэнэт хот, том уул уурхайн хот.',
    attractions: ['Erdenet city', 'Orkhon River', 'Mining museum', 'Local markets'],
    attractionsMn: ['Эрдэнэт хот', 'Орхон мөрөн', 'Уул уурхайн музей', 'Орон нутгийн зах'],
    area: '844 km²',
    population: '100,000',
  },
  {
    name: 'Ömnögovi',
    nameMn: 'Өмнөговь',
    code: 'OG',
    capital: 'Dalanzadgad',
    capitalMn: 'Даланзадгад',
    coordinates: { lat: 43.5708, lng: 104.4250 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Khongoryn_Els_Dunes.jpg',
    description: 'Southern Gobi province, famous for sand dunes, dinosaur fossils, and Flaming Cliffs.',
    descriptionMn: 'Өмнөд говь аймаг, элсэн дов, динозаврын олдвор, Галт улаан хад.',
    attractions: ['Khongoryn Els', 'Flaming Cliffs', 'Gurvan Saikhan National Park', 'Yolyn Am'],
    attractionsMn: ['Хонгорын элс', 'Галт улаан хад', 'Гурван сайхан байгалийн цогцолборт газар', 'Ёлын ам'],
    area: '165,400 km²',
    population: '65,000',
  },
  {
    name: 'Selenge',
    nameMn: 'Сэлэнгэ',
    code: 'SE',
    capital: 'Sükhbaatar',
    capitalMn: 'Сүхбаатар',
    coordinates: { lat: 50.2375, lng: 106.2078 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Selenge_River.jpg',
    description: 'Northern province, Selenge River, agricultural region.',
    descriptionMn: 'Хойд аймаг, Сэлэнгэ мөрөн, хөдөө аж ахуйн бүс.',
    attractions: ['Selenge River', 'Sükhbaatar city', 'Amarbayasgalant Monastery', 'Agricultural areas'],
    attractionsMn: ['Сэлэнгэ мөрөн', 'Сүхбаатар хот', 'Амарбаясгалант хийд', 'Хөдөө аж ахуйн бүс'],
    area: '41,200 km²',
    population: '108,000',
  },
  {
    name: 'Sükhbaatar',
    nameMn: 'Сүхбаатар',
    code: 'SB',
    capital: 'Baruun-Urt',
    capitalMn: 'Баруун-Урт',
    coordinates: { lat: 46.6806, lng: 113.2833 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Mongolian_steppe.jpg',
    description: 'Eastern province, vast steppes, nomadic culture.',
    descriptionMn: 'Зүүн аймаг, өргөн тал, нүүдэлчдийн соёл.',
    attractions: ['Steppe landscapes', 'Baruun-Urt city', 'Local museums', 'Traditional ger camps'],
    attractionsMn: ['Тал байгаль', 'Баруун-Урт хот', 'Орон нутгийн музей', 'Уламжлалт гэр айл'],
    area: '82,300 km²',
    population: '58,000',
  },
  {
    name: 'Töv',
    nameMn: 'Төв',
    code: 'TO',
    capital: 'Zuunmod',
    capitalMn: 'Зуунмод',
    coordinates: { lat: 47.7069, lng: 106.9531 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/35/Terelj_Mongolia.jpg',
    description: 'Central province surrounding Ulaanbaatar, includes Terelj National Park.',
    descriptionMn: 'Улаанбаатарыг тойрсон төв аймаг, Тэрэлж байгалийн цогцолборт газар.',
    attractions: ['Terelj National Park', 'Turtle Rock', 'Aryabal Temple', 'Genghis Khan Statue Complex'],
    attractionsMn: ['Тэрэлж байгалийн цогцолборт газар', 'Ямаа чулуу', 'Ариабалагийн сүм', 'Чингис хааны хөшөөний цогцолбор'],
    area: '74,000 km²',
    population: '90,000',
  },
  {
    name: 'Uvs',
    nameMn: 'Увс',
    code: 'UV',
    capital: 'Ulaangom',
    capitalMn: 'Улаангом',
    coordinates: { lat: 49.9833, lng: 92.0667 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Uvs_Lake.jpg',
    description: 'Western province, Uvs Lake, diverse ecosystems.',
    descriptionMn: 'Баруун аймаг, Увс нуур, олон төрлийн экосистем.',
    attractions: ['Uvs Lake', 'Ulaangom city', 'Khyargas Lake', 'Uvs Nuur Basin'],
    attractionsMn: ['Увс нуур', 'Улаангом хот', 'Хяргас нуур', 'Увс нуурын сав газар'],
    area: '69,600 km²',
    population: '83,000',
  },
  {
    name: 'Uvurkhangai',
    nameMn: 'Өвөрхангай',
    code: 'UH',
    capital: 'Arvaikheer',
    capitalMn: 'Арвайхээр',
    coordinates: { lat: 46.2639, lng: 102.7750 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Erdene_Zuu_Monastery.jpg',
    description: 'Central province, home to ancient capital Karakorum and Erdene Zuu Monastery.',
    descriptionMn: 'Төв аймаг, эртний нийслэл Хархорум, Эрдэнэ Зуу хийд.',
    attractions: ['Erdene Zuu Monastery', 'Karakorum', 'Orkhon Valley', 'Tövkhön Monastery'],
    attractionsMn: ['Эрдэнэ Зуу хийд', 'Хархорум', 'Орхон хөндий', 'Төвхөн хийд'],
    area: '62,900 km²',
    population: '111,000',
  },
  {
    name: 'Zavkhan',
    nameMn: 'Завхан',
    code: 'ZA',
    capital: 'Uliastai',
    capitalMn: 'Улиастай',
    coordinates: { lat: 47.7417, lng: 96.8444 },
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Great_Lakes_Depression_Mongolia.jpg',
    description: 'Western province, Great Lakes Depression, mountains and lakes.',
    descriptionMn: 'Баруун аймаг, Их нуурын хотгор, уул, нуур.',
    attractions: ['Great Lakes Depression', 'Uliastai city', 'Otgontenger Mountain', 'Zavkhan River'],
    attractionsMn: ['Их нуурын хотгор', 'Улиастай хот', 'Отгонтэнгэр уул', 'Завхан гол'],
    area: '82,500 km²',
    population: '71,000',
  },
  {
    name: 'Ulaanbaatar',
    nameMn: 'Улаанбаатар',
    code: 'UB',
    capital: 'Ulaanbaatar',
    capitalMn: 'Улаанбаатар',
    coordinates: { lat: 47.8864, lng: 106.9057 },
    image: 'C:\Users\anna\Downloads\altai-baatarkhuu-q_nHRJdNvzA-unsplash.jpg',
    description: 'Capital city of Mongolia, political, economic, and cultural center.',
    descriptionMn: 'Монгол улсын нийслэл хот, улс төрийн, эдийн засгийн, соёлын төв.',
    attractions: ['Sukhbaatar Square', 'Gandan Monastery', 'National Museum', 'Zaisan Memorial', 'Bogd Khan Palace', 'Terelj National Park'],
    attractionsMn: ['Сүхбаатарын талбай', 'Гандан хийд', 'Үндэсний музей', 'Зайсан хөшөө', 'Богд хааны ордон', 'Тэрэлж байгалийн цогцолборт газар'],
    area: '4,704 km²',
    population: '1,500,000',
  },
];

app.get('/api/places/aimags', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().toLowerCase();
    let items = await Aimag.find().lean();
    if (!items || items.length === 0) {
      // seed once if collection empty
      await Aimag.insertMany(MONGOLIA_AIMAGS.map((a) => ({ ...a })));
      items = await Aimag.find().lean();
    }
    if (q) {
      items = items.filter((a) => a.name.toLowerCase().includes(q));
    }
    return res.json({ items });
  } catch (e) {
    console.error('aimags error:', e.message);
    res.status(500).json({ error: 'aimags failed' });
  }
});

// Compatibility routes for react-native-google-places-autocomplete (web requestUrl expects Google-like paths)
app.get('/place/autocomplete/json', async (req, res) => {
  try {
    const q = (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
    return res.redirect(307, '/api/places/autocomplete' + q);
  } catch (e) {
    console.error('compat autocomplete error:', e?.message);
    return res.status(500).json({ error: 'autocomplete proxy failed' });
  }
});

app.get('/place/details/json', async (req, res) => {
  try {
    const q = (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
    return res.redirect(307, '/api/places/details' + q);
  } catch (e) {
    console.error('compat details error:', e?.message);
    return res.status(500).json({ error: 'details proxy failed' });
  }
});

// Start Server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} (0.0.0.0)`);
});
