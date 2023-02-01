import mongoose from "mongoose";
mongoose.set("strictQuery", false);
export const connectDB = async () => {
  const { connection } = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDb Connected with ${connection.host}`);
};
