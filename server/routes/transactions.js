import express from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const items = await Transaction.find({ userId: req.userId }).sort({ date: -1, createdAt: -1 });
    res.json(items);
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const item = await Transaction.create({ ...req.body, userId: req.userId });
    res.status(201).json(item);
  } catch (error) { next(error); }
});

router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid ID" });

    const item = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) return res.status(404).json({ message: "Transaction not found" });
    res.json(item);
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const item = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!item) return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Deleted" });
  } catch (error) { next(error); }
});

export default router;
