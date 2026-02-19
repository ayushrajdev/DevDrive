import mongoose, { model, Schema } from 'mongoose';

const directorySchema = new Schema(
    {
        name: String,
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        parentDirId: {
            type: Schema.Types.ObjectId ,
            default: null,
            ref: 'Directory',
        },
    },
    {
        timestamps: true,
    },
);

const Directory = model('Directory', directorySchema);
export default Directory;
