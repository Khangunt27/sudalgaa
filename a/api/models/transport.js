import mongoose from "mongoose";

const transportReviewSchema = new mongoose.Schema(
  {
    authorName: String,
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    source: String,
  },
  { _id: false }
);

const transportOptionSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ["taxi", "bus", "shuttle", "train", "rideshare"],
      required: true,
    },
    provider: { type: String, required: true },
    routeName: { type: String },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    durationMinutes: { type: Number },
    price: { type: Number, required: true },
    currency: { type: String, default: "MNT" },
    schedule: {
      frequency: String,
      firstDeparture: String,
      lastDeparture: String,
    },
    amenities: [String],
    rating: { type: Number, default: 4.5 },
    ratingCount: { type: Number, default: 0 },
    reviews: [transportReviewSchema],
    lastUpdated: { type: Date, default: Date.now },
    isCrowdsourced: { type: Boolean, default: false },
    source: { type: String, default: "official" },
  },
  { timestamps: true }
);

export default mongoose.model("TransportOption", transportOptionSchema);

