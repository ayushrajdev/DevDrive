import type { Types } from 'mongoose';
import Directory from '../../models/directory.model.js';
import type { IDirectory } from '../../shared/types/index.js';

export interface CreateDirectoryData {
    _id?: Types.ObjectId;
    name: string;
    userId: Types.ObjectId;
    parentDirId?: Types.ObjectId | null;
    size?: number;
}

export interface IDirectoryRepository {
    createDirectory(data: CreateDirectoryData): Promise<IDirectory>;
    findDirectoryById(id: string): Promise<IDirectory | null>;
    findDirectoriesByParentId(parentDirId: string | null, userId: string): Promise<IDirectory[]>;
    findUserRootDirectory(userId: string): Promise<IDirectory | null>;
    updateDirectoryName(id: string, name: string): Promise<IDirectory | null>;
    incrementDirectorySize(id: string, sizeDelta: number): Promise<IDirectory | null>;
    deleteDirectoryById(id: string): Promise<boolean>;
    deleteDirectoriesByIds(ids: string[]): Promise<number>;
    findAllUserDirectories(userId: string): Promise<IDirectory[]>;
}

export class MongoDirectoryRepository implements IDirectoryRepository {
    async createDirectory(data: CreateDirectoryData): Promise<IDirectory> {
        const dir = await Directory.create(data);
        return dir.toObject() as unknown as IDirectory;
    }

    async findDirectoryById(id: string): Promise<IDirectory | null> {
        return Directory.findById(id).lean() as Promise<IDirectory | null>;
    }

    async findDirectoriesByParentId(parentDirId: string | null, userId: string): Promise<IDirectory[]> {
        return Directory.find({
            parentDirId: parentDirId ? parentDirId : null,
            userId,
        }).lean() as Promise<IDirectory[]>;
    }

    async findUserRootDirectory(userId: string): Promise<IDirectory | null> {
        return Directory.findOne({
            userId,
            parentDirId: null,
        }).lean() as Promise<IDirectory | null>;
    }

    async updateDirectoryName(id: string, name: string): Promise<IDirectory | null> {
        return Directory.findByIdAndUpdate(
            id,
            { $set: { name } },
            { new: true },
        ).lean() as Promise<IDirectory | null>;
    }

    async incrementDirectorySize(id: string, sizeDelta: number): Promise<IDirectory | null> {
        return Directory.findByIdAndUpdate(
            id,
            { $inc: { size: sizeDelta } },
            { new: true },
        ).lean() as Promise<IDirectory | null>;
    }

    async deleteDirectoryById(id: string): Promise<boolean> {
        const res = await Directory.findByIdAndDelete(id);
        return !!res;
    }

    async deleteDirectoriesByIds(ids: string[]): Promise<number> {
        const res = await Directory.deleteMany({ _id: { $in: ids } });
        return res.deletedCount;
    }

    async findAllUserDirectories(userId: string): Promise<IDirectory[]> {
        return Directory.find({ userId }).lean() as Promise<IDirectory[]>;
    }
}
