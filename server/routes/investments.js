import express from "express";
import Investment from "../models/Investment.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    res.json(await Investment.find({ userId: req.userId }).sort({ createdAt: -1 }));
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await Investment.create({ ...req.body, userId: req.userId }));
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const item = await Investment.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!item) return res.status(404).json({ message: "Investment not found" });
    res.json({ message: "Deleted" });
  } catch (error) { next(error); }
});

export default router;
