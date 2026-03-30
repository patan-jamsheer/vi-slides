import express from "express";
import { submitQuestion, getQuestions } from "../controllers/questionController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/submit", protect, submitQuestion);
router.get("/:sessionId", protect, getQuestions);

export default router;