import mongoose from "mongoose";

const communityContributionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["transport", "place", "tip", "event"],
      required: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    submittedBy: {
      name: String,
      email: String,
      userId: { type: String },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    moderatorNotes: String,
  },
  { timestamps: true }
);

export default mongoose.model("CommunityContribution", communityContributionSchema);

