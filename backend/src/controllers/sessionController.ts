import { Request, Response } from "express";
import Session from "../models/Session";
import Question from "../models/Question";
import { io } from "../index";

const generateCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// CREATE SESSION
export const createSession = async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user.id;
    const code = generateCode();
    const session = await Session.create({ teacherId, code });
    res.status(201).json({ message: "Session created successfully", session });
  } catch (error) {
    console.error("CREATE SESSION ERROR:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// JOIN SESSION
export const joinSession = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const session = await Session.findOne({ code: code.toUpperCase() });
    if (!session) return res.status(404).json({ message: "Invalid session code" });
    if (session.status === "ended") return res.status(400).json({ message: "This session has ended" });
    res.status(200).json({ message: "Joined session successfully", session });
  } catch (error) {
    console.error("JOIN SESSION ERROR:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// UPDATE SESSION STATUS
export const updateSessionStatus = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;

    const session = await Session.findByIdAndUpdate(
      sessionId, { status }, { new: true }
    );

    if (!session) return res.status(404).json({ message: "Session not found" });

    io.to(sessionId).emit("session-status", status);

    res.status(200).json({ message: "Session status updated", session });
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// GET SESSION SUMMARY
export const getSessionSummary = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const questions = await Question.find({ sessionId });

    const totalQuestions = questions.length;

    // Calculate duration
    const start = new Date(session.createdAt).getTime();
    const end = Date.now();
    const durationMinutes = Math.floor((end - start) / 60000);

    // Simple mood gist based on keywords
    const allText = questions.map(q => q.text.toLowerCase()).join(" ");
    let mood = "Neutral 😐";
    if (allText.includes("confused") || allText.includes("don't understand") || allText.includes("unclear")) {
      mood = "Confused 😕 — Students need more clarification";
    } else if (allText.includes("interesting") || allText.includes("great") || allText.includes("love") || allText.includes("amazing")) {
      mood = "Engaged 🔥 — Students are very interested";
    } else if (allText.includes("difficult") || allText.includes("hard") || allText.includes("tough")) {
      mood = "Struggling 😰 — Topic seems difficult";
    } else if (totalQuestions > 5) {
      mood = "Curious 🤔 — High engagement with many questions";
    } else if (totalQuestions === 0) {
      mood = "Quiet 😶 — No questions submitted";
    } else {
      mood = "Engaged 👍 — Normal participation";
    }

    res.status(200).json({
      session,
      totalQuestions,
      durationMinutes,
      mood,
      questions,
    });
  } catch (error) {
    console.error("GET SUMMARY ERROR:", error);
    res.status(500).json({ message: "Server error", error });
  }
};