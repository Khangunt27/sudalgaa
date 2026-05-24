import mongoose from 'mongoose';
import Trip from './models/trip.js';
import User from './models/user.js';

const mongoURI = process.env.MONGODB_URI;

function makeViewport(lat, lng, delta = 0.01) {
  return {
    northeast: { lat: lat + delta, lng: lng + delta },
    southwest: { lat: lat - delta, lng: lng - delta },
  };
}

async function run() {
  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB');

  const clerkUserId = 'seed-admin';
  const email = 'seed@example.com';
  let user = await User.findOne({ clerkUserId });
  if (!user) {
    user = await User.create({ clerkUserId, email, name: 'Seeder' });
  }

  const placesToVisit = [
    {
      name: 'Сүхбаатарын талбай',
      formatted_address: 'Sukhbaatar Square, Ulaanbaatar, Mongolia',
      briefDescription: 'Улсын төв талбай, Засгийн газрын ордон, музейнууд орчимд байрладаг.',
      photos: [],
      reviews: [],
      types: ['landmark'],
      geometry: {
        location: { lat: 47.9203, lng: 106.9170 },
        viewport: makeViewport(47.9203, 106.9170),
      },
    },
    {
      name: 'Гандантэгчинлэн хийд',
      formatted_address: 'Gandantegchinlen Monastery, Ulaanbaatar, Mongolia',
      briefDescription: 'Монгол улсын хамгийн том хийд, идэвхтэй шашны газар.',
      photos: [],
      reviews: [],
      types: ['monastery'],
      geometry: {
        location: { lat: 47.9221, lng: 106.8945 },
        viewport: makeViewport(47.9221, 106.8945),
      },
    },
    {
      name: 'Зайсан толгой',
      formatted_address: 'Zaisan Memorial, Ulaanbaatar, Mongolia',
      briefDescription: 'Хотын үзэсгэлэнт панорама бүхий уулын орой дээрх хөшөө.',
      photos: [],
      reviews: [],
      types: ['viewpoint'],
      geometry: {
        location: { lat: 47.8798, lng: 106.9514 },
        viewport: makeViewport(47.8798, 106.9514),
      },
    },
    {
      name: 'Богд хааны ордон',
      formatted_address: 'Bogd Khaan Palace Museum, Ulaanbaatar, Mongolia',
      briefDescription: 'Монгол улсын сүүлчийн хааны ордон музей.',
      photos: [],
      reviews: [],
      types: ['museum'],
      geometry: {
        location: { lat: 47.8991, lng: 106.9170 },
        viewport: makeViewport(47.8991, 106.9170),
      },
    },
    {
      name: 'Монголын үндэсний музей',
      formatted_address: 'National Museum of Mongolia, Ulaanbaatar, Mongolia',
      briefDescription: 'Монгол улсын түүх, соёлыг бүрэн харуулсан музей.',
      photos: [],
      reviews: [],
      types: ['museum'],
      geometry: {
        location: { lat: 47.9195, lng: 106.9176 },
        viewport: makeViewport(47.9195, 106.9176),
      },
    },
  ];

  const existing = await Trip.findOne({ tripName: 'Ulaanbaatar Sample Trip' });
  if (existing) {
    await existing.deleteOne();
  }

  const trip = await Trip.create({
    tripName: 'Ulaanbaatar Sample Trip',
    startDate: '2025-06-01',
    endDate: '2025-06-03',
    startDay: 'Sunday',
    endDay: 'Tuesday',
    background: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Sukhbaatar_Square_2015.jpg',
    host: user._id,
    travelers: [user._id],
    budget: 0,
    expenses: [],
    placesToVisit,
    itinerary: [
      { date: '2025-06-01', activities: [] },
      { date: '2025-06-02', activities: [] },
      { date: '2025-06-03', activities: [] },
    ],
  });

  console.log('Seeded trip:', trip.tripName, trip._id.toString());
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


