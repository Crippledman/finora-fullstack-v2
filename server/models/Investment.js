import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, maxlength: 120 },
    invested: { type: Number, required: true, min: 0 },
    current: { type: Number, required: true, min: 0 },
    type: { type: String, required: true, maxlength: 50 }
  },
  { timestamps: true }
);

export default mongoose.model("Investment", investmentSchema);
