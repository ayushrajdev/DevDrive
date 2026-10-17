import { model, Schema } from 'mongoose';
import type { IDirectory } from '../shared/types/index.js';

const directorySchema = new Schema<IDirectory>(
    {
        name: { type: String },
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        parentDirId: {
            type: Schema.Types.ObjectId,
            default: null,
            ref: 'Directory',
        },
        size: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    },
);

const Directory = model<IDirectory>('Directory', directorySchema);
export default Directory;
