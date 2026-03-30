import mongoose, { Document, Schema } from "mongoose";

export interface ISession extends Document {
  teacherId: mongoose.Types.ObjectId;
  code: string;
  status: "waiting" | "active" | "paused" | "ended";
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    code: { type: String, required: true, unique: true },
    status: { type: String, enum: ["waiting", "active", "paused", "ended"], default: "waiting" },
  },
  { timestamps: true }
);

export default mongoose.model<ISession>("Session", SessionSchema);