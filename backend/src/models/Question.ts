import mongoose, { Document, Schema } from "mongoose";

export interface IQuestion extends Document {
  sessionId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  text: string;
  isAnonymous: boolean;
  status: "pending" | "ai-answered" | "teacher-answered";
  aiAnswer?: string;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "ai-answered", "teacher-answered"],
      default: "pending",
    },
    aiAnswer: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IQuestion>("Question", QuestionSchema);