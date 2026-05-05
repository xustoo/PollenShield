import mongoose from "mongoose";

export const mongodbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/pollenshield_environment";

export const connectDatabase = async (retries = 10): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(mongodbUri, { serverSelectionTimeoutMS: 10000 });
      console.log("Environmental Data Service connected to MongoDB");
      return;
    } catch (error) {
      console.error(`MongoDB connection failed, attempt ${attempt}/${retries}`, error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  throw new Error("Could not connect Environmental Data Service to MongoDB");
};
