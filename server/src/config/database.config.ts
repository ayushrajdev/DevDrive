import mongoose from 'mongoose';
import { ENV } from '../shared/utils/env.js';

export async function connectDb(): Promise<void> {
    await mongoose.connect(ENV.MONGODB_URL);
    console.info('MongoDB connected');
}

export async function disconnectDb(): Promise<void> {
    await mongoose.disconnect();
    console.info('MongoDB disconnected');
}
