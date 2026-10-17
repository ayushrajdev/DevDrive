import { model, Schema } from 'mongoose';
import type { ISession } from '../shared/types/index.js';

const sessionSchema = new Schema<ISession>({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600, // 1 hour TTL
    },
});

const Session = model<ISession>('Session', sessionSchema);
export default Session;
