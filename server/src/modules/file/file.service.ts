import path from 'path';
import { Types } from 'mongoose';
import type { IFile, IUser } from '../../shared/types/index.js';
import type { IFileRepository } from './file.repository.js';
import type { IDirectoryRepository } from '../directory/directory.repository.js';
import type { IFileStorage, IUploadUrlSigner } from '../../providers/storage/file-storage.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../shared/errors/AppError.js';

export interface CreateFileParams {
    name: string;
    parentDirId?: string | null;
    size: number;
    user: IUser;
}

export interface IFileService {
    getFile(fileId: string, userId: string): Promise<{ file: IFile; filePath: string }>;
    createFileRecord(params: CreateFileParams): Promise<{ file: IFile; filePath: string }>;
    deleteFile(fileId: string, userId: string): Promise<IFile>;
    renameFile(fileId: string, newName: string, userId: string): Promise<IFile>;
    getUsedStorage(userId: string): Promise<number>;
    generatePresignedUrl(params: {
        fileName: string;
        contentLength: number;
        contentType: string;
        parentDirId?: string;
        user: IUser;
    }): Promise<{ fileId: string; url: string }>;
}

export class FileService implements IFileService {
    constructor(
        private readonly fileRepository: IFileRepository,
        private readonly directoryRepository: IDirectoryRepository,
        private readonly storage: IFileStorage,
        private readonly uploadSigner: IUploadUrlSigner | null = null,
    ) {}

    private objectKey(file: Pick<IFile, '_id' | 'extension'>): string {
        return `${String(file._id)}${file.extension || ''}`;
    }

    async getUsedStorage(userId: string): Promise<number> {
        return this.fileRepository.getTotalStorageUsed(userId);
    }

    private async updateDirectoryHierarchySize(
        startParentDirId: Types.ObjectId | null | undefined,
        sizeDelta: number,
    ): Promise<void> {
        let currentId = startParentDirId ? String(startParentDirId) : null;
        while (currentId) {
            const dir = await this.directoryRepository.incrementDirectorySize(currentId, sizeDelta);
            if (!dir || !dir.parentDirId) break;
            currentId = String(dir.parentDirId);
        }
    }

    private async getOwnedFile(fileId: string, userId: string): Promise<IFile> {
        const file = await this.fileRepository.findFileById(fileId);
        if (!file) throw new NotFoundError('File not found');
        if (String(file.userId) !== userId) {
            throw new ForbiddenError('Access denied to this file');
        }
        return file;
    }

    async getFile(fileId: string, userId: string): Promise<{ file: IFile; filePath: string }> {
        const file = await this.getOwnedFile(fileId, userId);
        return { file, filePath: this.storage.resolvePath(this.objectKey(file)) };
    }

    async createFileRecord({ name, parentDirId, size, user }: CreateFileParams): Promise<{ file: IFile; filePath: string }> {
        // Check user quota
        const usedStorage = await this.fileRepository.getTotalStorageUsed(String(user._id));
        if (usedStorage + size > user.maxStorageInBytes) {
            throw new BadRequestError('Storage limit exceeded. Please upgrade your subscription plan.');
        }

        let targetParentDirId: Types.ObjectId;
        if (parentDirId) {
            const dir = await this.directoryRepository.findDirectoryById(parentDirId);
            if (!dir || String(dir.userId) !== String(user._id)) {
                throw new ForbiddenError('Invalid parent directory');
            }
            targetParentDirId = new Types.ObjectId(parentDirId);
        } else {
            let root = await this.directoryRepository.findUserRootDirectory(String(user._id));
            if (!root) {
                root = await this.directoryRepository.createDirectory({
                    name: `root-${user.email}`,
                    userId: new Types.ObjectId(String(user._id)),
                    parentDirId: null,
                    size: 0,
                });
            }
            targetParentDirId = new Types.ObjectId(String(root._id));
        }

        const extension = path.extname(name);
        const file = await this.fileRepository.createFile({
            name,
            extension,
            parentDirId: targetParentDirId,
            userId: new Types.ObjectId(String(user._id)),
            size,
        });

        await this.updateDirectoryHierarchySize(targetParentDirId, size);

        return { file, filePath: this.storage.resolvePath(this.objectKey(file)) };
    }

    async deleteFile(fileId: string, userId: string): Promise<IFile> {
        const file = await this.getOwnedFile(fileId, userId);

        await this.fileRepository.deleteFileById(fileId);

        try {
            await this.storage.remove(this.objectKey(file));
        } catch (err) {
            console.error(`Failed to delete stored object for file ${fileId}`, err);
        }

        if (file.parentDirId) {
            await this.updateDirectoryHierarchySize(file.parentDirId, -file.size);
        }

        return file;
    }

    async renameFile(fileId: string, newName: string, userId: string): Promise<IFile> {
        if (!newName || newName.trim() === '') {
            throw new BadRequestError('New file name is required');
        }

        await this.getOwnedFile(fileId, userId);

        const updated = await this.fileRepository.updateFileName(fileId, newName.trim());
        if (!updated) throw new NotFoundError('Failed to rename file');
        return updated;
    }

    async generatePresignedUrl({
        fileName,
        contentLength,
        contentType,
        parentDirId,
        user,
    }: {
        fileName: string;
        contentLength: number;
        contentType: string;
        parentDirId?: string;
        user: IUser;
    }): Promise<{ fileId: string; url: string }> {
        if (!this.uploadSigner) {
            throw new BadRequestError('S3 bucket is not configured on the server');
        }
        if (!fileName || !Number.isFinite(contentLength) || contentLength <= 0) {
            throw new BadRequestError('fileName and a positive ContentLength are required');
        }

        const { file } = await this.createFileRecord({
            name: fileName,
            parentDirId,
            size: contentLength,
            user,
        });

        const url = await this.uploadSigner.createUploadUrl({
            key: `${String(user._id)}/${String(file._id)}-${fileName}`,
            contentLength,
            contentType,
        });

        return { fileId: String(file._id), url };
    }
}
