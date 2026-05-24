import mongoose from "mongoose";

const experienceReviewSchema = new mongoose.Schema(
  {
    placeId: { type: String },
    placeName: { type: String, required: true },
    location: { type: String },
    category: { type: String },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    photos: [String],
    visitedOn: { type: Date },
    travelerType: { type: String },
    userName: { type: String, default: "Traveler" },
    userAvatar: { type: String },
    verifiedTripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
  },
  { timestamps: true }
);

export default mongoose.model("ExperienceReview", experienceReviewSchema);

