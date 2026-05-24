import mongoose from 'mongoose';

const aimagSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  nameMn: { type: String }, // Mongolian name
  code: { type: String },
  image: { type: String, required: true },
  capital: { type: String }, // Capital city name
  capitalMn: { type: String }, // Capital city name in Mongolian
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  description: { type: String },
  descriptionMn: { type: String }, // Description in Mongolian
  attractions: [{ type: String }], // Key attractions/places
  attractionsMn: [{ type: String }], // Attractions in Mongolian
  area: { type: String }, // Area in km²
  population: { type: String }, // Population
}, { timestamps: true });

export default mongoose.model('Aimag', aimagSchema);


