import type { Request, Response, NextFunction } from 'express';
import type { ISessionService } from '../modules/session/session.service.js';
import { UnauthorizedError } from '../shared/errors/AppError.js';

export class SessionMiddleware {
    constructor(private readonly sessionService: ISessionService) {}

    checkSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Check signedCookies first, fallback to regular cookies or Authorization header
            const sessionId =
                req.signedCookies?.sessionId ||
                req.cookies?.sessionId ||
                req.headers.authorization?.replace(/^Bearer\s+/i, '');

            if (!sessionId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required. Please login.',
                });
                return;
            }

            const userId = await this.sessionService.verifySession(sessionId);
            if (!userId) {
                res.clearCookie('sessionId');
                res.status(401).json({
                    success: false,
                    message: 'Session expired or invalid. Please login again.',
                });
                return;
            }

            req.userId = userId;
            next();
        } catch (error) {
            next(error);
        }
    };
}
