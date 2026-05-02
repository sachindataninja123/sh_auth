import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URL);

    console.log("Database connected successfully");
  } catch (error) {
    console.log("Datanase connection error : ", error);
  }
};


export default connectDB