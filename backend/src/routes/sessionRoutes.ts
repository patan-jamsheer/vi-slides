import express from "express";
import { createSession, joinSession, updateSessionStatus, getSessionSummary } from "../controllers/sessionController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/create", protect, createSession);
router.post("/join", protect, joinSession);
router.patch("/:sessionId/status", protect, updateSessionStatus);
router.get("/:sessionId/summary", protect, getSessionSummary);

export default router;