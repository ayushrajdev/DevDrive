import { Router } from 'express';
import type { AuthController } from './auth.controller.js';

export function createAuthRouter(authController: AuthController): Router {
    const router = Router();

    router.post('/google', authController.loginWithGoogle);
    router.get('/github', authController.redirectToGithub);
    router.get('/github/callback', authController.handleGithubCallback);
    router.get('/github/set-cookie', authController.setCookie);
    router.post('/set-cookie', authController.setCookie);

    return router;
}
