import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('DB connected successfully');
  } catch (error) {
    console.error('Mongo connection failed');
    process.exit(1); //exit app if db not connected
  }
};
export default connectDB;
