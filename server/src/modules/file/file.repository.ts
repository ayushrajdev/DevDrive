import type { Types } from 'mongoose';
import File from '../../models/file.model.js';
import type { IFile } from '../../shared/types/index.js';

export interface CreateFileData {
    _id?: Types.ObjectId;
    name: string;
    extension: string;
    parentDirId: Types.ObjectId;
    userId: Types.ObjectId;
    size: number;
}

export interface IFileRepository {
    createFile(data: CreateFileData): Promise<IFile>;
    findFileById(id: string): Promise<IFile | null>;
    findFilesByParentId(parentDirId: string, userId: string): Promise<IFile[]>;
    findFilesByUserId(userId: string): Promise<IFile[]>;
    updateFileName(id: string, name: string): Promise<IFile | null>;
    deleteFileById(id: string): Promise<IFile | null>;
    deleteFilesByIds(ids: string[]): Promise<number>;
    getTotalStorageUsed(userId: string): Promise<number>;
}

export class MongoFileRepository implements IFileRepository {
    async createFile(data: CreateFileData): Promise<IFile> {
        const file = await File.create(data);
        return file.toObject() as unknown as IFile;
    }

    async findFileById(id: string): Promise<IFile | null> {
        return File.findById(id).lean() as Promise<IFile | null>;
    }

    async findFilesByParentId(parentDirId: string, userId: string): Promise<IFile[]> {
        return File.find({ parentDirId, userId }).lean() as Promise<IFile[]>;
    }

    async findFilesByUserId(userId: string): Promise<IFile[]> {
        return File.find({ userId }).lean() as Promise<IFile[]>;
    }

    async updateFileName(id: string, name: string): Promise<IFile | null> {
        return File.findByIdAndUpdate(
            id,
            { $set: { name } },
            { new: true },
        ).lean() as Promise<IFile | null>;
    }

    async deleteFileById(id: string): Promise<IFile | null> {
        return File.findByIdAndDelete(id).lean() as Promise<IFile | null>;
    }

    async deleteFilesByIds(ids: string[]): Promise<number> {
        const res = await File.deleteMany({ _id: { $in: ids } });
        return res.deletedCount;
    }

    async getTotalStorageUsed(userId: string): Promise<number> {
        const result = await File.aggregate([
            { $match: { userId: new (File.base.Types.ObjectId)(userId) } },
            { $group: { _id: null, totalSize: { $sum: '$size' } } },
        ]);
        return result[0]?.totalSize || 0;
    }
}
