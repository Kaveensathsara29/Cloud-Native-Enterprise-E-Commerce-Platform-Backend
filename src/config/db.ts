import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || '');
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
  }
};

export default connectDB;
