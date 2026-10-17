import type { Request, Response, NextFunction } from 'express';
import type { IUserService } from './user.service.js';
import type { UserRole } from '../../shared/types/index.js';
import { ENV } from '../../shared/utils/env.js';

export class UserController {
    constructor(private readonly userService: IUserService) {}

    private setSessionCookie(res: Response, sessionId: string): void {
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: ENV.NODE_ENV === 'production',
            sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
            signed: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }

    registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { name, email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Email and password are required',
                });
                return;
            }

            const result = await this.userService.registerWithEmail({ name, email, password });
            this.setSessionCookie(res, result.sessionId);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result.user,
            });
        } catch (error) {
            next(error);
        }
    };

    loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Email and password are required',
                });
                return;
            }

            const result = await this.userService.loginWithEmail({ email, password });
            this.setSessionCookie(res, result.sessionId);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result.user,
            });
        } catch (error) {
            next(error);
        }
    };

    logoutUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const sessionId = req.signedCookies?.sessionId || req.cookies?.sessionId;
            if (sessionId) {
                await this.userService.logout(sessionId);
            }
            res.clearCookie('sessionId');
            res.status(200).json({
                success: true,
                message: 'Logged out successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    logoutFromAllDevices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.userId || String(req.user?._id);
            if (userId) {
                await this.userService.logoutAllDevices(userId);
            }
            res.clearCookie('sessionId');
            res.status(200).json({
                success: true,
                message: 'Logged out from all active devices successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    getUserInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const { password: _p, ...safeUser } = req.user;
            res.status(200).json({
                success: true,
                data: safeUser,
            });
        } catch (error) {
            next(error);
        }
    };

    setPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.userId || String(req.user?._id);
            const { password } = req.body;
            if (!password) {
                res.status(400).json({ success: false, message: 'New password is required' });
                return;
            }
            await this.userService.setPassword(userId, password);
            res.status(200).json({
                success: true,
                message: 'Password successfully updated. You can now login with email and password.',
            });
        } catch (error) {
            next(error);
        }
    };

    // ── Admin & Management Handlers ──────────────────────────────────────────

    getAllUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const users = await this.userService.getAllUsers();
            res.status(200).json({ success: true, data: users });
        } catch (error) {
            next(error);
        }
    };

    getActiveUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const users = await this.userService.getActiveUsers();
            res.status(200).json({ success: true, data: users });
        } catch (error) {
            next(error);
        }
    };

    getDisabledUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const users = await this.userService.getDisabledUsers();
            res.status(200).json({ success: true, data: users });
        } catch (error) {
            next(error);
        }
    };

    softDeleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = typeof req.params.id === 'string' ? req.params.id : String(req.params.id);
            const updated = await this.userService.softDeleteUser(req.user!, id);
            res.status(200).json({
                success: true,
                message: 'User account has been soft-deleted (disabled)',
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    };

    hardDeleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = typeof req.params.id === 'string' ? req.params.id : String(req.params.id);
            await this.userService.hardDeleteUser(req.user!, id);
            res.status(200).json({
                success: true,
                message: 'User account permanently hard-deleted',
            });
        } catch (error) {
            next(error);
        }
    };

    recoverUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = typeof req.params.id === 'string' ? req.params.id : String(req.params.id);
            const recovered = await this.userService.recoverUser(req.user!, id);
            res.status(200).json({
                success: true,
                message: 'User account successfully reactivated',
                data: recovered,
            });
        } catch (error) {
            next(error);
        }
    };

    updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const id = typeof req.params.id === 'string' ? req.params.id : String(req.params.id);
            const { role } = req.body as { role: UserRole };
            if (!role) {
                res.status(400).json({ success: false, message: 'Role is required' });
                return;
            }
            const updated = await this.userService.updateRole(req.user!, id, role);
            res.status(200).json({
                success: true,
                message: `User role updated to ${role}`,
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    };
}
