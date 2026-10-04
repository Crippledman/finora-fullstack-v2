import express from "express";
import Loan from "../models/Loan.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    res.json(await Loan.find({ userId: req.userId }).sort({ createdAt: -1 }));
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await Loan.create({ ...req.body, userId: req.userId }));
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const item = await Loan.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!item) return res.status(404).json({ message: "Loan not found" });
    res.json({ message: "Deleted" });
  } catch (error) { next(error); }
});

export default router;
