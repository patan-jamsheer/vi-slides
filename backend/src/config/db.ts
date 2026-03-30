import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("Connecting to:", process.env.MONGO_URI); // debug line
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("MongoDB Connected ✅");
  } catch (error) {
    console.error("MongoDB connection failed ❌", error);
    process.exit(1);
  }
};

export default connectDB;