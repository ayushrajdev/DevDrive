import { model, Schema } from 'mongoose';
import type { IFile } from '../shared/types/index.js';

const fileSchema = new Schema<IFile>(
    {
        name: { type: String },
        extension: { type: String },
        parentDirId: {
            type: Schema.Types.ObjectId,
            ref: 'Directory',
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        size: {
            type: Number,
            default: 0,
            required: true,
        },
    },
    {
        timestamps: true,
        strict: 'throw',
    },
);

const File = model<IFile>('File', fileSchema);
export default File;
