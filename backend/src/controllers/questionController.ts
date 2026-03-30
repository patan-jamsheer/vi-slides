import { Request, Response } from "express";
import Question from "../models/Question";
import Session from "../models/Session";
import { io } from "../index";
import { analyzeQuestion } from "../services/aiService";

// SUBMIT QUESTION
export const submitQuestion = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.id;
    const { sessionId, text, isAnonymous } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.status === "ended") return res.status(400).json({ message: "Session has ended" });
    if (session.status === "paused") return res.status(400).json({ message: "Session is paused" });

    // AI analysis
    const aiResult = await analyzeQuestion(text);

    const question = await Question.create({
      sessionId,
      studentId,
      text,
      isAnonymous: isAnonymous || false,
      status: aiResult.complexity === "simple" ? "ai-answered" : "pending",
      aiAnswer: aiResult.aiAnswer,
    });

    // Emit to teacher in real-time
    io.to(sessionId).emit("new-question", question);

    res.status(201).json({
      message: "Question submitted successfully",
      question,
    });
  } catch (error) {
    console.error("SUBMIT QUESTION ERROR:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// GET ALL QUESTIONS FOR A SESSION
export const getQuestions = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const questions = await Question.find({ sessionId }).sort({ createdAt: 1 });
    res.status(200).json({ questions });
  } catch (error) {
    console.error("GET QUESTIONS ERROR:", error);
    res.status(500).json({ message: "Server error", error });
  }
};