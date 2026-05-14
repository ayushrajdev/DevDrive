import mongoose from 'mongoose';

const url = 'mongodb://localhost:27017/DevDrive';

export async function connectDb() {
    await mongoose.connect(url);
}

export async function disConnectDb() {
    await mongoose.disconnect();
}
