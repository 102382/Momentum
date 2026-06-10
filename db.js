import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME,
    });

    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB Error:", err.message);
  }
};