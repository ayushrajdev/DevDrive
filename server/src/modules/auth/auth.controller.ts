import type { Request, Response, NextFunction } from 'express';
import type { IAuthService } from './auth.service.js';
import { ENV } from '../../shared/utils/env.js';

export class AuthController {
    constructor(private readonly authService: IAuthService) {}

    private setSessionCookie(res: Response, sessionId: string): void {
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: ENV.NODE_ENV === 'production',
            sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
            signed: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }

    loginWithGoogle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const idToken = req.body?.idToken || req.body?.credential || req.headers['x-google-token'] as string;
            if (!idToken) {
                res.status(400).json({ success: false, message: 'Google ID token is required' });
                return;
            }

            const result = await this.authService.loginWithGoogle(idToken);
            this.setSessionCookie(res, result.sessionId);

            res.status(200).json({
                success: true,
                message: 'Google login successful',
                data: result.user,
            });
        } catch (error) {
            next(error);
        }
    };

    redirectToGithub = (_req: Request, res: Response): void => {
        const url = this.authService.getGithubAuthUrl();
        res.redirect(url);
    };

    handleGithubCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const code = req.query.code as string;
            if (!code) {
                res.status(400).send(`
                    <script>
                        window.opener?.postMessage(${JSON.stringify({ success: false, message: 'Missing auth code' })}, "${ENV.FRONTEND_URL}");
                        window.close();
                    </script>
                `);
                return;
            }

            const result = await this.authService.handleGithubCallback(code);
            this.setSessionCookie(res, result.sessionId);

            res.send(`
                <!DOCTYPE html>
                <html>
                <body>
                    <script>
                        window.opener?.postMessage(
                            ${JSON.stringify({ success: true, sessionId: result.sessionId, user: result.user })},
                            "${ENV.FRONTEND_URL}"
                        );
                        window.close();
                    </script>
                    <p>Authentication successful. You may close this window.</p>
                </body>
                </html>
            `);
        } catch (error: any) {
            res.send(`
                <!DOCTYPE html>
                <html>
                <body>
                    <script>
                        window.opener?.postMessage(
                            ${JSON.stringify({ success: false, message: error?.message || 'Authentication failed' })},
                            "${ENV.FRONTEND_URL}"
                        );
                        window.close();
                    </script>
                    <p>Authentication failed. Please close this window and try again.</p>
                </body>
                </html>
            `);
        }
    };

    setCookie = (req: Request, res: Response): void => {
        const sessionId = (req.query.sessionId as string) || req.body?.sessionId;
        if (!sessionId) {
            res.status(400).json({ success: false, message: 'Session ID is required' });
            return;
        }

        this.setSessionCookie(res, sessionId);
        res.status(200).json({ success: true, message: 'Session cookie registered' });
    };
}
