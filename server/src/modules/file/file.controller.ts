import type { Request, Response, NextFunction } from 'express';
import type { IFileService } from './file.service.js';
import fs from 'fs';
import { createWriteStream } from 'fs';
import { rm } from 'fs/promises';

export class FileController {
    constructor(private readonly fileService: IFileService) {}

    getFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = typeof req.params.id === 'string' ? req.params.id : String(req.params.id);
            const userId = String(req.user!._id);
            const { action } = req.query;

            const { file, filePath } = await this.fileService.getFile(id, userId);

            if (!fs.existsSync(filePath)) {
                res.status(404).json({ success: false, message: 'File not found on storage disk' });
                return;
            }

            if (action === 'download') {
                res.download(filePath, file.name || 'downloaded-file');
                return;
            }

            res.sendFile(filePath);
        } catch (error) {
            next(error);
        }
    };

    uploadStream = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = req.user!;
            const paramFilename = typeof req.params.filename === 'string' ? req.params.filename : undefined;
            const queryFilename = typeof req.query.filename === 'string' ? req.query.filename : undefined;
            const filename = paramFilename || queryFilename || 'untitled';

            const rawParentDir = (req.headers.parentdirid as string) || req.body?.parentDirId || null;
            const parentDirId = typeof rawParentDir === 'string' ? rawParentDir : null;
            const declaredSize = Number(req.headers['content-length'] || 0);

            const { file, filePath } = await this.fileService.createFileRecord({
                name: filename,
                parentDirId,
                size: declaredSize,
                user,
            });

            const writeStream = createWriteStream(filePath);
            let writtenBytes = 0;
            let aborted = false;

            req.on('data', async (chunk: Buffer) => {
                if (aborted) return;
                writtenBytes += chunk.length;

                if (declaredSize > 0 && writtenBytes > declaredSize) {
                    aborted = true;
                    writeStream.destroy();
                    await rm(filePath).catch(() => {});
                    await this.fileService.deleteFile(String(file._id), String(user._id)).catch(() => {});
                    res.status(413).json({ success: false, message: 'Uploaded file size exceeded declared limit' });
                }
            });

            req.pipe(writeStream);

            writeStream.on('finish', () => {
                if (!aborted) {
                    res.status(201).json({
                        success: true,
                        message: 'File uploaded successfully',
                        data: file,
                    });
                }
            });

            writeStream.on('error', async (err) => {
                await rm(filePath).catch(() => {});
                next(err);
            });
        } catch (error) {
            next(error);
        }
    };

    renameFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = typeof req.params.id === 'string' ? req.params.id : String(req.params.id);
            const { newFileName, name } = req.body;
            const targetName = newFileName || name;
            const userId = String(req.user!._id);

            const updated = await this.fileService.renameFile(id, targetName, userId);

            res.status(200).json({
                success: true,
                message: 'File renamed successfully',
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = typeof req.params.id === 'string' ? req.params.id : String(req.params.id);
            const userId = String(req.user!._id);

            const deleted = await this.fileService.deleteFile(id, userId);

            res.status(200).json({
                success: true,
                message: 'File deleted successfully',
                data: deleted,
            });
        } catch (error) {
            next(error);
        }
    };

    generatePresignedUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { fileName, ContentLength, ContentType, parentDirId } = req.body;
            const user = req.user!;

            const result = await this.fileService.generatePresignedUrl({
                fileName,
                contentLength: Number(ContentLength),
                contentType: ContentType,
                parentDirId,
                user,
            });

            res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
}
