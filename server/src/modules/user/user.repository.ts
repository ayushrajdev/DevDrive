import User from '../../models/user.model.js';
import type { IUser, AuthProvider, UserRole } from '../../shared/types/index.js';
import type { Types } from 'mongoose';

export interface CreateUserData {
    name?: string;
    email: string;
    password?: string;
    authProvider?: AuthProvider;
    picture?: string;
    rootDirId?: Types.ObjectId;
}

export interface IUserRepository {
    createUser(data: CreateUserData): Promise<IUser>;
    findUserByEmail(email: string): Promise<IUser | null>;
    findUserById(id: string): Promise<IUser | null>;
    getAllUsers(): Promise<IUser[]>;
    getActiveUsers(): Promise<IUser[]>;
    getDisabledUsers(): Promise<IUser[]>;
    updateUser(id: string, data: Partial<IUser>): Promise<IUser | null>;
    softDeleteUser(id: string): Promise<IUser | null>;
    hardDeleteUser(id: string): Promise<IUser | null>;
    recoverUser(id: string): Promise<IUser | null>;
    updateRole(id: string, role: UserRole): Promise<IUser | null>;
    upsertOAuthUser(data: CreateUserData): Promise<IUser>;
    setPassword(id: string, hashedPassword: string): Promise<IUser | null>;
}

export class MongoUserRepository implements IUserRepository {
    async createUser(data: CreateUserData): Promise<IUser> {
        const user = await User.create(data);
        return user.toObject() as unknown as IUser;
    }

    async upsertOAuthUser(data: CreateUserData): Promise<IUser> {
        const user = await User.findOneAndUpdate(
            { email: data.email },
            {
                $setOnInsert: { email: data.email },
                $set: {
                    name: data.name,
                    picture: data.picture,
                    authProvider: data.authProvider,
                },
            },
            { upsert: true, new: true },
        ).lean();
        return user as IUser;
    }

    async findUserByEmail(email: string): Promise<IUser | null> {
        return User.findOne({ email }).lean() as Promise<IUser | null>;
    }

    async findUserById(id: string): Promise<IUser | null> {
        return User.findById(id).lean() as Promise<IUser | null>;
    }

    async getAllUsers(): Promise<IUser[]> {
        return User.find().lean() as Promise<IUser[]>;
    }

    async getActiveUsers(): Promise<IUser[]> {
        return User.find({ deleted: false }).lean() as Promise<IUser[]>;
    }

    async getDisabledUsers(): Promise<IUser[]> {
        return User.find({ deleted: true }).lean() as Promise<IUser[]>;
    }

    async updateUser(id: string, data: Partial<IUser>): Promise<IUser | null> {
        return User.findByIdAndUpdate(id, { $set: data }, { new: true }).lean() as Promise<IUser | null>;
    }

    async softDeleteUser(id: string): Promise<IUser | null> {
        return User.findByIdAndUpdate(
            id,
            { $set: { deleted: true } },
            { new: true },
        ).lean() as Promise<IUser | null>;
    }

    async hardDeleteUser(id: string): Promise<IUser | null> {
        return User.findByIdAndDelete(id).lean() as Promise<IUser | null>;
    }

    async recoverUser(id: string): Promise<IUser | null> {
        return User.findByIdAndUpdate(
            id,
            { $set: { deleted: false } },
            { new: true },
        ).lean() as Promise<IUser | null>;
    }

    async updateRole(id: string, role: UserRole): Promise<IUser | null> {
        return User.findByIdAndUpdate(
            id,
            { $set: { role } },
            { new: true },
        ).lean() as Promise<IUser | null>;
    }

    async setPassword(id: string, hashedPassword: string): Promise<IUser | null> {
        return User.findByIdAndUpdate(
            id,
            { $set: { password: hashedPassword } },
            { new: true },
        ).lean() as Promise<IUser | null>;
    }
}
