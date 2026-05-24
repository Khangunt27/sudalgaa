import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Trip from './models/trip.js';
import User from './models/user.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tripPlanner';

async function run() {
  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB');

  const deleteUsers = process.argv.includes('--users');
  const deleteTrips = process.argv.includes('--trips');

  if (!deleteUsers && !deleteTrips) {
    console.log('Nothing to delete. Use --users and/or --trips flags.');
    await mongoose.disconnect();
    return;
  }

  if (deleteTrips) {
    const res = await Trip.deleteMany({});
    console.log(`Deleted trips: ${res.deletedCount}`);
  }

  if (deleteUsers) {
    const res = await User.deleteMany({});
    console.log(`Deleted users: ${res.deletedCount}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


