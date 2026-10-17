import { Router } from 'express';
import type { DirectoryController } from './directory.controller.js';
import type { SessionMiddleware } from '../../middlewares/session.middleware.js';
import type { AuthMiddleware } from '../../middlewares/auth.middleware.js';

export function createDirectoryRouter(
    directoryController: DirectoryController,
    sessionMiddleware: SessionMiddleware,
    authMiddleware: AuthMiddleware,
): Router {
    const router = Router();
    const requireAuth = [sessionMiddleware.checkSession, authMiddleware.checkUser];

    router.use(...requireAuth);

    router.post('/', directoryController.createDirectory);
    router.post('/:dirname', directoryController.createDirectory);
    router.get('/', directoryController.getDirectoryContents);
    router.get('/:id', directoryController.getDirectoryContents);
    router.patch('/:id', directoryController.renameDirectory);
    router.delete('/:id', directoryController.deleteDirectory);

    return router;
}
