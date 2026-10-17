import { Router } from 'express';
import type { FileController } from './file.controller.js';
import type { SessionMiddleware } from '../../middlewares/session.middleware.js';
import type { AuthMiddleware } from '../../middlewares/auth.middleware.js';

export function createFileRouter(
    fileController: FileController,
    sessionMiddleware: SessionMiddleware,
    authMiddleware: AuthMiddleware,
): Router {
    const router = Router();
    const requireAuth = [sessionMiddleware.checkSession, authMiddleware.checkUser];

    router.use(...requireAuth);

    router.post('/upload-stream/:filename', fileController.uploadStream);
    router.post('/presigned-url', fileController.generatePresignedUrl);
    router.get('/:id', fileController.getFile);
    router.patch('/:id', fileController.renameFile);
    router.delete('/:id', fileController.deleteFile);

    return router;
}
