import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Aimag from './models/aimag.js';
import { MONGOLIA_AIMAGS } from './server.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tripPlanner';

async function run() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    await Aimag.deleteMany({});
    // Use the code from the data, or generate one if missing
    await Aimag.insertMany(MONGOLIA_AIMAGS.map((a) => ({ 
      ...a, 
      code: a.code || a.name.substring(0, 2).toUpperCase() 
    })));
    const count = await Aimag.countDocuments();
    console.log(`Seeded ${count} aimags with comprehensive data`);
  } catch (e) {
    console.error('Seed error:', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();


