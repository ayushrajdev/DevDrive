import { Router } from 'express';
import { UserController } from './user.controller.js';
import type { IUserService } from './user.service.js';
import type { SessionMiddleware } from '../../middlewares/session.middleware.js';
import type { AuthMiddleware } from '../../middlewares/auth.middleware.js';
import { authorizeRoles } from '../../middlewares/authorize-roles.middleware.js';

export function createUserRouter(
    userController: UserController,
    sessionMiddleware: SessionMiddleware,
    authMiddleware: AuthMiddleware,
): Router {
    const router = Router();
    const requireAuth = [sessionMiddleware.checkSession, authMiddleware.checkUser];

    // Public auth routes
    router.post('/register', userController.registerUser);
    router.post('/login', userController.loginUser);

    // Authenticated user routes
    router.post('/logout', ...requireAuth, userController.logoutUser);
    router.post('/logout/all-devices', ...requireAuth, userController.logoutFromAllDevices);
    router.get('/profile', ...requireAuth, userController.getUserInfo);
    router.post('/set-password', ...requireAuth, userController.setPassword);

    // Administrative & Management routes
    router.get('/admin/all', ...requireAuth, authorizeRoles('admin', 'manager', 'owner'), userController.getAllUsers);
    router.get('/admin/active', ...requireAuth, authorizeRoles('admin', 'manager', 'owner'), userController.getActiveUsers);
    router.get('/admin/disabled', ...requireAuth, authorizeRoles('admin', 'manager', 'owner'), userController.getDisabledUsers);

    // Assignment 1 & 2 & 3: Soft delete, hard delete, recover, change role
    router.delete('/admin/:id', ...requireAuth, authorizeRoles('admin', 'owner'), userController.softDeleteUser);
    router.delete('/admin/:id/hard', ...requireAuth, authorizeRoles('owner'), userController.hardDeleteUser);
    router.patch('/admin/:id/recover', ...requireAuth, authorizeRoles('admin', 'owner'), userController.recoverUser);
    router.patch('/admin/:id/role', ...requireAuth, authorizeRoles('admin', 'manager', 'owner'), userController.updateUserRole);

    return router;
}
