import mongoose from 'mongoose';
import { ENV } from '../../utils/env.js';

export async function connectDb() {
    await mongoose.connect(ENV.MONGODB_URL);
}

export async function disConnectDb() {
    await mongoose.disconnect();
}
