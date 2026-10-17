import { Schema, model } from 'mongoose';
import type { IOtp } from '../shared/types/index.js';

const otpSchema = new Schema<IOtp>({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300, // 5 minutes TTL
    },
});

const Otp = model<IOtp>('Otp', otpSchema);
export default Otp;
