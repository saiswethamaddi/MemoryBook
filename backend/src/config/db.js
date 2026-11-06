import dns from 'node:dns';
import mongoose from 'mongoose';

dns.setServers(['8.8.8.8', '1.1.1.1']);

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) throw new Error('MONGODB_URI is missing. Add it to backend/.env.');

  await mongoose.connect(uri, {
  serverSelectionTimeoutMS: 15000
});

  console.log('Connected to MongoDB');
}