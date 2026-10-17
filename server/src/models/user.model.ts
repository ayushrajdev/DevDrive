import { model, Schema } from 'mongoose';
import type { IUser } from '../shared/types/index.js';

const userSchema = new Schema<IUser>(
    {
        name: { type: String },
        email: {
            type: String,
            required: [true, 'email field is required'],
            match: [
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                'email is invalid',
            ],
            unique: true,
        },
        password: { type: String },
        rootDirId: {
            type: Schema.Types.ObjectId,
            ref: 'Directory',
        },
        picture: {
            type: String,
            default: '',
        },
        authProvider: {
            type: String,
            enum: ['google', 'email', 'facebook', 'github'],
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'manager', 'owner'],
            default: 'user',
        },
        deleted: {
            type: Boolean,
            default: false,
        },
        maxStorageInBytes: {
            type: Number,
            required: true,
            default: 1024 ** 3, // 1 GB default
        },
        providerSubscriptionId: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

const User = model<IUser>('User', userSchema);
export default User;
