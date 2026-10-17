import { Types } from 'mongoose';
import type { IDirectory, IFile } from '../../shared/types/index.js';
import type { IDirectoryRepository } from './directory.repository.js';
import type { IFileRepository } from '../file/file.repository.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../shared/errors/AppError.js';

export interface CreateDirectoryParams {
    name: string;
    parentDirId?: string | null;
    userId: string;
}

export interface DirectoryContents {
    directory: IDirectory;
    directories: IDirectory[];
    files: IFile[];
}

export interface IDirectoryService {
    createDirectory(params: CreateDirectoryParams): Promise<IDirectory>;
    getDirectoryContents(dirId: string | undefined, userId: string): Promise<DirectoryContents>;
    renameDirectory(dirId: string, newName: string, userId: string): Promise<IDirectory>;
    deleteDirectory(dirId: string, userId: string): Promise<{ deletedDirectories: number; deletedFiles: number }>;
    getOrCreateRootDirectory(userId: string, email: string): Promise<IDirectory>;
}

export class DirectoryService implements IDirectoryService {
    constructor(
        private readonly directoryRepository: IDirectoryRepository,
        private readonly fileRepository: IFileRepository,
    ) {}

    async getOrCreateRootDirectory(userId: string, email: string): Promise<IDirectory> {
        let root = await this.directoryRepository.findUserRootDirectory(userId);
        if (!root) {
            root = await this.directoryRepository.createDirectory({
                name: `root-${email}`,
                userId: new Types.ObjectId(userId),
                parentDirId: null,
                size: 0,
            });
        }
        return root;
    }

    async createDirectory({ name, parentDirId, userId }: CreateDirectoryParams): Promise<IDirectory> {
        if (!name || name.trim() === '') {
            throw new BadRequestError('Directory name is required');
        }

        let parentObjectId: Types.ObjectId | null = null;
        if (parentDirId) {
            const parent = await this.directoryRepository.findDirectoryById(parentDirId);
            if (!parent) {
                throw new NotFoundError('Parent directory not found');
            }
            if (String(parent.userId) !== userId) {
                throw new ForbiddenError('You do not have access to this parent directory');
            }
            parentObjectId = new Types.ObjectId(parentDirId);
        } else {
            // Find root directory
            const root = await this.directoryRepository.findUserRootDirectory(userId);
            if (root) {
                parentObjectId = new Types.ObjectId(String(root._id));
            }
        }

        return this.directoryRepository.createDirectory({
            name: name.trim(),
            parentDirId: parentObjectId,
            userId: new Types.ObjectId(userId),
            size: 0,
        });
    }

    async getDirectoryContents(dirId: string | undefined, userId: string): Promise<DirectoryContents> {
        let targetDir: IDirectory | null = null;

        if (dirId) {
            targetDir = await this.directoryRepository.findDirectoryById(dirId);
        } else {
            targetDir = await this.directoryRepository.findUserRootDirectory(userId);
        }

        if (!targetDir) {
            throw new NotFoundError('Directory not found');
        }

        if (String(targetDir.userId) !== userId) {
            throw new ForbiddenError('Access denied to this directory');
        }

        const effectiveDirId = String(targetDir._id);
        const [directories, files] = await Promise.all([
            this.directoryRepository.findDirectoriesByParentId(effectiveDirId, userId),
            this.fileRepository.findFilesByParentId(effectiveDirId, userId),
        ]);

        return {
            directory: targetDir,
            directories,
            files,
        };
    }

    async renameDirectory(dirId: string, newName: string, userId: string): Promise<IDirectory> {
        if (!newName || newName.trim() === '') {
            throw new BadRequestError('New directory name is required');
        }

        const dir = await this.directoryRepository.findDirectoryById(dirId);
        if (!dir) throw new NotFoundError('Directory not found');

        if (String(dir.userId) !== userId) {
            throw new ForbiddenError('Access denied');
        }

        if (!dir.parentDirId) {
            throw new BadRequestError('Cannot rename root directory');
        }

        const updated = await this.directoryRepository.updateDirectoryName(dirId, newName.trim());
        if (!updated) throw new NotFoundError('Failed to rename directory');
        return updated;
    }

    async deleteDirectory(dirId: string, userId: string): Promise<{ deletedDirectories: number; deletedFiles: number }> {
        const dir = await this.directoryRepository.findDirectoryById(dirId);
        if (!dir) throw new NotFoundError('Directory not found');

        if (String(dir.userId) !== userId) {
            throw new ForbiddenError('Access denied');
        }

        if (!dir.parentDirId) {
            throw new BadRequestError('Cannot delete root directory');
        }

        // Recursively collect all descendant directories and files
        const dirIdsToDelete: string[] = [dirId];
        const fileIdsToDelete: string[] = [];

        const collectDescendants = async (currentDirId: string) => {
            const [childDirs, childFiles] = await Promise.all([
                this.directoryRepository.findDirectoriesByParentId(currentDirId, userId),
                this.fileRepository.findFilesByParentId(currentDirId, userId),
            ]);

            for (const file of childFiles) {
                fileIdsToDelete.push(String(file._id));
            }

            for (const childDir of childDirs) {
                const childIdStr = String(childDir._id);
                dirIdsToDelete.push(childIdStr);
                await collectDescendants(childIdStr);
            }
        };

        await collectDescendants(dirId);

        const [deletedFilesCount, deletedDirsCount] = await Promise.all([
            fileIdsToDelete.length > 0 ? this.fileRepository.deleteFilesByIds(fileIdsToDelete) : 0,
            this.directoryRepository.deleteDirectoriesByIds(dirIdsToDelete),
        ]);

        return {
            deletedDirectories: deletedDirsCount,
            deletedFiles: deletedFilesCount,
        };
    }
}
