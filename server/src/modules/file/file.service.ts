import path from 'path';
import fs from 'fs';
import { rm } from 'fs/promises';
import { Types } from 'mongoose';
import type { IFile, IUser } from '../../shared/types/index.js';
import type { IFileRepository } from './file.repository.js';
import type { IDirectoryRepository } from '../directory/directory.repository.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../shared/errors/AppError.js';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ENV } from '../../shared/utils/env.js';

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
    generatePresignedUrl(params: {
        fileName: string;
        contentLength: number;
        contentType: string;
        parentDirId?: string;
        user: IUser;
    }): Promise<{ fileId: string; url: string }>;
}

export class FileService implements IFileService {
    private readonly storageDir: string;
    private s3Client?: S3Client;

    constructor(
        private readonly fileRepository: IFileRepository,
        private readonly directoryRepository: IDirectoryRepository,
    ) {
        this.storageDir = path.resolve(process.cwd(), 'storage');
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
    }

    private getS3Client(): S3Client {
        if (!this.s3Client) {
            this.s3Client = new S3Client({
                region: process.env.AWS_REGION || 'ap-south-1',
            });
        }
        return this.s3Client;
    }

    private async updateDirectoryHierarchySize(startParentDirId: Types.ObjectId | null | undefined, sizeDelta: number): Promise<void> {
        let currentId = startParentDirId ? String(startParentDirId) : null;
        while (currentId) {
            const dir = await this.directoryRepository.incrementDirectorySize(currentId, sizeDelta);
            if (!dir || !dir.parentDirId) break;
            currentId = String(dir.parentDirId);
        }
    }

    async getFile(fileId: string, userId: string): Promise<{ file: IFile; filePath: string }> {
        const file = await this.fileRepository.findFileById(fileId);
        if (!file) throw new NotFoundError('File not found');

        if (String(file.userId) !== userId) {
            throw new ForbiddenError('Access denied to this file');
        }

        const filePath = path.join(this.storageDir, `${String(file._id)}${file.extension || ''}`);
        return { file, filePath };
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
            const root = await this.directoryRepository.findUserRootDirectory(String(user._id));
            if (!root) throw new NotFoundError('User root directory not found');
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

        const filePath = path.join(this.storageDir, `${String(file._id)}${extension}`);

        // Update directory hierarchy size
        await this.updateDirectoryHierarchySize(targetParentDirId, size);

        return { file, filePath };
    }

    async deleteFile(fileId: string, userId: string): Promise<IFile> {
        const file = await this.fileRepository.findFileById(fileId);
        if (!file) throw new NotFoundError('File not found');

        if (String(file.userId) !== userId) {
            throw new ForbiddenError('Access denied to this file');
        }

        await this.fileRepository.deleteFileById(fileId);

        // Delete physical file if exists
        const filePath = path.join(this.storageDir, `${String(file._id)}${file.extension || ''}`);
        try {
            if (fs.existsSync(filePath)) {
                await rm(filePath);
            }
        } catch (err) {
            console.error(`Failed to delete local file: ${filePath}`, err);
        }

        // Decrement directory hierarchy size
        if (file.parentDirId) {
            await this.updateDirectoryHierarchySize(file.parentDirId, -file.size);
        }

        return file;
    }

    async renameFile(fileId: string, newName: string, userId: string): Promise<IFile> {
        if (!newName || newName.trim() === '') {
            throw new BadRequestError('New file name is required');
        }

        const file = await this.fileRepository.findFileById(fileId);
        if (!file) throw new NotFoundError('File not found');

        if (String(file.userId) !== userId) {
            throw new ForbiddenError('Access denied to this file');
        }

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
        const bucket = process.env.S3_BUCKET;
        if (!bucket) {
            throw new BadRequestError('S3 bucket is not configured on the server');
        }

        const { file } = await this.createFileRecord({
            name: fileName,
            parentDirId,
            size: contentLength,
            user,
        });

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: `${String(user._id)}/${String(file._id)}-${fileName}`,
            ContentLength: contentLength,
            ContentType: contentType,
        });

        const client = this.getS3Client();
        const url = await getSignedUrl(client, command, {
            expiresIn: 3600,
            signableHeaders: new Set(['content-type']),
        });

        return {
            fileId: String(file._id),
            url,
        };
    }
}
