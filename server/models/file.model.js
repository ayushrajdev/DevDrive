import { model, Schema } from 'mongoose';

const FileSchema = new Schema(
    {
        name: String,
        extension: String,
        parentDirId: {
            type: Schema.Types.ObjectId,
            ref: 'Directory',
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
        strict: "throw",
    },
);


const File = model('File', FileSchema);
export default File