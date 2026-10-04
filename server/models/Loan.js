import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, maxlength: 120 },
    principal: { type: Number, required: true, min: 0.01 },
    annualRate: { type: Number, required: true, min: 0 },
    months: { type: Number, required: true, min: 1 }
  },
  { timestamps: true }
);

export default mongoose.model("Loan", loanSchema);
