import type { Request, Response, NextFunction } from 'express';
import type { IDirectoryService } from './directory.service.js';

export class DirectoryController {
    constructor(private readonly directoryService: IDirectoryService) {}

    createDirectory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { name, dirname, parentDirId } = req.body;
            const paramDirname = typeof req.params.dirname === 'string' ? req.params.dirname : undefined;
            const dirName = name || dirname || paramDirname;
            const userId = String(req.user!._id);

            const savedDir = await this.directoryService.createDirectory({
                name: dirName,
                parentDirId,
                userId,
            });

            res.status(201).json({
                success: true,
                message: 'Directory created successfully',
                data: savedDir,
            });
        } catch (error) {
            next(error);
        }
    };

    getDirectoryContents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dirId = (typeof req.params.id === 'string' ? req.params.id : undefined) || (typeof req.query.dirId === 'string' ? req.query.dirId : undefined);
            const userId = String(req.user!._id);

            const contents = await this.directoryService.getDirectoryContents(dirId, userId);

            res.status(200).json({
                success: true,
                data: contents,
            });
        } catch (error) {
            next(error);
        }
    };

    renameDirectory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = typeof req.params.id === 'string' ? req.params.id : String(req.params.id);
            const { newDirName, name } = req.body;
            const targetName = newDirName || name;
            const userId = String(req.user!._id);

            const updated = await this.directoryService.renameDirectory(id, targetName, userId);

            res.status(200).json({
                success: true,
                message: 'Directory renamed successfully',
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteDirectory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = typeof req.params.id === 'string' ? req.params.id : String(req.params.id);
            const userId = String(req.user!._id);

            const result = await this.directoryService.deleteDirectory(id, userId);

            res.status(200).json({
                success: true,
                message: 'Directory and all its contents deleted successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
}
