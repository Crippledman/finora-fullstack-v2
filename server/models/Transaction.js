import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0.01 },
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String, required: true, maxlength: 50 },
    date: { type: String, required: true },
    note: { type: String, default: "", maxlength: 500 }
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
