import type { Request, Response, NextFunction } from 'express';
import type { IUserRepository } from '../modules/user/user.repository.js';

export class AuthMiddleware {
    constructor(private readonly userRepository: IUserRepository) {}

    checkUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized: No active session identity found',
                });
                return;
            }

            const user = await this.userRepository.findUserById(userId);
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'User belonging to this session no longer exists',
                });
                return;
            }

            if (user.deleted) {
                res.status(403).json({
                    success: false,
                    message: 'Your account has been deactivated. Please contact support.',
                });
                return;
            }

            req.user = user;
            next();
        } catch (error) {
            next(error);
        }
    };
}
