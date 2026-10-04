import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, required: true, maxlength: 50 },
    limit: { type: Number, required: true, min: 0.01 }
  },
  { timestamps: true }
);

export default mongoose.model("Budget", budgetSchema);
